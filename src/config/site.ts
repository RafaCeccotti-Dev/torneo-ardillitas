export const siteConfig = {
  name: "Torneo Ardillitas",
  shortName: "Ardillitas",
  description:
    "Fixture, tabla de posiciones, fotos y novedades del torneo de fútbol infantil del Club Central Argentino Olímpico.",
  club: "Club Central Argentino Olímpico",
  city: "Ceres, Santa Fe",
  edition: 17,
  editionRoman: "XVII",
  tournamentDates: "21, 22 y 23 de noviembre de 2026",
  whatsapp: {
    number: "5493491537426",
    label: "Coordinador del torneo",
    message: "Hola, consulto por el Torneo Ardillitas.",
  },
  preinscripcionFormUrl: "https://forms.gle/igkPKpmTw947DFSUA",
  drivePhotosUrl: "",
  /** Completar con número internacional sin + (ej. 5493491XXXXXX) */
  infoContacts: [
    {
      id: "stands",
      title: "Stands",
      description: "Consultas sobre espacios, feriantes y ubicación de stands en el predio.",
      number: "",
      message: "Hola, consulto por los stands del Torneo Ardillitas.",
    },
    {
      id: "alojamientos",
      title: "Alojamientos",
      description: "Reservas, hospedaje y opciones para delegaciones visitantes.",
      number: "",
      message: "Hola, consulto por alojamientos del Torneo Ardillitas.",
    },
    {
      id: "viandas",
      title: "Viandas",
      description: "Pedidos de comida, menús y opciones de viandas para equipos y delegaciones.",
      number: "",
      message: "Hola, consulto por viandas del Torneo Ardillitas.",
    },
    {
      id: "inscripciones",
      title: "Inscripciones",
      description: "Inscripción de equipos, categorías y documentación del torneo.",
      number: "",
      message: "Hola, consulto por la inscripción al Torneo Ardillitas.",
    },
  ],
  logos: {
    header: "/logos/ardillita-pelota.png",
    mascot: "/logos/ardillita-celebrando.png",
  },
  /** Auspiciantes fijos en código — no se editan desde el panel */
  sponsors: [
    {
      name: "Calzados Frank",
      logo: "/auspiciantes/calzados-frank-mono.png",
      href: "https://www.instagram.com/calzados_frank/",
      monochrome: true,
    },
    {
      name: "Cellshop",
      logo: "/auspiciantes/cellshop-mono.png",
      href: "https://www.instagram.com/cellshop.ceres/",
      monochrome: true,
    },
    {
      name: "Vida Plus",
      logo: "/auspiciantes/vida-plus-mono.png",
      href: "https://www.instagram.com/detodounpoco.vp/",
      monochrome: true,
    },
    {
      name: "Piwi encomiendas",
      logo: "/auspiciantes/piwi-mono.png",
      href: "https://www.instagram.com/piwiencomiendas/",
      monochrome: true,
    },
    {
      name: "Mundo Rodados",
      logo: "/auspiciantes/mundo-rodados-mono.png",
      href: "https://www.instagram.com/mundo.rodados/",
      monochrome: true,
    },
  ],
} as const;

/** Rutas de fondos en /public/backgrounds — reemplazá con las fotos del coordinador */
export const backgroundImages = {
  hero: "/backgrounds/hero.jpeg",
  preinscripcion: "/backgrounds/preinscripcion.png",
  partidos: "/backgrounds/partidos.jpg",
  tabla: "/backgrounds/tabla.jpg",
  fotos: "/backgrounds/fotos.jpg",
  ubicaciones: "/backgrounds/ubicaciones.jpg",
  club: "/backgrounds/club.jpg",
  reglamento: "/backgrounds/reglamento.jpg",
} as const;

export type BackgroundKey = keyof typeof backgroundImages;

export const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/partidos", label: "Partidos" },
  { href: "/tabla", label: "Tabla" },
  { href: "/fotos", label: "Fotos" },
  { href: "/informacion", label: "Información" },
  { href: "/ubicaciones", label: "Ubicaciones" },
  { href: "/club", label: "El club" },
  { href: "/reglamento", label: "Reglamento" },
] as const;
