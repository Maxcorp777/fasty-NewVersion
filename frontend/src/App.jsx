import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import logo from "./assets/logo-fasty.png";
import fotoSebastian from "./Barberos/Sebastian.jpg";
import fotoJanier from "./Barberos/Janier.jpg";
import fotoAbelardo from "./Barberos/image.png"
/* ------------------------------------------------------------------ */
/* CONFIGURACIÓN — cambia estos valores cuando los tengas listos       */
/* ------------------------------------------------------------------ */
// Si algún día usan un sistema de citas externo, pongan aquí su URL.
// Mientras esté vacía, el botón lleva a la página de citas de prueba (/citas).
const AGENDA_URL = "";

// Número de WhatsApp con código de país, sin + ni espacios (Colombia = 57)
const WHATSAPP = "573000000000";

const API = "http://localhost:3000";
/* Rutas del backend (backend/server.js) */
const AUTH = {
  login: "/login", // POST { usuario (o correo), password }
  registro: "/registro", // POST { usuario, correo, password }
  recuperar: "/recuperar", // POST { correo } -> envía un código
  restablecer: "/restablecer", // POST { correo, codigo, password }
  correo: "/perfil/correo", // POST { usuario, password, correo }
};

/* CAMBIO (perfil): la sesión se guarda en el navegador.
   - Siempre en sessionStorage (dura mientras la pestaña esté abierta).
   - En localStorage solo si marcan "Recordarme". */
const CLAVE_SESION = "fasty_usuario";
/* CAMBIO (citas): las citas de prueba se guardan en este navegador */
const CLAVE_CITAS = "fasty_citas_";

/* CAMBIO (citas): precios y duración son DE EJEMPLO. Cámbienlos. */
const SERVICIOS = [
  {
    nombre: "Corte de Cabello",
    detalle: "Corte clásico o moderno a tu medida.",
    minutos: 40,
    precio: 25000,
  },
  {
    nombre: "Corte de Cabello y Barba",
    detalle: "Corte completo más perfilado y arreglo de barba.",
    minutos: 60,
    precio: 35000,
  },
  {
    nombre: "Corte de Cabello con Tijeras",
    detalle: "Trabajo a tijera para un acabado más natural.",
    minutos: 50,
    precio: 30000,
  },
  {
    nombre: "Corte para Niños",
    detalle: "Corte cuidadoso para los más pequeños.",
    minutos: 30,
    precio: 20000,
  },
  {
    nombre: "Rapada o Afeitada de Cabeza y Barba",
    detalle: "Afeitado limpio con toalla caliente.",
    minutos: 45,
    precio: 30000,
  },
];

/* CAMBIO (barberos): datos DE EJEMPLO. Cámbienlos por los reales.
   - foto: pongan la imagen en frontend/public/barberos/ y escriban la ruta,
     por ejemplo "/barberos/andres.jpg". Si la foto no existe o se deja en "",
     se muestra un avatar con las iniciales.
   - calificacion: de 0 a 5 (acepta decimales, ej. 4.7).
   - resenas: cuántas personas lo han calificado. */
const CUALQUIERA = "Cualquiera disponible";
const BARBEROS = [
  {
    nombre: CUALQUIERA,
    especialidad: "El primero libre",
    descripcion: "Te asignamos al barbero que esté disponible a la hora que elijas.",
  },
  {
    nombre: "Sebastián",
    foto: fotoSebastian,
    especialidad: "Rasurado de bolas [Con lengua]",
    descripcion: "Sobreviviente de una prisión en Afganistán en 2016 y veterano/a de tres divorcios fallidos, es un icono travesti que no le teme a nada. Defensor/a acérrimo/a de la causa LGBTQ+, hoy comparte techo con sus padres mientras demuestra que el talento nace donde sea: aprendió a motilar jugando ROBLOX y ahora lo lleva al mundo real con toda la actitud.",
    Personalidad: "Reservado, Sumiso, Gay, Timidoi, auténtico y con miedo al qué dirán.",
    calificacion: -3.5, // negativa: las estrellas salen rojas y al revés
    resenas: 67,
  },
  {
    nombre: "Janier",
    foto: fotoJanier,
    especialidad: "Especialidad: Ninguna",
    descripcion: "Exmilitar de la Unión Soviética refugiado en casa de sus padres mientras esquiva una orden de captura internacional de Corea del Sur por crímenes de guerra, dejó atrás su cautiverio en Afganistán en 2016 y el fracaso de tres divorcios para reinventarse por completo. Hoy es una icónica figura travesti y referente del activismo LGBTQ+ que se gana la vida frente a la barbería, aplicando con la navaja la misma precisión milimétrica que dominó practicando cortes de cabello en ROBLOX.",
    calificacion: 0.7,
    resenas: 0,
  },
  {
    nombre: "Abelardo",
    foto: fotoAbelardo,
    especialidad: "Especialidad: Bienvenido a la patria milagro",
    descripcion: "Es el presidente cuesta mas.",
    calificacion: 4.8,
    resenas: 74,
  },
];

/* CAMBIO (barbería): puntos destacados de la sección "La barbería" */
const DESTACADOS = [
  { icono: "reloj", titulo: "Con cita, sin filas", texto: "Agendas en línea y llegas a tu hora." },
  { icono: "tijeras", titulo: "Barberos de oficio", texto: "Cada uno con su especialidad." },
  { icono: "cafe", titulo: "Sin afanes", texto: "Buena música y café mientras esperas." },
];

/* CAMBIO (citas): horario de atención para las citas de prueba */
const HORA_APERTURA = 10; // 10:00 a. m.
const HORA_CIERRE = 20; // 8:00 p. m. (último turno 7:30 p. m.)

/* ------------------------------------------------------------------ */
/* Video e imágenes de la portada (bancos gratuitos Mixkit/Unsplash).  */
/* Cuando tengan fotos propias, pónganlas en /public y cambien rutas.  */
/* ------------------------------------------------------------------ */
const VIDEO_PORTADA = "https://assets.mixkit.co/videos/43242/43242-720.mp4";
const POSTER_PORTADA =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=70";

const TARJETAS = [
  {
    titulo: "La barbería",
    texto: "Sillas de cuero, luz cálida y un ambiente sin afanes.",
    imagen:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=70",
    destino: "#barberia",
  },
  {
    titulo: "Servicios",
    texto: "Cortes, barba y afeitado clásico con toalla caliente.",
    imagen:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=70",
    destino: "#servicios",
  },
  {
    titulo: "Productos",
    texto: "Ceras, aceites y bálsamos que usamos todos los días.",
    imagen:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=70",
    destino: "#calidad",
  },
];

/* Viñetas de calidad. Ajusten los textos a lo que realmente ofrece la barbería. */
const CALIDAD = [
  {
    icono: "tijeras",
    titulo: "En el servicio",
    puntos: [
      "Barberos con años de oficio y formación constante.",
      "Antes de empezar, conversamos el corte que quieres.",
      "Tu cita empieza a la hora que agendaste.",
    ],
  },
  {
    icono: "silla",
    titulo: "En el lugar",
    puntos: [
      "Herramientas desinfectadas entre cada cliente.",
      "Toallas limpias y calientes en cada servicio.",
      "Un espacio tranquilo, con buena música y café.",
    ],
  },
  {
    icono: "frasco",
    titulo: "En los productos",
    puntos: [
      "Marcas profesionales para cabello y barba.",
      "Fórmulas suaves con la piel, sin olores fuertes.",
      "Te decimos qué usar en casa para que el corte dure.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */
const pesos = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);

// "2026-10-08" -> "jueves, 8 de octubre"
const fechaLarga = (iso) =>
  new Date(`${iso}T00:00`).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// "14:30" -> "2:30 p. m."
const horaBonita = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const hoyISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const sumarDias = (iso, dias) => {
  const d = new Date(`${iso}T00:00`);
  d.setDate(d.getDate() + dias);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Lectura/escritura segura del almacenamiento del navegador
const leer = (almacen, clave) => {
  try {
    const v = almacen.getItem(clave);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const escribir = (almacen, clave, valor) => {
  try {
    if (valor === null) almacen.removeItem(clave);
    else almacen.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento disponible */
  }
};

/* Llamada al backend. Lee data.error, que es lo que responde server.js */
async function peticion(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      headers: { "Content-Type": "application/json" },
      ...opciones,
    });
  } catch {
    throw new Error("No hay conexión con el servidor. ¿Está prendido el backend?");
  }
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || data.ok === false) {
    throw new Error(
      data.error || data.mensaje || data.message || "No se pudo completar.",
    );
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* CAMBIO (perfil): sesión compartida por todas las páginas            */
/* ------------------------------------------------------------------ */
const SesionContexto = createContext(null);
const useSesion = () => useContext(SesionContexto);

/* ------------------------------------------------------------------ */
/* Íconos                                                              */
/* ------------------------------------------------------------------ */
const IconoWhatsapp = () => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 3.5A12.5 12.5 0 0 0 5.2 22.3L3.5 28.5l6.4-1.7A12.5 12.5 0 1 0 16 3.5z" />
    <path d="M12 10.5c-.5 1.2-.2 2.8 1.3 4.7 1.6 2 3.4 3.1 5.2 3.4.9.1 2-.6 2.2-1.4l-2.2-1.2-1.1.9c-1.3-.6-2.4-1.7-3-3l.9-1.1-1.1-2.3z" fill="currentColor" stroke="none" />
  </svg>
);

const IconoPersona = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </svg>
);

const IconoCorreo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5l8.5 6 8.5-6" />
  </svg>
);

const IconoCandado = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const IconoClave = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M5 12h.01M9 12h.01M13 12h.01M17 12h2" />
    <rect x="2.5" y="7" width="19" height="10" rx="2" />
  </svg>
);

const IconoOjo = ({ tachado }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {tachado && <path d="M3 3l18 18" />}
  </svg>
);

const IconoX = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* CAMBIO (perfil): avatar minimalista con la inicial del usuario      */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* CAMBIO (diseño): íconos e ilustraciones dibujadas en SVG            */
/* ------------------------------------------------------------------ */
const TRAZOS = {
  tijeras: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
    </>
  ),
  silla: (
    <>
      <path d="M7 4h10v7H7z" />
      <path d="M5 11h14v3H5zM8 14v3M16 14v3M6 17h12M12 17v4M8 21h8" />
    </>
  ),
  frasco: (
    <>
      <path d="M9 3h6v3H9z" />
      <path d="M8 6h8l1 3v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9z" />
      <path d="M7 12h10" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  cafe: (
    <>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" />
    </>
  ),
  grupo: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.2A5 5 0 0 1 21 19" />
    </>
  ),
};

function Icono({ nombre, tamano = 26 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

/* Ilustración de la sección "La barbería": silla de barbero, poste y herramientas */
function IlustracionBarberia() {
  return (
    <svg className="ilustracion" viewBox="0 0 420 360" role="img" aria-label="Ilustración de una silla de barbería">
      <defs>
        <pattern id="rayas-poste" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="20" height="20" fill="#fff" />
          <rect width="7" height="20" fill="var(--neon)" />
          <rect x="10" width="4" height="20" fill="var(--grafito)" />
        </pattern>
      </defs>

      {/* fondo */}
      <circle cx="210" cy="190" r="150" fill="var(--neon-brillo)" />
      <circle cx="210" cy="190" r="112" fill="#fff" opacity="0.7" />

      {/* espejo */}
      <rect x="150" y="38" width="120" height="96" rx="48" fill="#fff" stroke="var(--grafito)" strokeWidth="3" />
      <path d="M176 66c10-12 26-14 36-8" fill="none" stroke="var(--linea)" strokeWidth="6" strokeLinecap="round" />

      {/* poste de barbería */}
      <rect x="338" y="60" width="26" height="12" rx="4" fill="var(--grafito)" />
      <rect x="341" y="72" width="20" height="150" rx="10" fill="url(#rayas-poste)" stroke="var(--grafito)" strokeWidth="3" />
      <rect x="338" y="222" width="26" height="12" rx="4" fill="var(--grafito)" />

      {/* silla */}
      <rect x="168" y="150" width="84" height="86" rx="18" fill="var(--grafito)" />
      <rect x="182" y="164" width="56" height="58" rx="10" fill="#2f3036" />
      <rect x="146" y="232" width="128" height="26" rx="13" fill="var(--grafito)" />
      <rect x="132" y="206" width="30" height="12" rx="6" fill="var(--neon)" />
      <rect x="258" y="206" width="30" height="12" rx="6" fill="var(--neon)" />
      <rect x="203" y="258" width="14" height="40" fill="#8b8e96" />
      <ellipse cx="210" cy="306" rx="62" ry="12" fill="#8b8e96" />
      <rect x="176" y="276" width="68" height="8" rx="4" fill="#b4b7bd" />

      {/* tijeras */}
      <g transform="translate(58 250) rotate(-20)" fill="none" stroke="var(--grafito)" strokeWidth="4" strokeLinecap="round">
        <circle cx="0" cy="0" r="11" />
        <circle cx="0" cy="34" r="11" />
        <path d="M10 6 60 30M10 28 60 4" />
      </g>

      {/* peine */}
      <g transform="translate(300 296) rotate(-8)">
        <rect width="78" height="14" rx="4" fill="var(--neon)" />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={6 + i * 8} y="14" width="3" height="12" fill="var(--neon)" />
        ))}
      </g>

      {/* destellos */}
      <path d="M96 92l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="var(--neon)" />
      <path d="M318 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--grafito)" />
    </svg>
  );
}

/* CAMBIO (barberos): estrellas con decimales (4.7 llena 4 y 70 % de la quinta) */
function Estrellas({ valor, resenas }) {
  const negativa = valor < 0;
  const porcentaje = Math.min(5, Math.abs(valor)) * 20;
  return (
    <span
      className={`estrellas ${negativa ? "estrellas--negativas" : ""}`}
      aria-label={`${valor} de 5 estrellas, ${resenas} reseñas`}
    >
      <span className="estrellas__base" aria-hidden="true">
        ★★★★★
        <span className="estrellas__relleno" style={{ width: `${porcentaje}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="estrellas__numero">{valor.toFixed(1)}</span>
      <span className="estrellas__resenas">({resenas})</span>
    </span>
  );
}

/* CAMBIO (barberos): foto del barbero o, si no carga, avatar con iniciales */
function FotoBarbero({ barbero }) {
  const [fallo, setFallo] = useState(false);
  if (barbero.nombre === CUALQUIERA) {
    return (
      <span className="barbero__foto barbero__foto--icono">
        <Icono nombre="grupo" tamano={34} />
      </span>
    );
  }
  if (!barbero.foto || fallo) {
    const iniciales = barbero.nombre
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return <span className="barbero__foto barbero__foto--iniciales">{iniciales}</span>;
  }
  return (
    <img
      className="barbero__foto"
      src={barbero.foto}
      alt={`Foto de ${barbero.nombre}`}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  );
}

function Avatar({ nombre, grande = false }) {
  const inicial = (nombre || "?").trim().charAt(0).toUpperCase();
  return (
    <span className={`avatar ${grande ? "avatar--grande" : ""}`} aria-hidden="true">
      {inicial}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Pantalla de carga (solo la primera vez que se abre la página)       */
/* ------------------------------------------------------------------ */
let yaSeMostroLaCarga = false;

function Carga({ visible }) {
  return (
    <div className={`carga ${visible ? "" : "carga--oculta"}`} aria-hidden={!visible}>
      <img src={logo} alt="Fasty Barbershop" className="carga__logo" />
      <p className="carga__texto">Cargando</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campo de formulario con ícono (lo usan el login y el perfil)        */
/* ------------------------------------------------------------------ */
function Campo({ id, etiqueta, icono, conOjo = false, ...props }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="campo">
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
      </label>
      <div className="campo__caja">
        <span className="campo__icono">{icono}</span>
        <input id={id} {...props} type={conOjo ? (ver ? "text" : "password") : props.type} />
        {conOjo && (
          <button
            type="button"
            className="campo__ojo"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <IconoOjo tachado={ver} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CAMBIO (modal): ventana de iniciar sesión / crear cuenta /          */
/* recuperar contraseña. Tema claro.                                   */
/* ------------------------------------------------------------------ */
const TEXTOS_MODAL = {
  ingresar: ["Ingresar a mi cuenta", "Ingresa tu usuario o correo y tu contraseña"],
  crear: ["Crear mi cuenta", "Tu correo sirve para recuperar la contraseña"],
  recuperar: ["Recuperar contraseña", "Te enviaremos un código a tu correo"],
  codigo: ["Escribe el código", "Revisa tu correo y elige una contraseña nueva"],
};

function ModalSesion({ onCerrar, onExito }) {
  const [modo, setModo] = useState("ingresar");
  const [usuario, setUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [codigoPrueba, setCodigoPrueba] = useState("");
  const [enviando, setEnviando] = useState(false);
  const caja = useRef(null);

  const [titulo, subtitulo] = TEXTOS_MODAL[modo];

  // Cerrar con Escape
  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  // Poner el cursor en el primer campo cada vez que cambia el modo
  useEffect(() => {
    caja.current?.querySelector("input")?.focus();
  }, [modo]);

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError("");
    if (nuevo !== "ingresar") setAviso("");
    setPassword("");
  };

  const completo = {
    ingresar: usuario.trim() && password,
    crear: usuario.trim() && correo.trim() && password,
    recuperar: correo.trim(),
    codigo: codigo.trim().length === 6 && password,
  }[modo];

  const enviar = async (e) => {
    e.preventDefault();
    if (!completo || enviando) return;
    setError("");
    setEnviando(true);
    try {
      if (modo === "recuperar") {
        const data = await peticion(AUTH.recuperar, {
          method: "POST",
          body: JSON.stringify({ correo }),
        });
        setAviso(data.mensaje);
        setCodigoPrueba(data.codigoPrueba || "");
        setCodigo("");
        cambiarModo("codigo");
        return;
      }

      if (modo === "codigo") {
        const data = await peticion(AUTH.restablecer, {
          method: "POST",
          body: JSON.stringify({ correo, codigo, password }),
        });
        setCodigoPrueba("");
        setUsuario(correo);
        cambiarModo("ingresar");
        setAviso(data.mensaje);
        return;
      }

      if (modo === "crear") {
        await peticion(AUTH.registro, {
          method: "POST",
          body: JSON.stringify({ usuario, correo, password }),
        });
      }

      const data = await peticion(AUTH.login, {
        method: "POST",
        body: JSON.stringify({ usuario, password }),
      });
      onExito({ usuario: data.usuario, correo: data.correo || null }, recordar);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const textoBoton = {
    ingresar: "Ingresar",
    crear: "Crear cuenta",
    recuperar: "Enviar código",
    codigo: "Cambiar contraseña",
  }[modo];

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal__caja" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" ref={caja}>
        <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar ventana">
          <IconoX />
        </button>

        <header className="modal__cabecera">
          <h2 id="modal-titulo" className="modal__titulo">
            {titulo}
          </h2>
          <p className="modal__subtitulo">{subtitulo}</p>
        </header>

        <form className="modal__form" onSubmit={enviar} noValidate>
          {(modo === "ingresar" || modo === "crear") && (
            <Campo
              id="campo-usuario"
              etiqueta={modo === "ingresar" ? "Usuario o correo" : "Usuario"}
              icono={<IconoPersona />}
              type="text"
              placeholder={modo === "ingresar" ? "Tu usuario o tu correo" : "Cómo quieres que te llamemos"}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
            />
          )}

          {(modo === "crear" || modo === "recuperar") && (
            <Campo
              id="campo-correo"
              etiqueta="Correo"
              icono={<IconoCorreo />}
              type="email"
              placeholder="nombre@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
            />
          )}

          {modo === "codigo" && (
            <>
              {codigoPrueba && (
                <p className="modal__aviso modal__aviso--prueba" role="status">
                  Modo de prueba: todavía no se envían correos. Tu código es{" "}
                  <strong>{codigoPrueba}</strong>
                </p>
              )}
              {!codigoPrueba && aviso && (
                <p className="modal__aviso" role="status">
                  {aviso}
                </p>
              )}
              <Campo
                id="campo-codigo"
                etiqueta="Código de 6 dígitos"
                icono={<IconoClave />}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                autoComplete="one-time-code"
              />
            </>
          )}

          {modo !== "recuperar" && (
            <Campo
              id="campo-password"
              etiqueta={modo === "codigo" ? "Contraseña nueva" : "Contraseña"}
              icono={<IconoCandado />}
              conOjo
              placeholder={modo === "ingresar" ? "Escribe tu contraseña" : "Mínimo 6 caracteres"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={modo === "ingresar" ? "current-password" : "new-password"}
            />
          )}

          {modo === "ingresar" && (
            <>
              <button type="button" className="modal__enlace modal__olvido" onClick={() => cambiarModo("recuperar")}>
                ¿Olvidaste tu contraseña?
              </button>
              <label className="modal__recordar">
                <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
                <span>Recordarme</span>
              </label>
              {aviso && (
                <p className="modal__aviso modal__aviso--exito" role="status">
                  {aviso}
                </p>
              )}
            </>
          )}

          {error && (
            <p className="modal__error" role="alert">
              {error}
            </p>
          )}

          <button className="modal__enviar" type="submit" disabled={!completo || enviando}>
            {enviando ? "Un momento..." : textoBoton}
          </button>
        </form>

        <p className="modal__pie">
          {modo === "ingresar" && (
            <>
              ¿No tienes cuenta?{" "}
              <button type="button" className="modal__enlace" onClick={() => cambiarModo("crear")}>
                Crear cuenta
              </button>
            </>
          )}
          {modo === "crear" && (
            <>
              ¿Ya tienes cuenta?{" "}
              <button type="button" className="modal__enlace" onClick={() => cambiarModo("ingresar")}>
                Ingresar
              </button>
            </>
          )}
          {(modo === "recuperar" || modo === "codigo") && (
            <button type="button" className="modal__enlace" onClick={() => cambiarModo("ingresar")}>
              Volver a ingresar
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Menú del usuario con sesión iniciada                                */
/* ------------------------------------------------------------------ */
function MenuUsuario() {
  const { usuario, cerrarSesion } = useSesion();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !contenedor.current?.contains(e.target) && setAbierto(false);
    const escape = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const ir = (ruta) => {
    setAbierto(false);
    navigate(ruta);
  };

  return (
    <div className="usuario" ref={contenedor}>
      <button className="usuario__boton" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        <Avatar nombre={usuario.usuario} />
        <span className="usuario__nombre">{usuario.usuario}</span>
      </button>

      {abierto && (
        <div className="usuario__menu">
          <button onClick={() => ir("/perfil")}>Mi perfil</button>
          <button onClick={() => ir("/citas")}>Agendar cita</button>
          <button
            onClick={() => {
              setAbierto(false);
              cerrarSesion();
              navigate("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CAMBIO (perfil): barra de navegación común a todas las páginas      */
/* ------------------------------------------------------------------ */
const ENLACES = [
  ["#barberia", "La barbería"],
  ["#servicios", "Servicios"],
  ["#calidad", "Calidad"],
  ["#contacto", "Contacto"],
];

function Encabezado({ enInicio = false }) {
  const { usuario, abrirLogin } = useSesion();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const irAAgenda = () => {
    setMenuAbierto(false);
    if (AGENDA_URL) window.location.href = AGENDA_URL;
    else navigate("/citas");
  };

  return (
    <header className="nav">
      <div className="nav__interior">
        <Link to="/" className="nav__logo" aria-label="Fasty Barbershop, inicio">
          <img src={logo} alt="" />
          <span className="nav__marca">Fasty</span>
        </Link>

        <button
          className="nav__hamburguesa"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-expanded={menuAbierto}
          aria-label="Abrir menú"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav__links ${menuAbierto ? "nav__links--abierto" : ""}`}>
          {ENLACES.map(([hash, texto]) =>
            enInicio ? (
              <a key={hash} href={hash} onClick={() => setMenuAbierto(false)}>
                {texto}
              </a>
            ) : (
              <Link key={hash} to={`/${hash}`} onClick={() => setMenuAbierto(false)}>
                {texto}
              </Link>
            ),
          )}

          {usuario ? (
            <MenuUsuario />
          ) : (
            <button
              className="nav__sesion"
              onClick={() => {
                setMenuAbierto(false);
                abrirLogin();
              }}
            >
              <IconoPersona />
              <span>Iniciar sesión</span>
            </button>
          )}

          <button className="boton-neon nav__cita" onClick={irAAgenda}>
            Agenda tu cita
          </button>
        </nav>
      </div>
    </header>
  );
}

function Pie() {
  return (
    <>
      <footer className="pie">
        <span className="pie__marca">Fasty</span>
        <span>© {new Date().getFullYear()} Fasty Barbershop</span>
      </footer>

      <a
        className="whatsapp"
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <IconoWhatsapp />
      </a>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Página de inicio                                                    */
/* ------------------------------------------------------------------ */
function Inicio() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [cargando, setCargando] = useState(!yaSeMostroLaCarga);
  const [servicioAbierto, setServicioAbierto] = useState(null);

  // La pantalla de carga se muestra mínimo 2.4 s, solo la primera vez
  useEffect(() => {
    if (!cargando) return;
    const minimo = new Promise((r) => setTimeout(r, 2400));
    const listo = new Promise((r) => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", r, { once: true });
    });
    Promise.all([minimo, listo]).then(() => {
      yaSeMostroLaCarga = true;
      setCargando(false);
    });
  }, [cargando]);

  // Bloquea el scroll mientras carga
  useEffect(() => {
    document.body.style.overflow = cargando ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cargando]);

  // CAMBIO (perfil): si se llega desde otra página con /#seccion, baja a esa sección
  useEffect(() => {
    if (!cargando && hash) document.querySelector(hash)?.scrollIntoView();
  }, [cargando, hash]);

  const irAAgenda = () => {
    if (AGENDA_URL) window.location.href = AGENDA_URL;
    else navigate("/citas");
  };

  return (
    <>
      <Carga visible={cargando} />
      <Encabezado enInicio />

      <main>
        {/* ---------- Portada con video ---------- */}
        <section id="inicio" className="portada">
          <video
            className="portada__video"
            src={VIDEO_PORTADA}
            poster={POSTER_PORTADA}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="portada__velo" aria-hidden="true" />

          <div className="portada__contenido">
            <p className="portada__antetitulo">Barbershop</p>
            <h1 className="portada__titulo">Fasty</h1>
            <p className="portada__lema">Estilo y perfección en cada corte y afeitado</p>
            <div className="portada__acciones">
              <button className="boton-neon" onClick={irAAgenda}>
                Agenda tu cita
              </button>
              <a href="#servicios" className="boton-linea">
                Ver servicios
              </a>
            </div>
          </div>
        </section>

        {/* ---------- Tres tarjetas con imagen ---------- */}
        <section className="tarjetas" aria-label="Conoce Fasty">
          {TARJETAS.map((t) => (
            <a key={t.titulo} href={t.destino} className="tarjeta">
              <img src={t.imagen} alt="" loading="lazy" className="tarjeta__img" />
              <span className="tarjeta__texto">
                <strong>{t.titulo}</strong>
                <span>{t.texto}</span>
              </span>
            </a>
          ))}
        </section>

        {/* ---------- La Barbería ---------- */}
        <section id="barberia" className="seccion">
          <div className="barberia">
            <div className="intro">
              <p className="seccion__antetitulo">Fasty Barbershop</p>
              <h2 className="seccion__titulo">La barbería</h2>
              {/* CAMBIO (barbería): texto de ejemplo. Cámbienlo por la historia real. */}
              <p className="seccion__texto">
                Fasty nació para que cortarte el pelo sea un plan y no una espera. Agendas tu cita en línea,
                eliges a tu barbero y llegas a sentarte. Nosotros ponemos el oficio, las herramientas limpias
                y el café.
              </p>
              <ul className="destacados">
                {DESTACADOS.map((d) => (
                  <li key={d.titulo} className="destacado">
                    <span className="destacado__icono">
                      <Icono nombre={d.icono} tamano={22} />
                    </span>
                    <span>
                      <strong>{d.titulo}</strong>
                      <span>{d.texto}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <IlustracionBarberia />
          </div>
        </section>

        {/* ---------- Calidad (viñetas) ---------- */}
        <section id="calidad" className="seccion seccion--tenue">
          <h2 className="seccion__titulo">Lo que cuidamos en cada visita</h2>
          <div className="calidad">
            {CALIDAD.map((c) => (
              <div key={c.titulo} className="calidad__bloque">
                <span className="calidad__icono">
                  <Icono nombre={c.icono} tamano={28} />
                </span>
                <h3 className="calidad__titulo">{c.titulo}</h3>
                <ul className="calidad__lista">
                  {c.puntos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Servicios ---------- */}
        <section id="servicios" className="seccion">
          <div className="servicios__cabecera">
            <h2 className="seccion__titulo">Servicios</h2>
            <button className="boton-neon" onClick={irAAgenda}>
              Agenda tu cita
            </button>
          </div>

          <div className="servicios">
            {SERVICIOS.map((s, i) => {
              const abierto = servicioAbierto === i;
              return (
                <div key={s.nombre} className="servicio">
                  <button
                    className="servicio__cabecera"
                    onClick={() => setServicioAbierto(abierto ? null : i)}
                    aria-expanded={abierto}
                  >
                    <span>{s.nombre}</span>
                    <svg
                      className={`servicio__flecha ${abierto ? "servicio__flecha--abierta" : ""}`}
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M4 8l8 8 8-8" />
                    </svg>
                  </button>
                  <div className={`servicio__cuerpo ${abierto ? "servicio__cuerpo--abierto" : ""}`}>
                    <p>
                      {s.detalle} {s.minutos} min · {pesos(s.precio)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- Contacto ---------- */}
        <section id="contacto" className="seccion seccion--tenue">
          <h2 className="seccion__titulo">Contacto</h2>
          <div className="contacto">
            <div>
              <h3 className="calidad__titulo">Dirección</h3>
              <p>Escribe aquí la dirección de la barbería.</p>
            </div>
            <div>
              <h3 className="calidad__titulo">Horario</h3>
              <p>Lunes a sábado, 10:00 a. m. a 8:00 p. m.</p>
            </div>
            <div>
              <h3 className="calidad__titulo">Escríbenos</h3>
              <a
                className="boton-linea boton-linea--oscuro"
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <Pie />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* CAMBIO (citas): citas de prueba guardadas en el navegador           */
/* ------------------------------------------------------------------ */
const claveCitas = (u) => CLAVE_CITAS + u.usuario.toLowerCase();
const citasDe = (u) => (u ? leer(localStorage, claveCitas(u)) || [] : []);
const guardarCitasDe = (u, lista) => escribir(localStorage, claveCitas(u), lista);

function useCitas(usuario) {
  // "version" obliga a releer el navegador después de guardar
  const [version, setVersion] = useState(0);
  const citas = useMemo(() => (version >= 0 ? citasDe(usuario) : []), [usuario, version]);

  const guardar = (lista) => {
    if (!usuario) return;
    guardarCitasDe(usuario, lista);
    setVersion((v) => v + 1);
  };

  return {
    citas,
    agregar: (cita) => guardar([...citas, cita]),
    cancelar: (id) => guardar(citas.filter((c) => c.id !== id)),
  };
}

// Turnos del día cada 30 minutos: "10:00", "10:30", ... "19:30"
const TURNOS = Array.from({ length: (HORA_CIERRE - HORA_APERTURA) * 2 }, (_, i) => {
  const h = HORA_APERTURA + Math.floor(i / 2);
  return `${String(h).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
});

// Simula turnos ocupados de otros clientes (siempre los mismos para la misma fecha y barbero)
const ocupadoSimulado = (fecha, barbero, turno) => {
  const semilla = [...`${fecha}${barbero}${turno}`].reduce((a, c) => a + c.charCodeAt(0) * 7, 0);
  return semilla % 5 === 0;
};

/* ------------------------------------------------------------------ */
/* CAMBIO (citas): página para agendar una cita (de prueba)            */
/* ------------------------------------------------------------------ */
function Citas() {
  const { usuario, abrirLogin } = useSesion();
  const { citas, agregar } = useCitas(usuario);
  const navigate = useNavigate();

  const hoy = hoyISO();
  const [servicio, setServicio] = useState(null);
  const [barbero, setBarbero] = useState(CUALQUIERA);
  const [fecha, setFecha] = useState(hoy);
  const [turno, setTurno] = useState("");
  const [nota, setNota] = useState("");
  const [confirmada, setConfirmada] = useState(null);

  // Hora actual para deshabilitar turnos que ya pasaron hoy
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const disponible = (t) => {
    const [h, m] = t.split(":").map(Number);
    if (fecha === hoy && h * 60 + m <= minutosAhora) return false;
    if (ocupadoSimulado(fecha, barbero, t)) return false;
    return !citas.some((c) => c.fecha === fecha && c.hora === t);
  };

  const listo = servicio !== null && fecha && turno;

  const crearCita = () => {
    const s = SERVICIOS[servicio];
    return {
      id: Date.now(),
      servicio: s.nombre,
      precio: s.precio,
      minutos: s.minutos,
      barbero,
      fecha,
      hora: turno,
      nota: nota.trim(),
    };
  };

  const mostrarConfirmacion = (cita) => {
    setConfirmada(cita);
    window.scrollTo({ top: 0 });
  };

  const enviar = (e) => {
    e.preventDefault();
    if (!listo) return;
    if (!usuario) {
      // Sin sesión: se abre el login y, al entrar, la cita se guarda en su cuenta
      abrirLogin((nuevoUsuario) => {
        const cita = crearCita();
        guardarCitasDe(nuevoUsuario, [...citasDe(nuevoUsuario), cita]);
        mostrarConfirmacion(cita);
      });
      return;
    }
    const cita = crearCita();
    agregar(cita);
    mostrarConfirmacion(cita);
  };

  return (
    <>
      <Encabezado />
      <main className="pagina">
        <div className="pagina__interior">
          <p className="nota-prueba">
            Versión de prueba: la cita se guarda solo en este navegador y no llega a la barbería.
          </p>

          {confirmada ? (
            <section className="confirmacion">
              <span className="confirmacion__check" aria-hidden="true">
                ✓
              </span>
              <h1 className="pagina__titulo">Cita agendada</h1>
              <p className="pagina__texto">
                Te esperamos el <strong>{fechaLarga(confirmada.fecha)}</strong> a las{" "}
                <strong>{horaBonita(confirmada.hora)}</strong>
              </p>
              <dl className="resumen">
                <div>
                  <dt>Servicio</dt>
                  <dd>{confirmada.servicio}</dd>
                </div>
                <div>
                  <dt>Barbero</dt>
                  <dd>{confirmada.barbero}</dd>
                </div>
                <div>
                  <dt>Duración</dt>
                  <dd>{confirmada.minutos} min</dd>
                </div>
                <div>
                  <dt>Valor</dt>
                  <dd>{pesos(confirmada.precio)}</dd>
                </div>
              </dl>
              <div className="pagina__acciones">
                <button className="boton-neon" onClick={() => navigate("/perfil")}>
                  Ver mis citas
                </button>
                <button
                  className="boton-linea boton-linea--oscuro"
                  onClick={() => {
                    setConfirmada(null);
                    setTurno("");
                    setNota("");
                  }}
                >
                  Agendar otra
                </button>
              </div>
            </section>
          ) : (
            <form className="agenda" onSubmit={enviar}>
              <h1 className="pagina__titulo">Agenda tu cita</h1>

              <fieldset className="agenda__paso">
                <legend>Servicio</legend>
                <div className="opciones">
                  {SERVICIOS.map((s, i) => (
                    <label key={s.nombre} className={`opcion ${servicio === i ? "opcion--activa" : ""}`}>
                      <input
                        type="radio"
                        name="servicio"
                        checked={servicio === i}
                        onChange={() => setServicio(i)}
                      />
                      <span className="opcion__nombre">{s.nombre}</span>
                      <span className="opcion__detalle">
                        {s.minutos} min · {pesos(s.precio)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="agenda__paso">
                <legend>Barbero</legend>
                <div className="barberos">
                  {BARBEROS.map((b) => (
                    <button
                      key={b.nombre}
                      type="button"
                      className={`barbero ${barbero === b.nombre ? "barbero--activo" : ""}`}
                      aria-pressed={barbero === b.nombre}
                      onClick={() => {
                        setBarbero(b.nombre);
                        setTurno("");
                      }}
                    >
                      <FotoBarbero barbero={b} />
                      <span className="barbero__nombre">{b.nombre}</span>
                      <span className="barbero__especialidad">{b.especialidad}</span>
                      {b.calificacion != null ? (
                        <Estrellas valor={b.calificacion} resenas={b.resenas} />
                      ) : (
                        <span className="barbero__sin-estrellas">Sin preferencia</span>
                      )}
                      <span className="barbero__descripcion">{b.descripcion}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="agenda__paso">
                <legend>Fecha y hora</legend>
                <label className="agenda__fecha">
                  <span>Día</span>
                  <input
                    type="date"
                    value={fecha}
                    min={hoy}
                    max={sumarDias(hoy, 30)}
                    onChange={(e) => {
                      setFecha(e.target.value);
                      setTurno("");
                    }}
                    required
                  />
                </label>
                {fecha && <p className="agenda__dia">{fechaLarga(fecha)}</p>}

                <div className="turnos">
                  {TURNOS.map((t) => {
                    const libre = disponible(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`turno ${turno === t ? "turno--activo" : ""}`}
                        disabled={!libre}
                        aria-pressed={turno === t}
                        onClick={() => setTurno(t)}
                      >
                        {horaBonita(t)}
                      </button>
                    );
                  })}
                </div>
                {TURNOS.every((t) => !disponible(t)) && (
                  <p className="agenda__sin-turnos">No quedan turnos este día. Prueba con otra fecha.</p>
                )}
              </fieldset>

              <fieldset className="agenda__paso">
                <legend>Algo que debamos saber (opcional)</legend>
                <textarea
                  className="agenda__nota"
                  rows={3}
                  maxLength={200}
                  placeholder="Por ejemplo: quiero mantener el largo arriba."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
              </fieldset>

              <div className="agenda__final">
                {listo && (
                  <p className="agenda__resumen">
                    {SERVICIOS[servicio].nombre} con {barbero.toLowerCase().startsWith("cualquiera") ? "el barbero disponible" : barbero},{" "}
                    {fechaLarga(fecha)} a las {horaBonita(turno)}
                  </p>
                )}
                <button className="boton-neon" type="submit" disabled={!listo}>
                  {usuario ? "Confirmar cita" : "Iniciar sesión y confirmar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Pie />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* CAMBIO (perfil): página "Mi perfil"                                 */
/* ------------------------------------------------------------------ */
function Perfil() {
  const { usuario, abrirLogin, cerrarSesion, actualizarUsuario } = useSesion();
  const { citas, cancelar } = useCitas(usuario);
  const navigate = useNavigate();

  const [editandoCorreo, setEditandoCorreo] = useState(false);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const hoy = hoyISO();
  const ordenadas = useMemo(
    () => [...citas].sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`)),
    [citas],
  );
  const proximas = ordenadas.filter((c) => c.fecha >= hoy);
  const pasadas = ordenadas.filter((c) => c.fecha < hoy).reverse();

  if (!usuario) {
    return (
      <>
        <Encabezado />
        <main className="pagina">
          <div className="pagina__interior pagina__vacia">
            <h1 className="pagina__titulo">Mi perfil</h1>
            <p className="pagina__texto">Inicia sesión para ver tus datos y tus citas.</p>
            <button className="boton-neon" onClick={abrirLogin}>
              Iniciar sesión
            </button>
          </div>
        </main>
        <Pie />
      </>
    );
  }

  const guardarCorreo = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const data = await peticion(AUTH.correo, {
        method: "POST",
        body: JSON.stringify({ usuario: usuario.usuario, password, correo }),
      });
      actualizarUsuario({ correo: data.correo });
      setEditandoCorreo(false);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Encabezado />
      <main className="pagina">
        <div className="pagina__interior">
          <section className="perfil">
            <Avatar nombre={usuario.usuario} grande />
            <div className="perfil__datos">
              <h1 className="pagina__titulo">{usuario.usuario}</h1>
              {usuario.correo && !editandoCorreo && <p className="perfil__correo">{usuario.correo}</p>}
              {!usuario.correo && !editandoCorreo && (
                <p className="perfil__correo perfil__correo--falta">
                  Sin correo. Agrégalo para poder recuperar tu contraseña.
                </p>
              )}
              {!editandoCorreo && (
                <button
                  className="modal__enlace perfil__editar"
                  onClick={() => {
                    setCorreo(usuario.correo || "");
                    setEditandoCorreo(true);
                  }}
                >
                  {usuario.correo ? "Cambiar correo" : "Agregar correo"}
                </button>
              )}

              {editandoCorreo && (
                <form className="perfil__form" onSubmit={guardarCorreo}>
                  <Campo
                    id="perfil-correo"
                    etiqueta="Correo"
                    icono={<IconoCorreo />}
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                  />
                  <Campo
                    id="perfil-password"
                    etiqueta="Tu contraseña, para confirmar"
                    icono={<IconoCandado />}
                    conOjo
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  {error && (
                    <p className="modal__error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="pagina__acciones">
                    <button className="boton-neon" type="submit" disabled={!correo || !password || enviando}>
                      {enviando ? "Guardando..." : "Guardar correo"}
                    </button>
                    <button
                      type="button"
                      className="boton-linea boton-linea--oscuro"
                      onClick={() => {
                        setEditandoCorreo(false);
                        setError("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <section className="perfil__citas">
            <div className="perfil__cabecera">
              <h2 className="perfil__subtitulo">Próximas citas</h2>
              <button className="boton-neon" onClick={() => navigate("/citas")}>
                Agendar cita
              </button>
            </div>

            {proximas.length === 0 ? (
              <p className="pagina__texto">No tienes citas por ahora. Agenda la próxima cuando quieras.</p>
            ) : (
              <ul className="lista-citas">
                {proximas.map((c) => (
                  <li key={c.id} className="cita">
                    <div>
                      <p className="cita__cuando">
                        {fechaLarga(c.fecha)}, {horaBonita(c.hora)}
                      </p>
                      <p className="cita__que">
                        {c.servicio} · {c.barbero} · {pesos(c.precio)}
                      </p>
                      {c.nota && <p className="cita__nota">“{c.nota}”</p>}
                    </div>
                    <button className="cita__cancelar" onClick={() => cancelar(c.id)}>
                      Cancelar
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {pasadas.length > 0 && (
              <>
                <h2 className="perfil__subtitulo perfil__subtitulo--pasadas">Citas anteriores</h2>
                <ul className="lista-citas lista-citas--pasadas">
                  {pasadas.map((c) => (
                    <li key={c.id} className="cita">
                      <div>
                        <p className="cita__cuando">
                          {fechaLarga(c.fecha)}, {horaBonita(c.hora)}
                        </p>
                        <p className="cita__que">
                          {c.servicio} · {c.barbero}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <button
            className="perfil__salir"
            onClick={() => {
              cerrarSesion();
              navigate("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </main>
      <Pie />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* CAMBIO (perfil): la sesión vive aquí y la comparten todas las rutas */
/* ------------------------------------------------------------------ */
function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(
    () => leer(sessionStorage, CLAVE_SESION) || leer(localStorage, CLAVE_SESION),
  );
  const [modalAbierto, setModalAbierto] = useState(false);
  // CAMBIO (citas): acción para ejecutar justo después de iniciar sesión
  const alEntrar = useRef(null);

  // Bloquea el scroll mientras la ventana de login está abierta
  useEffect(() => {
    if (!modalAbierto) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto]);

  const alIniciarSesion = (u, recordar) => {
    setUsuario(u);
    setModalAbierto(false);
    escribir(sessionStorage, CLAVE_SESION, u);
    escribir(localStorage, CLAVE_SESION, recordar ? u : null);
    alEntrar.current?.(u);
    alEntrar.current = null;
  };

  const valor = {
    usuario,
    abrirLogin: (despues = null) => {
      alEntrar.current = typeof despues === "function" ? despues : null;
      setModalAbierto(true);
    },
    cerrarSesion: () => {
      setUsuario(null);
      escribir(sessionStorage, CLAVE_SESION, null);
      escribir(localStorage, CLAVE_SESION, null);
    },
    actualizarUsuario: (cambios) => {
      const nuevo = { ...usuario, ...cambios };
      setUsuario(nuevo);
      escribir(sessionStorage, CLAVE_SESION, nuevo);
      if (leer(localStorage, CLAVE_SESION)) escribir(localStorage, CLAVE_SESION, nuevo);
    },
  };

  return (
    <SesionContexto.Provider value={valor}>
      {children}
      {modalAbierto && (
        <ModalSesion
          onCerrar={() => {
            alEntrar.current = null;
            setModalAbierto(false);
          }}
          onExito={alIniciarSesion}
        />
      )}
    </SesionContexto.Provider>
  );
}

/* Sube al inicio de la página al cambiar de ruta (salvo enlaces con #) */
function SubirAlCambiar() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Rutas                                                               */
/* ------------------------------------------------------------------ */
function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <SubirAlCambiar />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </ProveedorSesion>
    </BrowserRouter>
  );
}

export default App;
