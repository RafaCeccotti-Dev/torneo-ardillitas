export const siteConfig = {
  name: "Torneo Ardillitas",
  shortName: "Ardillitas",
  description:
    "Fixture, tabla de posiciones, fotos y novedades del torneo de fútbol infantil del Club Central Argentino Olímpico.",
  club: "Club Central Argentino Olímpico",
  city: "Ceres, Santa Fe",
  edition: 17,
  tournamentDates: "21, 22 y 23 de noviembre de 2026",
  whatsapp: {
    number: "5493491510266",
    label: "Coordinador del torneo",
    message: "Hola, consulto por el Torneo Ardillitas.",
  },
  preinscripcionFormUrl: "https://forms.gle/igkPKpmTw947DFSUA",
  drivePhotosUrl: "",
  logos: {
    header: "/logos/ardillita-pelota.png",
    mascot: "/logos/ardillita-celebrando.png",
  },
} as const;

/** Rutas de fondos en /public/backgrounds — reemplazá con las fotos del coordinador */
export const backgroundImages = {
  hero: "/backgrounds/hero.jpeg",
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
  { href: "/ubicaciones", label: "Ubicaciones" },
  { href: "/club", label: "El club" },
  { href: "/reglamento", label: "Reglamento" },
] as const;
