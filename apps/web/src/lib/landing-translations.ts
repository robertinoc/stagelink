/**
 * Landing page translations — simple front-end dictionary.
 * Intentionally separate from the platform's next-intl i18n system.
 */

export type SupportedLocale = 'en' | 'es';

interface Segment {
  label: string;
  description: string;
}

interface Step {
  step: string;
  title: string;
  text: string;
}

interface Feature {
  title: string;
  description: string;
}

export interface LandingTranslation {
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  nav: {
    product: string;
    features: string;
    howItWorks: string;
    forArtists: string;
    contact: string;
    login: string;
    cta: string;
    languageLabel: string;
  };
  badge: string;
  hero: {
    headline: string;
    subheadline: string;
    supportingText: string;
    ctaPrimary: string;
    ctaSecondary: string;
    previewLabel: string;
    previewHandle: string;
    previewRoles: string;
    previewTags: string[];
    previewTitle: string;
    previewDescription: string;
    previewMediaLabel: string;
    previewMediaBadge: string;
    previewMediaItems: string[];
    previewMediaMeta: string[];
    previewAboutLabel: string;
    previewAboutText: string;
    previewMerchLabel: string;
    previewMerchName: string;
    previewMerchPrice: string;
    previewMerchStatus: string;
    previewAudienceLabel: string;
    previewAudienceText: string;
    previewAudienceCta: string;
    previewFanLabel: string;
    mockLinks: string[];
  };
  strip: {
    label: string;
    items: string[];
    platformsLabel: string;
    platformsDescription: string;
    platforms: string[];
  };
  problem: {
    eyebrow: string;
    headline: string;
    intro: string;
    painLabel: string;
    painPoints: string[];
    solutionLabel: string;
    solutionPoints: string[];
  };
  features: {
    eyebrow: string;
    headline: string;
    intro: string;
    items: Feature[];
  };
  howItWorks: {
    eyebrow: string;
    headline: string;
    intro: string;
    steps: Step[];
  };
  forArtists: {
    eyebrow: string;
    headline: string;
    body: string;
    segments: Segment[];
  };
  monetization: {
    eyebrow: string;
    headline: string;
    body: string;
    pillars: Feature[];
    points: string[];
  };
  cta: {
    eyebrow: string;
    headline: string;
    body: string;
    primary: string;
    secondary: string;
  };
  contact: {
    eyebrow: string;
    headline: string;
    body: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    artistType: string;
    artistTypePlaceholder: string;
    artistTypeOptions: string[];
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };
  footer: {
    description: string;
    links: {
      product: string;
      features: string;
      howItWorks: string;
      pricing: string;
      contact: string;
    };
    copyright: string;
  };
}

const en: LandingTranslation = {
  seo: {
    title: 'StageLink | Artist platform, Press Kit, analytics, and merch hub',
    description:
      'StageLink is an artist platform for musicians, DJs, producers, bands, creators, and visual artists. Build your public page, Press Kit (EPK), analytics, merch hub, and audience experience in one place.',
    ogTitle: 'StageLink | The artist platform for page, Press Kit, analytics, and merch',
    ogDescription:
      'Build your artist platform in one place: public page, Press Kit (EPK), analytics, merch, smart links, and fan capture.',
  },
  nav: {
    product: 'Product',
    features: 'Features',
    howItWorks: 'How it works',
    forArtists: 'For artists',
    contact: 'Contact',
    login: 'Log in',
    cta: 'Create your StageLink',
    languageLabel: 'Language',
  },
  badge: 'Artist-first platform',
  hero: {
    headline: 'Build your artist platform, not just another link page',
    subheadline:
      'StageLink gives artists one home for their public page, Press Kit (EPK), merch, audience capture, and connected platform insights. It is the layer that ties your project together.',
    supportingText:
      'Made for DJs, musicians, producers, bands, creators, and visual artists who need more than a generic link-in-bio and want one system that actually supports how they work.',
    ctaPrimary: 'Create your StageLink',
    ctaSecondary: 'View preview',
    previewLabel: 'Artist page preview',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'One place for your music, content, merch, and audience',
    previewDescription:
      'A modern artist experience built to look sharp, load fast, and guide fans, bookers, and collaborators toward the next right action.',
    previewMediaLabel: 'Featured media',
    previewMediaBadge: 'Live preview',
    previewMediaItems: ['Last video', 'Latest set'],
    previewMediaMeta: ['YouTube / Live set', 'SoundCloud / Mix preview'],
    previewAboutLabel: 'About',
    previewAboutText:
      'A strong artist platform can also show your bio, current focus, press-ready details, and the sections different audiences actually need.',
    previewMerchLabel: 'Merch',
    previewMerchName: 'Limited gear drop',
    previewMerchPrice: '$149',
    previewMerchStatus: 'Available now',
    previewAudienceLabel: 'Audience',
    previewAudienceText: 'Capture fans, launch smarter, and keep your next move one click away.',
    previewAudienceCta: 'Join',
    previewFanLabel: 'Join the fan list',
    mockLinks: ['Listen on Spotify', 'Watch the latest video', 'Shop merch', 'Join the fan list'],
  },
  strip: {
    label: 'Built for the way artists actually share online',
    items: [
      'Artist landing page',
      'Link in bio for artists',
      'Landing page for musicians',
      'Creator landing page',
    ],
    platformsLabel: 'Works with the platforms your audience already uses',
    platformsDescription:
      'The most important platforms are already part of your audience. StageLink helps you bring them into one place without making your page feel generic.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Problem / solution',
    headline:
      'Most artists are stitching their project together across too many disconnected tools',
    intro:
      'Your music lives on Spotify. Your videos live on YouTube. Merch lives somewhere else. Your Press Kit is separate. Your analytics are fragmented. The result is not just a messy fan journey, but a messy artist workflow too.',
    painLabel: 'What fans see now',
    painPoints: [
      'Too many disconnected links and tools across too many platforms',
      'No single place for public page, Press Kit (EPK), merch, and platform references',
      "A generic link page that doesn't feel like your artist brand or your real workflow",
    ],
    solutionLabel: 'What StageLink changes',
    solutionPoints: [
      'One artist platform for your page, Press Kit (EPK), merch, audience flows, and connected insights',
      'A cleaner way to share your project across releases, social media, outreach, and campaigns',
      'A system that feels built for artists, not a generic link tool stretched beyond its purpose',
    ],
  },
  features: {
    eyebrow: 'Features',
    headline: 'A modern artist toolkit, unified in one platform.',
    intro:
      'StageLink starts with your public page, but it goes further: profile, Press Kit (EPK), analytics, merch, smart links, fan capture, and platform connections all live in one artist workspace.',
    items: [
      {
        title: 'Public page and links in one place',
        description:
          'Bring Spotify, SoundCloud, YouTube, TikTok, Instagram, and your core destinations into one clean artist-facing experience.',
      },
      {
        title: 'Profile-first artist system',
        description:
          'Start from one core artist profile and reuse that identity across your public page, Press Kit (EPK), and platform references.',
      },
      {
        title: 'Press kit and professional presentation',
        description:
          'Turn your artist profile into a shareable Press Kit (EPK), then add the booking, hospitality, and rider details that belong there.',
      },
      {
        title: 'Merch and store support',
        description:
          'Connect Shopify and Smart Merch flows so products can live inside the same artist system instead of somewhere disconnected.',
      },
      {
        title: 'Connected insights and analytics',
        description:
          'Read StageLink analytics and connected platform metrics from one dashboard instead of hunting through disconnected tools.',
      },
      {
        title: 'Fan capture and smart distribution',
        description:
          'Use smart links, audience capture, embeds, and focused sections that help fans, bookers, and collaborators find what matters fast.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    headline: 'From scattered tools to a clean artist platform in three simple steps',
    intro:
      'The workflow is straightforward: set up your profile, shape your artist surfaces, and share one system everywhere.',
    steps: [
      {
        step: '01',
        title: 'Set up your artist profile',
        text: 'Add your artist identity, visuals, links, and core platform references once so StageLink can reuse them across the product.',
      },
      {
        step: '02',
        title: 'Build your public experience',
        text: 'Shape your page, Press Kit (EPK), merch sections, smart links, and audience touchpoints from the same artist workspace.',
      },
      {
        step: '03',
        title: 'Share, measure, and grow',
        text: 'Use one system across Instagram, TikTok, releases, outreach, and campaigns, then read your analytics and platform snapshots in one place.',
      },
    ],
  },
  forArtists: {
    eyebrow: "Who it's for",
    headline: 'Built for artists who need a real platform, not just a generic link page',
    body: 'StageLink was made for creative people whose work already lives across platforms, formats, audiences, and goals. It gives you a more complete artist system, not just a prettier bio link.',
    segments: [
      {
        label: 'DJs',
        description:
          'Share sets, bookings, videos, releases, merch, and platform insights from one coherent home base.',
      },
      {
        label: 'Musicians',
        description:
          'Connect releases, videos, tour info, merch, audience capture, and a press-ready presence in one place.',
      },
      {
        label: 'Producers',
        description: 'Present beats, collaborations, smart links, and contact details clearly.',
      },
      {
        label: 'Bands',
        description:
          'Keep songs, live content, merch, updates, and press materials together in one system.',
      },
      {
        label: 'Creators',
        description:
          'Turn your creator presence into a platform for content, products, analytics, and community touchpoints.',
      },
      {
        label: 'Visual artists',
        description:
          'Show your portfolio, social presence, commissions, and shop inside one focused artist platform.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Why StageLink',
    headline: 'More than a link-in-bio. More focused than a generic site builder.',
    body: 'StageLink is for artists who need one platform to present their work, share a professional Press Kit (EPK), connect merch, read analytics, and grow without duct-taping five products together.',
    pillars: [
      {
        title: 'Built around artist workflows',
        description:
          'The product is structured around what artists actually manage: identity, public page, Press Kit, merch, platform references, and analytics.',
      },
      {
        title: 'One profile, many outputs',
        description:
          'Your core artist profile powers multiple surfaces so you are not re-entering the same information in disconnected places.',
      },
      {
        title: 'Growth without fragmentation',
        description:
          'Instead of stacking random tools, you get a cleaner artist hub where page, merch, fans, and insights can evolve together.',
      },
    ],
    points: [
      'Connect Shopify and Smart Merch where fans already discover you.',
      'Use a Press Kit (EPK) that starts from your real profile instead of rebuilding your story from scratch.',
      'Read StageLink analytics and platform snapshots from the same workspace.',
    ],
  },
  cta: {
    eyebrow: 'Ready to start',
    headline: 'Build the artist platform your project actually deserves',
    body: 'Create the system behind your public page, Press Kit (EPK), merch, analytics, and audience flow. Start simple, then grow into a stronger artist platform from there.',
    primary: 'Create your StageLink',
    secondary: 'Explore how it works',
  },
  contact: {
    eyebrow: 'Contact',
    headline: 'Tell us what you want to build',
    body: "Whether you're launching your first artist page or looking for a stronger home for your brand, we'd love to hear from you.",
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    artistType: 'Artist type',
    artistTypePlaceholder: 'Select your artist type',
    artistTypeOptions: ['DJ', 'Musician', 'Producer', 'Band', 'Creator', 'Visual artist', 'Other'],
    message: 'Message',
    messagePlaceholder: 'Tell us about your project, your audience, or what you need help with.',
    submit: 'Send message',
    submitting: 'Sending...',
    success: "Thanks. We'll get back to you soon.",
    error: 'Something went wrong. Please try again in a minute.',
  },
  footer: {
    description:
      'StageLink is the artist platform for public page, Press Kit (EPK), merch, analytics, smart links, and audience flow.',
    links: {
      product: 'Product',
      features: 'Features',
      howItWorks: 'How it works',
      pricing: 'Pricing',
      contact: 'Contact',
    },
    copyright: '© {year} StageLink. All rights reserved.',
  },
};

const es: LandingTranslation = {
  seo: {
    title: 'StageLink | Plataforma para artistas con Press Kit, analíticas y merch',
    description:
      'StageLink es una plataforma para artistas, músicos, DJs, productores, bandas, creadores y artistas visuales. Unificá tu página pública, Press Kit (EPK), analíticas, merch y audiencia en un solo lugar.',
    ogTitle: 'StageLink | La plataforma para artistas con página, Press Kit, analíticas y merch',
    ogDescription:
      'Construí tu plataforma de artista en un solo lugar: página pública, Press Kit (EPK), analíticas, merch, smart links y captura de audiencia.',
  },
  nav: {
    product: 'Producto',
    features: 'Funciones',
    howItWorks: 'Cómo funciona',
    forArtists: 'Para artistas',
    contact: 'Contacto',
    login: 'Iniciar sesión',
    cta: 'Crear tu StageLink',
    languageLabel: 'Idioma',
  },
  badge: 'Plataforma para artistas',
  hero: {
    headline: 'Construí tu plataforma de artista, no solo otra página de links',
    subheadline:
      'StageLink le da a los artistas un solo lugar para su página pública, Press Kit (EPK), merch, captura de audiencia y platform insights conectados. Es la capa que une todo tu proyecto.',
    supportingText:
      'Hecho para DJs, músicos, productores, bandas, creadores y artistas visuales que necesitan más que un link-in-bio genérico y quieren un sistema que de verdad acompañe cómo trabajan.',
    ctaPrimary: 'Crear tu StageLink',
    ctaSecondary: 'Ver preview',
    previewLabel: 'Preview de página de artista',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'Un solo lugar para tu música, contenido, merch y audiencia',
    previewDescription:
      'Una experiencia de artista pensada para verse bien, cargar rápido y guiar a fans, bookers y colaboradores hacia la acción correcta.',
    previewMediaLabel: 'Media destacada',
    previewMediaBadge: 'Preview en vivo',
    previewMediaItems: ['Último video', 'Último set'],
    previewMediaMeta: ['YouTube / Live set', 'SoundCloud / Preview del mix'],
    previewAboutLabel: 'Sobre el artista',
    previewAboutText:
      'Una buena plataforma para artistas también puede mostrar tu bio, tu foco actual, detalles listos para prensa y las secciones que distintos públicos realmente necesitan.',
    previewMerchLabel: 'Merch',
    previewMerchName: 'Drop limitado de gear',
    previewMerchPrice: '$149',
    previewMerchStatus: 'Disponible ahora',
    previewAudienceLabel: 'Audiencia',
    previewAudienceText:
      'Capturá fans, activá mejor tus lanzamientos y dejá tu próximo movimiento a un click de distancia.',
    previewAudienceCta: 'Sumarme',
    previewFanLabel: 'Sumarme a la lista de fans',
    mockLinks: [
      'Escuchar en Spotify',
      'Ver el último video',
      'Comprar merch',
      'Sumarme a la lista de fans',
    ],
  },
  strip: {
    label: 'Pensado para cómo los artistas comparten online de verdad',
    items: [
      'Página de artista',
      'Link in bio para artistas',
      'Landing page para músicos',
      'Landing page para creadores',
    ],
    platformsLabel: 'Se integra con las plataformas que tu audiencia ya usa',
    platformsDescription:
      'Las plataformas más importantes ya son parte de tu audiencia. StageLink te ayuda a unirlas en un solo lugar sin que tu página se sienta genérica.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Problema / solución',
    headline:
      'La mayoría de los artistas arma su proyecto con demasiadas herramientas desconectadas',
    intro:
      'Tu música vive en Spotify. Tus videos en YouTube. El merch en otro lado. Tu Press Kit por separado. Tus analíticas fragmentadas. El problema ya no es solo la experiencia del fan: también es un workflow artístico desordenado.',
    painLabel: 'Lo que los fans ven hoy',
    painPoints: [
      'Demasiados links y herramientas desconectadas en demasiadas plataformas',
      'No existe un solo lugar para página pública, Press Kit (EPK), merch y referencias de plataforma',
      'Una página genérica de links que no se siente como tu marca ni como tu workflow real',
    ],
    solutionLabel: 'Lo que cambia con StageLink',
    solutionPoints: [
      'Una sola plataforma para tu página, Press Kit (EPK), merch, audiencia e insights conectados',
      'Una forma más clara de compartir tu proyecto en lanzamientos, redes, outreach y campañas',
      'Un sistema pensado para artistas, no una tool genérica estirada más allá de su propósito',
    ],
  },
  features: {
    eyebrow: 'Funciones',
    headline: 'Un toolkit moderno para artistas, unificado en una sola plataforma.',
    intro:
      'StageLink empieza con tu página pública, pero va más allá: perfil, Press Kit (EPK), analíticas, merch, smart links, captura de fans y conexiones de plataforma viven en un mismo workspace.',
    items: [
      {
        title: 'Página pública y links en un solo lugar',
        description:
          'Uní Spotify, SoundCloud, YouTube, TikTok, Instagram y tus destinos principales dentro de una experiencia clara para tu proyecto artístico.',
      },
      {
        title: 'Sistema centrado en tu perfil',
        description:
          'Partí de un solo perfil de artista y reutilizá esa identidad en tu página pública, tu Press Kit (EPK) y tus referencias de plataforma.',
      },
      {
        title: 'Press Kit y presentación profesional',
        description:
          'Convertí tu perfil en un Press Kit (EPK) compartible y sumale solo los detalles de booking, hospitalidad y rider que realmente pertenecen ahí.',
      },
      {
        title: 'Merch y soporte de tienda',
        description:
          'Conectá Shopify y Smart Merch para que el merch viva dentro del mismo sistema artístico en vez de quedar desconectado.',
      },
      {
        title: 'Insights y analíticas conectadas',
        description:
          'Leé las analíticas de StageLink y las métricas conectadas de plataformas desde un solo dashboard, en lugar de perseguir datos por distintos lugares.',
      },
      {
        title: 'Captura de fans y distribución inteligente',
        description:
          'Usá smart links, captura de audiencia, embeds y secciones enfocadas para que fans, bookers y colaboradores encuentren rápido lo importante.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Cómo funciona',
    headline: 'De herramientas dispersas a una plataforma de artista clara en tres pasos',
    intro:
      'El flujo es simple: armás tu perfil, construís tus superficies y compartís un solo sistema en todos lados.',
    steps: [
      {
        step: '01',
        title: 'Configurá tu perfil de artista',
        text: 'Sumá tu identidad, visuales, links y referencias principales una sola vez para que StageLink las reutilice en todo el producto.',
      },
      {
        step: '02',
        title: 'Armá tu experiencia pública',
        text: 'Dale forma a tu página, tu Press Kit (EPK), tus secciones de merch, tus smart links y tus puntos de contacto desde el mismo workspace.',
      },
      {
        step: '03',
        title: 'Compartí, medí y crecé',
        text: 'Usá un solo sistema en Instagram, TikTok, lanzamientos, outreach y campañas, y después leé tus analíticas e insights conectados en un solo lugar.',
      },
    ],
  },
  forArtists: {
    eyebrow: 'Para artistas',
    headline:
      'Hecho para artistas que necesitan una plataforma real, no solo una página genérica de links',
    body: 'StageLink fue creado para personas creativas cuyo trabajo ya vive en múltiples plataformas, formatos, audiencias y objetivos. Te da un sistema de artista más completo, no solo un bio link más lindo.',
    segments: [
      {
        label: 'DJs',
        description:
          'Compartí sets, bookings, videos, lanzamientos, merch e insights de plataforma desde una sola base coherente.',
      },
      {
        label: 'Músicos',
        description:
          'Conectá lanzamientos, videos, fechas, merch, captura de audiencia y presencia de prensa en un solo lugar.',
      },
      {
        label: 'Productores',
        description: 'Mostrá beats, colaboraciones, smart links y contacto de manera clara.',
      },
      {
        label: 'Bandas',
        description:
          'Mantené canciones, contenido en vivo, merch, novedades y material de prensa dentro del mismo sistema.',
      },
      {
        label: 'Creadores',
        description:
          'Convertí tu presencia creadora en una plataforma para contenido, productos, analíticas y comunidad.',
      },
      {
        label: 'Artistas visuales',
        description:
          'Mostrá portfolio, redes, encargos y tienda dentro de una plataforma artística más enfocada.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Por qué StageLink',
    headline: 'Más que un link-in-bio. Más enfocado que un site builder genérico.',
    body: 'StageLink es para artistas que necesitan una sola plataforma para presentar su trabajo, compartir un Press Kit (EPK), conectar merch, leer analíticas y crecer sin pegar cinco productos distintos con cinta.',
    pillars: [
      {
        title: 'Pensado alrededor del workflow artístico',
        description:
          'El producto está estructurado alrededor de lo que los artistas realmente gestionan: identidad, página pública, Press Kit, merch, referencias de plataforma y analíticas.',
      },
      {
        title: 'Un perfil, muchos outputs',
        description:
          'Tu perfil de artista impulsa varias superficies, así no tenés que volver a cargar la misma información en lugares desconectados.',
      },
      {
        title: 'Crecimiento sin fragmentación',
        description:
          'En lugar de apilar herramientas random, tenés un hub artístico más limpio donde página, merch, fans e insights pueden evolucionar juntos.',
      },
    ],
    points: [
      'Conectá Shopify y Smart Merch donde los fans ya te descubren.',
      'Usá un Press Kit (EPK) que arranca desde tu perfil real, en vez de reconstruir tu historia desde cero.',
      'Leé analíticas de StageLink y snapshots de plataformas desde el mismo workspace.',
    ],
  },
  cta: {
    eyebrow: 'Listo para empezar',
    headline: 'Construí la plataforma de artista que tu proyecto realmente necesita',
    body: 'Creá el sistema detrás de tu página pública, tu Press Kit (EPK), tu merch, tus analíticas y tu flujo de audiencia. Empezá simple y crecé desde ahí.',
    primary: 'Crear tu StageLink',
    secondary: 'Explorar cómo funciona',
  },
  contact: {
    eyebrow: 'Contacto',
    headline: 'Contanos qué querés construir',
    body: 'Ya sea que estés lanzando tu primera página de artista o buscando una mejor casa para tu marca, queremos escucharte.',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    email: 'Email',
    emailPlaceholder: 'vos@ejemplo.com',
    artistType: 'Tipo de artista',
    artistTypePlaceholder: 'Elegí tu tipo de artista',
    artistTypeOptions: ['DJ', 'Músico', 'Productor', 'Banda', 'Creador', 'Artista visual', 'Otro'],
    message: 'Mensaje',
    messagePlaceholder: 'Contanos sobre tu proyecto, tu audiencia o en qué necesitás ayuda.',
    submit: 'Enviar mensaje',
    submitting: 'Enviando...',
    success: 'Gracias. Te vamos a responder pronto.',
    error: 'Algo salió mal. Probá de nuevo en un minuto.',
  },
  footer: {
    description:
      'StageLink es la plataforma para artistas con página pública, Press Kit (EPK), merch, analíticas, smart links y flujo de audiencia.',
    links: {
      product: 'Producto',
      features: 'Funciones',
      howItWorks: 'Cómo funciona',
      pricing: 'Precios',
      contact: 'Contacto',
    },
    copyright: '© {year} StageLink. Todos los derechos reservados.',
  },
};

export const landingTranslations = { en, es };

export function getLandingT(locale: string): LandingTranslation {
  return landingTranslations[locale as SupportedLocale] ?? landingTranslations.en;
}
