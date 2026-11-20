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
  coordinatorEmail: "torneoardillitas@gmail.com",
  whatsapp: {
    number: "5493491537426",
    label: "Coordinador del torneo",
    message: "Hola, consulto por el Torneo Ardillitas.",
  },
  payment: {
    holder: "ALEJO AGUSTÍN CECCOTTI",
    cbu: "3840200500000013515223",
    alias: "ardillitascentral26",
    bank: "Ualá Bank S.A.U.",
  },
  pressWhatsapp: {
    number: "5493491434968",
    name: "Guillermina",
    label: "Equipo de prensa",
    message:
      "Hola Guillermina, te escribo por fotos exclusivas del Torneo Ardillitas XVII.",
  },
  /** Completar con número internacional sin + (ej. 5493491XXXXXX) */
  infoContacts: [
    {
      id: "alojamientos",
      title: "Alojamientos",
      description: "Reservas, hospedaje y opciones para delegaciones visitantes.",
      numbers: [{ label: "WhatsApp", number: "5493491502253" }],
      message: "Hola, consulto por alojamientos del Torneo Ardillitas.",
    },
    {
      id: "viandas",
      title: "Viandas",
      description: "Pedidos de comida, menús y opciones de viandas para equipos y delegaciones.",
      numbers: [{ label: "WhatsApp", number: "5493491694293" }],
      message: "Hola, consulto por viandas del Torneo Ardillitas.",
    },
    {
      id: "inscripciones",
      title: "Inscripciones",
      description: "Dudas sobre inscripción de equipos, categorías y documentación del torneo.",
      numbers: [
        { label: "Fútbol masculino", number: "5493491537426" },
        { label: "Fútbol femenino", number: "5493857436766" },
      ],
      message: "Hola, consulto por la inscripción al Torneo Ardillitas.",
    },
  ],
  logos: {
    header: "/logos/ardillita-pelota.png",
    mascot: "/logos/ardillita-celebrando.png",
    whatsapp: "/logos/ardillita-telefono.png",
  },
  developer: {
    name: "Rafael Ceccotti",
    instagramHandle: "rafaceccotti_",
    instagramUrl: "https://www.instagram.com/rafaceccotti_/",
  },
  instagram: {
    handle: "torneoardillitas",
    url: "https://www.instagram.com/torneoardillitas/",
  },
  /** Vacío hasta que pasen el Drive de fotos del torneo. */
  drivePhotosUrl: "",
  /**
   * Auspiciantes fijos en código — no se editan desde el panel.
   * Los logos en /auspiciantes/norm son lienzos de 640x256 con el logo recortado y
   * escalado a la misma superficie visual, para que todos se vean del mismo tamaño.
   */
  sponsors: [
    {
      name: "Gobierno de la Ciudad de Ceres",
      logo: "/auspiciantes/norm/gobierno-ceres.png",
      monochrome: true,
    },
    {
      name: "Marcelo González",
      logo: "/auspiciantes/norm/marcelo-gonzalez.png",
      monochrome: true,
    },
    {
      name: "Felipe Michlig",
      logo: "/auspiciantes/norm/felipe-michlig.png",
      monochrome: true,
    },
    {
      name: "Prodas",
      logo: "/auspiciantes/norm/prodas.png",
      href: "https://www.instagram.com/prodasagrocomercial/",
      monochrome: true,
    },
    {
      name: "Calzados Frank",
      logo: "/auspiciantes/norm/calzados-frank.png",
      href: "https://www.instagram.com/calzados_frank/",
      monochrome: true,
    },
    {
      name: "Cellshop",
      logo: "/auspiciantes/norm/cellshop.png",
      href: "https://www.instagram.com/cellshop.ceres/",
      monochrome: true,
    },
    {
      name: "Frank Perfumería",
      logo: "/auspiciantes/norm/frank-perfumeria.png",
      monochrome: true,
    },
    {
      name: "Farmacia Hilbe",
      logo: "/auspiciantes/norm/farmacia-hilbe.png",
      monochrome: true,
    },
    {
      name: "Farmacia Albertinazzi",
      logo: "/auspiciantes/norm/farmacia-albertinazzi.png",
      monochrome: true,
    },
    {
      name: "Kiosco Adonai",
      logo: "/auspiciantes/norm/kiosco-adonai.png",
      monochrome: true,
    },
    {
      name: "Panificados El Messi",
      logo: "/auspiciantes/norm/panificados-el-messi.png",
      monochrome: true,
    },
    {
      name: "Transporte Guille",
      logo: "/auspiciantes/norm/transporte-guille.png",
      monochrome: true,
    },
    {
      name: "Aplicaciones Mario Piccoli",
      logo: "/auspiciantes/norm/aplicaciones-mario-piccoli.png",
      monochrome: true,
    },
    {
      name: "More Indumentaria",
      logo: "/auspiciantes/norm/moreind.png",
      href: "https://www.instagram.com/moreind.ok/",
      monochrome: true,
    },
    {
      name: "Aceros Bimor",
      logo: "/auspiciantes/norm/aceros-bimor.png",
      href: "https://www.instagram.com/bimormetalurgica/",
      monochrome: true,
    },
    {
      name: "La Vanguardia · Leiva Hnos. SA",
      logo: "/auspiciantes/norm/la-vanguardia.png",
      monochrome: true,
    },
    {
      name: "Piruetas",
      logo: "/auspiciantes/norm/piruetas.png",
      monochrome: true,
    },
    {
      name: "Florecita",
      logo: "/auspiciantes/norm/florecita.png",
      monochrome: true,
    },
    {
      name: "Forrajería San Lorenzo",
      logo: "/auspiciantes/norm/san-lorenzo.png",
      monochrome: true,
    },
    {
      name: "Punto Mix",
      logo: "/auspiciantes/norm/punto-mix.png",
      monochrome: true,
    },
    {
      name: "La Boutique del Cerdo",
      logo: "/auspiciantes/norm/boutique-cerdo.png",
      monochrome: true,
    },
    {
      name: "Despensa San Lorenzo",
      logo: "/auspiciantes/norm/despensa-san-lorenzo.png",
      monochrome: true,
    },
    {
      name: "Domo Electrónica",
      logo: "/auspiciantes/norm/domo-electronica.png",
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
