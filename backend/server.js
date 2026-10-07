require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto"); // CAMBIO: módulo nativo de Node para hashear contraseñas (no necesita npm install)
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NUEVO: permite que el frontend (localhost:5173) llame al backend (localhost:3000)
// CAMBIO (modal): también acepta 5174 (Vite usa ese puerto si el 5173 está ocupado)
// y responde la petición previa OPTIONS que hace el navegador antes de enviar JSON
const ORIGENES_PERMITIDOS = ["http://localhost:5173", "http://localhost:5174"];
app.use((req, res, next) => {
  const origen = req.headers.origin;
  if (ORIGENES_PERMITIDOS.includes(origen)) {
    res.header("Access-Control-Allow-Origin", origen);
  }
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Conexión a Neon PostgreSQL usando la URL del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requerido para conexiones a Neon desde Node.js
  },
});

// ---------------------------------------------------------------
// CAMBIO: funciones para NO guardar la contraseña en texto plano
// Se guarda como "salt:hash" dentro de la misma columna password
// ---------------------------------------------------------------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex"); // CAMBIO: sal aleatoria única por usuario
  const hash = crypto.scryptSync(password, salt, 64).toString("hex"); // CAMBIO: hash con scrypt
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  // CAMBIO: compatibilidad con usuarios viejos que quedaron en texto plano
  if (!stored.includes(":")) return password === stored;

  const [salt, hash] = stored.split(":");
  const attempt = crypto.scryptSync(password, salt, 64);
  // CAMBIO: comparación segura contra ataques de tiempo
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, "hex"));
}

// 1. RUTA PRINCIPAL (sin cambios): sirve el menú principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------------------------------------------------------------
// CAMBIO (correo): validación simple del formato de correo
// ---------------------------------------------------------------
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CAMBIO (recuperar): el código de 6 dígitos se guarda cifrado (sha256)
function hashCodigo(codigo) {
  return crypto.createHash("sha256").update(String(codigo)).digest("hex");
}

// 2. RUTA REGISTRO
// CAMBIO: responde JSON para el modal
// CAMBIO (correo): ahora también pide correo (sirve para recuperar la contraseña)
app.post("/registro", async (req, res) => {
  const usuario = (req.body.usuario || "").trim();
  const correo = (req.body.correo || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (usuario.length < 3) {
    return res.status(400).json({
      ok: false,
      error: "El usuario debe tener al menos 3 caracteres.",
    });
  }
  if (!CORREO_VALIDO.test(correo)) {
    return res.status(400).json({
      ok: false,
      error: "Escribe un correo válido, por ejemplo nombre@correo.com.",
    });
  }
  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
    });
  }

  try {
    await pool.query(
      "INSERT INTO usuarios (usuario, correo, password) VALUES ($1, $2, $3)",
      [usuario, correo, hashPassword(password)],
    );
    res.status(201).json({ ok: true, usuario, correo });
  } catch (err) {
    console.error("🔴 ERROR EN NEON POSTGRESQL:", err);

    // 23505 = dato repetido (UNIQUE). Se revisa si fue el usuario o el correo
    if (err.code === "23505") {
      const esCorreo = String(err.constraint || err.detail || "").includes("correo");
      return res.status(409).json({
        ok: false,
        error: esCorreo
          ? "Ese correo ya tiene una cuenta. Prueba con \"¿Olvidaste tu contraseña?\"."
          : "Ese usuario ya existe. Elige otro nombre.",
      });
    }
    res.status(500).json({
      ok: false,
      error: "No pudimos registrar tu cuenta. Intenta de nuevo.",
    });
  }
});

// 3. RUTA LOGIN
// CAMBIO (correo): se puede entrar con el usuario o con el correo
app.post("/login", async (req, res) => {
  const identificador = (req.body.usuario || "").trim();
  const password = req.body.password || "";

  try {
    const result = await pool.query(
      `SELECT usuario, correo, password FROM usuarios
       WHERE usuario = $1 OR LOWER(correo) = LOWER($1)
       LIMIT 1`,
      [identificador],
    );

    const fila = result.rows[0];

    if (fila && verifyPassword(password, fila.password)) {
      // si la cuenta era antigua (texto plano), se actualiza a hash
      if (!fila.password.includes(":")) {
        await pool.query("UPDATE usuarios SET password = $1 WHERE usuario = $2", [
          hashPassword(password),
          fila.usuario,
        ]);
      }
      res.json({ ok: true, usuario: fila.usuario, correo: fila.correo });
    } else {
      // mismo mensaje exista o no el usuario (no revela cuál falló)
      res
        .status(401)
        .json({ ok: false, error: "Usuario, correo o contraseña incorrectos." });
    }
  } catch (err) {
    console.error("🔴 ERROR EN LOGIN:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error en el servidor. Intenta de nuevo." });
  }
});

// ---------------------------------------------------------------
// CAMBIO (recuperar): paso 1 — pedir un código con el correo.
// MODO PRUEBA: todavía no se envían correos de verdad. El código se
// muestra en esta terminal y se devuelve al frontend como
// "codigoPrueba" para poder probar. Cuando configuren un servicio de
// correo (por ejemplo nodemailer), envíen el código por correo y
// quiten "codigoPrueba" de la respuesta.
// ---------------------------------------------------------------
app.post("/recuperar", async (req, res) => {
  const correo = (req.body.correo || "").trim().toLowerCase();
  const mensaje =
    "Si ese correo tiene una cuenta, te enviamos un código de 6 dígitos.";

  if (!CORREO_VALIDO.test(correo)) {
    return res
      .status(400)
      .json({ ok: false, error: "Escribe un correo válido." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT usuario FROM usuarios WHERE LOWER(correo) = $1",
      [correo],
    );
    // misma respuesta exista o no, para no revelar qué correos están registrados
    if (!rows[0]) return res.json({ ok: true, mensaje });

    const codigo = String(crypto.randomInt(100000, 1000000));
    await pool.query(
      `UPDATE usuarios
       SET codigo_recuperacion = $1, codigo_expira = NOW() + INTERVAL '15 minutes'
       WHERE LOWER(correo) = $2`,
      [hashCodigo(codigo), correo],
    );

    console.log(`📧 [MODO PRUEBA] Código para ${correo}: ${codigo}`);
    res.json({ ok: true, mensaje, codigoPrueba: codigo });
  } catch (err) {
    console.error("🔴 ERROR EN RECUPERAR:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error en el servidor. Intenta de nuevo." });
  }
});

// CAMBIO (recuperar): paso 2 — cambiar la contraseña con el código
app.post("/restablecer", async (req, res) => {
  const correo = (req.body.correo || "").trim().toLowerCase();
  const codigo = (req.body.codigo || "").trim();
  const password = req.body.password || "";

  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      error: "La nueva contraseña debe tener al menos 6 caracteres.",
    });
  }

  try {
    const { rows } = await pool.query(
      `SELECT usuario FROM usuarios
       WHERE LOWER(correo) = $1
         AND codigo_recuperacion = $2
         AND codigo_expira > NOW()`,
      [correo, hashCodigo(codigo)],
    );
    if (!rows[0]) {
      return res.status(400).json({
        ok: false,
        error: "El código no es correcto o ya venció. Pide uno nuevo.",
      });
    }

    await pool.query(
      `UPDATE usuarios
       SET password = $1, codigo_recuperacion = NULL, codigo_expira = NULL
       WHERE usuario = $2`,
      [hashPassword(password), rows[0].usuario],
    );
    res.json({ ok: true, mensaje: "Listo. Ya puedes ingresar con tu nueva contraseña." });
  } catch (err) {
    console.error("🔴 ERROR EN RESTABLECER:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error en el servidor. Intenta de nuevo." });
  }
});

// CAMBIO (perfil): agregar o cambiar el correo desde "Mi perfil".
// Pide la contraseña para confirmar que es el dueño de la cuenta.
app.post("/perfil/correo", async (req, res) => {
  const usuario = (req.body.usuario || "").trim();
  const correo = (req.body.correo || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!CORREO_VALIDO.test(correo)) {
    return res.status(400).json({ ok: false, error: "Escribe un correo válido." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT password FROM usuarios WHERE usuario = $1",
      [usuario],
    );
    if (!rows[0] || !verifyPassword(password, rows[0].password)) {
      return res
        .status(401)
        .json({ ok: false, error: "La contraseña no es correcta." });
    }
    await pool.query("UPDATE usuarios SET correo = $1 WHERE usuario = $2", [
      correo,
      usuario,
    ]);
    res.json({ ok: true, correo });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ ok: false, error: "Ese correo ya está en otra cuenta." });
    }
    console.error("🔴 ERROR EN PERFIL/CORREO:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error en el servidor. Intenta de nuevo." });
  }
});

// CAMBIO (perfil): cambiar el nombre de usuario. Pide la contraseña.
app.post("/perfil/usuario", async (req, res) => {
  const usuario = (req.body.usuario || "").trim();
  const nuevo = (req.body.nuevo || "").trim();
  const password = req.body.password || "";

  if (nuevo.length < 3) {
    return res.status(400).json({
      ok: false,
      error: "El usuario debe tener al menos 3 caracteres.",
    });
  }

  try {
    const { rows } = await pool.query(
      "SELECT password FROM usuarios WHERE usuario = $1",
      [usuario],
    );
    if (!rows[0] || !verifyPassword(password, rows[0].password)) {
      return res
        .status(401)
        .json({ ok: false, error: "La contraseña no es correcta." });
    }
    await pool.query("UPDATE usuarios SET usuario = $1 WHERE usuario = $2", [
      nuevo,
      usuario,
    ]);
    res.json({ ok: true, usuario: nuevo });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ ok: false, error: "Ese usuario ya existe. Elige otro nombre." });
    }
    console.error("🔴 ERROR EN PERFIL/USUARIO:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error en el servidor. Intenta de nuevo." });
  }
});

// CAMBIO (perfil): cambiar la contraseña. Pide la contraseña actual.
app.post("/perfil/password", async (req, res) => {
  const usuario = (req.body.usuario || "").trim();
  const actual = req.body.actual || "";
  const nueva = req.body.nueva || "";

  if (nueva.length < 6) {
    return res.status(400).json({
      ok: false,
      error: "La nueva contraseña debe tener al menos 6 caracteres.",
    });
  }

  try {
    const { rows } = await pool.query(
      "SELECT password FROM usuarios WHERE usuario = $1",
      [usuario],
    );
    if (!rows[0] || !verifyPassword(actual, rows[0].password)) {
      return res
        .status(401)
        .json({ ok: false, error: "La contraseña actual no es correcta." });
    }
    await pool.query("UPDATE usuarios SET password = $1 WHERE usuario = $2", [
      hashPassword(nueva),
      usuario,
    ]);
    res.json({ ok: true, mensaje: "Contraseña actualizada." });
  } catch (err) {
    console.error("🔴 ERROR EN PERFIL/PASSWORD:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error en el servidor. Intenta de nuevo." });
  }
});

// NUEVO: endpoint que le indica al frontend a qué URL debe ir
app.get("/api/ir-citas", (req, res) => {
  res.json({ ok: true, url: "/citas" });
});

// 4. RUTA PÁGINA PRINCIPAL (sin cambios)
// Nota: el frontend ya no redirige aquí; el menú principal muestra el saludo.
// Se deja por si la quieres usar más adelante como panel privado.
app.get("/principal", (req, res) => {
  const usuario = req.query.usuario || "Usuario";
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Página Principal</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h1>🎉 ¡Bienvenido a la Página Principal, ${usuario}!</h1>
        <p>Has accedido correctamente estando autenticado en la base de datos FASTYAPI en la nube.</p>
        <br/>
        <a href="/">Cerrar Sesión</a>
      </body>
    </html>
  `);
});

// ---------------------------------------------------------------
// CAMBIO (db): al arrancar, revisa la conexión con Neon y crea la
// tabla usuarios si todavía no existe (si ya existe, no la toca)
// ---------------------------------------------------------------
async function prepararBaseDeDatos() {
  if (!process.env.DATABASE_URL) {
    console.error("🔴 Falta DATABASE_URL en backend/.env");
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        creado_en TIMESTAMP DEFAULT NOW()
      )
    `);
    // CAMBIO (correo): columnas nuevas; si ya existen, no pasa nada
    await pool.query(`
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS correo VARCHAR(150),
        ADD COLUMN IF NOT EXISTS codigo_recuperacion VARCHAR(64),
        ADD COLUMN IF NOT EXISTS codigo_expira TIMESTAMP
    `);
    await pool.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo_unico ON usuarios (LOWER(correo))",
    );
    const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM usuarios");
    console.log(`🟢 Conectado a Neon. Usuarios registrados: ${rows[0].total}`);
  } catch (err) {
    console.error("🔴 No se pudo conectar a Neon:", err.message);
  }
}

// CAMBIO (db): ruta para probar la conexión desde el navegador
// -> http://localhost:3000/api/estado-db
app.get("/api/estado-db", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM usuarios");
    res.json({ ok: true, conectado: true, usuarios: rows[0].total });
  } catch (err) {
    res.status(500).json({ ok: false, conectado: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
  prepararBaseDeDatos(); // CAMBIO (db)
});
