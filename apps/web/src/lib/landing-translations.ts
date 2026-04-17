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
    previewTitle: string;
    previewDescription: string;
    mockLinks: string[];
  };
  strip: {
    label: string;
    items: string[];
    platformsLabel: string;
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
    title: 'Artist landing page and premium link in bio for artists',
    description:
      'StageLink is the premium artist landing page and link in bio for artists, musicians, DJs, producers, bands, creators, and visual artists. Bring your music, content, merch, and audience into one polished page.',
    ogTitle: 'StageLink | Artist landing page and premium link in bio for artists',
    ogDescription:
      'Build a premium artist page in minutes. Centralize your music, videos, merch, smart links, and fan touchpoints in one place.',
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
  badge: 'Premium artist page platform',
  hero: {
    headline: 'Build your artist landing page in minutes',
    subheadline:
      'StageLink is a premium link in bio for artists who need more than a list of links. Bring your music, videos, merch, smart links, and audience touchpoints into one polished page.',
    supportingText:
      'Made for DJs, musicians, producers, bands, creators, and visual artists who want one link that actually feels like their brand.',
    ctaPrimary: 'Create your StageLink',
    ctaSecondary: 'View preview',
    previewLabel: 'Artist page preview',
    previewTitle: 'One link for your music, content, merch, and audience',
    previewDescription:
      'A premium artist bio link built to look sharp, load fast, and help fans know exactly where to go next.',
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
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Problem / solution',
    headline: 'Most artists are sending fans into a maze',
    intro:
      'Your latest release is on Spotify. Your mixes live on SoundCloud. Videos are on YouTube. Merch is in another store. Your artist bio link ends up sending people everywhere except into one coherent experience.',
    painLabel: 'What fans see now',
    painPoints: [
      'Too many links across too many platforms',
      'No single page for music, merch, videos, and contact',
      "A generic link page that doesn't feel like your artist brand",
    ],
    solutionLabel: 'What StageLink changes',
    solutionPoints: [
      'One premium page for your music, content, merch, and audience touchpoints',
      'A cleaner way to share your artist landing page across social media, releases, and campaigns',
      'A presentation that feels built for artists, not for everyone and everything at once',
    ],
  },
  features: {
    eyebrow: 'Features',
    headline: 'Everything artists need. Clear, premium, and ready to share.',
    intro:
      'StageLink helps you build a landing page for musicians, DJs, producers, and creators without turning your page into a cluttered stack of buttons.',
    items: [
      {
        title: 'Music and social links in one place',
        description:
          'Bring Spotify, SoundCloud, YouTube, TikTok, Instagram, and your own links into one clean artist page.',
      },
      {
        title: 'Artist-first design',
        description:
          'Present your brand with a polished mobile-first layout that feels premium from the first click.',
      },
      {
        title: 'Merch and monetization support',
        description:
          'Connect Shopify, highlight products, and turn attention into actual sales without building a custom store.',
      },
      {
        title: 'Fan capture and audience growth',
        description:
          'Collect fan emails and create clearer paths from discovery to action with tools made for audience growth.',
      },
      {
        title: 'Fast setup',
        description:
          'Create your profile, add your links and content, and publish a strong artist page in just a few minutes.',
      },
      {
        title: 'Premium presentation',
        description:
          'Use smart links, embeds, EPK tools, and focused sections that help fans, bookers, and collaborators find what matters.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    headline: 'From scattered links to a polished artist page in three simple steps',
    intro:
      'The workflow is straightforward: set up your profile, add your content, and share one link everywhere.',
    steps: [
      {
        step: '01',
        title: 'Create your profile',
        text: 'Add your artist name, visuals, bio, and the essentials that make your page feel like you.',
      },
      {
        step: '02',
        title: 'Add your links, music, and content',
        text: 'Bring in music platforms, videos, merch, smart links, and fan touchpoints from the places you already use.',
      },
      {
        step: '03',
        title: 'Share your page everywhere',
        text: 'Use one link across Instagram, TikTok, email, bios, releases, and campaigns with a page that is ready to convert.',
      },
    ],
  },
  forArtists: {
    eyebrow: "Who it's for",
    headline: 'Built for artists who need more than a generic link page',
    body: 'StageLink was made for creative people whose work already lives across platforms and formats. It gives you a more complete artist landing page, not just a list of links.',
    segments: [
      {
        label: 'DJs',
        description: 'Share mixes, bookings, videos, releases, and merch from one branded page.',
      },
      {
        label: 'Musicians',
        description: 'Connect releases, videos, tour info, merch, and your audience in one place.',
      },
      {
        label: 'Producers',
        description: 'Present beats, collaborations, smart links, and contact details clearly.',
      },
      {
        label: 'Bands',
        description: 'Keep songs, live content, merch, and updates together on one page.',
      },
      {
        label: 'Creators',
        description:
          'Turn a creator landing page into a clean hub for content, products, and community.',
      },
      {
        label: 'Visual artists',
        description:
          'Show your portfolio, social presence, commissions, and shop without losing focus.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Monetization / differentiation',
    headline: 'More than a generic link-in-bio tool',
    body: 'StageLink is built for artists and creators who need a real home for music, content, merch, and audience growth. It helps you present your work well and monetize without sending people through a maze.',
    pillars: [
      {
        title: 'Sell merch without extra friction',
        description:
          'Connect Shopify, feature selected products, and send buyers to a real checkout flow that already works.',
      },
      {
        title: 'Turn attention into audience',
        description:
          'Capture fan interest, guide visitors to your key releases, and create clearer next steps for the people discovering your work.',
      },
      {
        title: 'Look ready for opportunities',
        description:
          'Use premium sections, embeds, and press-ready tools to present yourself more professionally to fans, bookers, and collaborators.',
      },
    ],
    points: [
      'Built specifically for artist landing pages, not generic profiles',
      'A cleaner link in bio for DJs, musicians, producers, and creators',
      'One premium page for music, merch, videos, and fan relationships',
    ],
  },
  cta: {
    eyebrow: 'Ready to start',
    headline: 'Build one link that actually feels like you',
    body: 'Create a premium artist page for your music, content, merch, and audience. Start simple, publish fast, and grow from there.',
    primary: 'Create your StageLink',
    secondary: 'Explore how it works',
  },
  contact: {
    eyebrow: 'Contact',
    headline: 'Tell us what you want to build',
    body: "Whether you're launching your first artist page or looking for a more premium home for your brand, we'd love to hear from you.",
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
  },
  footer: {
    description:
      'StageLink is a premium artist landing page and link in bio for artists, musicians, DJs, producers, bands, creators, and visual artists who want one polished place for music, content, merch, and fans.',
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
    title: 'Página de artista y link in bio premium para artistas',
    description:
      'StageLink es una página de artista premium y un link in bio para artistas, músicos, DJs, productores, bandas, creadores y artistas visuales. Uní tu música, contenido, merch y audiencia en una sola página.',
    ogTitle: 'StageLink | Página de artista y link in bio premium para artistas',
    ogDescription:
      'Creá una página premium de artista en minutos. Centralizá tu música, videos, merch, smart links y puntos de contacto con tu audiencia en un solo lugar.',
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
  badge: 'Plataforma premium para artistas',
  hero: {
    headline: 'Creá tu página de artista en minutos',
    subheadline:
      'StageLink es un link in bio premium para artistas que necesitan algo más que una lista de links. Uní tu música, videos, merch, smart links y puntos de contacto con tu audiencia en una sola página prolija.',
    supportingText:
      'Hecho para DJs, músicos, productores, bandas, creadores y artistas visuales que quieren un solo link que realmente se sienta como su marca.',
    ctaPrimary: 'Crear tu StageLink',
    ctaSecondary: 'Ver preview',
    previewLabel: 'Preview de página de artista',
    previewTitle: 'Un solo link para tu música, contenido, merch y audiencia',
    previewDescription:
      'Un artist bio link premium pensado para verse bien, cargar rápido y mostrarle a cada fan exactamente cuál es el próximo paso.',
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
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Problema / solución',
    headline: 'La mayoría de los artistas está mandando a sus fans a un laberinto',
    intro:
      'Tu último lanzamiento vive en Spotify. Tus mixes están en SoundCloud. Tus videos están en YouTube. El merch está en otra tienda. Tu link de bio termina enviando a la gente a todos lados, menos a una experiencia coherente.',
    painLabel: 'Lo que los fans ven hoy',
    painPoints: [
      'Demasiados links repartidos en demasiadas plataformas',
      'Ninguna página única para música, merch, videos y contacto',
      'Una página genérica de links que no se siente como tu proyecto artístico',
    ],
    solutionLabel: 'Lo que cambia con StageLink',
    solutionPoints: [
      'Una sola página premium para tu música, contenido, merch y puntos de contacto con tu audiencia',
      'Una forma más clara de compartir tu página de artista en redes, lanzamientos y campañas',
      'Una presentación pensada para artistas, no para una lista interminable de botones',
    ],
  },
  features: {
    eyebrow: 'Funciones',
    headline: 'Todo lo que un artista necesita. Claro, premium y listo para compartir.',
    intro:
      'StageLink te ayuda a construir una landing page para músicos, DJs, productores y creadores sin convertir tu página en un stack desordenado de botones.',
    items: [
      {
        title: 'Música y redes en un solo lugar',
        description:
          'Uní Spotify, SoundCloud, YouTube, TikTok, Instagram y tus propios links en una página de artista limpia y enfocada.',
      },
      {
        title: 'Diseño pensado para artistas',
        description:
          'Mostrá tu marca con un layout mobile-first prolijo y premium desde el primer click.',
      },
      {
        title: 'Merch y monetización',
        description:
          'Conectá Shopify, destacá productos y convertí atención en ventas sin tener que armar una tienda custom.',
      },
      {
        title: 'Captura de fans y crecimiento de audiencia',
        description:
          'Capturá emails, generá mejores recorridos y construí una relación más directa con la gente que descubre tu trabajo.',
      },
      {
        title: 'Configuración rápida',
        description:
          'Creá tu perfil, agregá tus links y publicá una página sólida de artista en apenas unos minutos.',
      },
      {
        title: 'Presentación premium',
        description:
          'Usá smart links, embeds, herramientas de EPK y secciones enfocadas para fans, bookers y colaboradores.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Cómo funciona',
    headline: 'De links dispersos a una página de artista pulida en tres pasos',
    intro:
      'El flujo es simple: armás tu perfil, sumás tu contenido y compartís un solo link en todos lados.',
    steps: [
      {
        step: '01',
        title: 'Creá tu perfil',
        text: 'Sumá tu nombre artístico, visuales, bio y lo esencial para que tu página se sienta como vos.',
      },
      {
        step: '02',
        title: 'Agregá tus links, música y contenido',
        text: 'Integrá plataformas de música, videos, merch, smart links y puntos de contacto desde las herramientas que ya usás.',
      },
      {
        step: '03',
        title: 'Compartí tu página en todos lados',
        text: 'Usá un solo link en Instagram, TikTok, email, bios, lanzamientos y campañas con una página lista para convertir.',
      },
    ],
  },
  forArtists: {
    eyebrow: 'Para artistas',
    headline: 'Hecho para artistas que necesitan más que una página genérica de links',
    body: 'StageLink fue creado para personas creativas cuyo trabajo ya vive en muchas plataformas y formatos. Te da una página de artista más completa, no solo una lista de links.',
    segments: [
      {
        label: 'DJs',
        description:
          'Compartí mixes, bookings, videos, lanzamientos y merch desde una sola página.',
      },
      {
        label: 'Músicos',
        description: 'Conectá lanzamientos, videos, fechas, merch y audiencia en un solo lugar.',
      },
      {
        label: 'Productores',
        description: 'Mostrá beats, colaboraciones, smart links y contacto de manera clara.',
      },
      {
        label: 'Bandas',
        description: 'Mantené canciones, contenido en vivo, merch y novedades en una sola página.',
      },
      {
        label: 'Creadores',
        description:
          'Convertí tu landing page en un hub prolijo para contenido, productos y comunidad.',
      },
      {
        label: 'Artistas visuales',
        description: 'Mostrá portfolio, redes, encargos y tienda sin perder foco.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Monetización / diferenciación',
    headline: 'Mucho más que una herramienta genérica de link in bio',
    body: 'StageLink está hecho para artistas y creadores que necesitan una base real para música, contenido, merch y crecimiento de audiencia. Te ayuda a presentar mejor tu trabajo y monetizar sin mandar a la gente por un laberinto.',
    pillars: [
      {
        title: 'Vendé merch sin sumar fricción',
        description:
          'Conectá Shopify, destacá productos y llevá al comprador a un checkout real que ya funciona.',
      },
      {
        title: 'Convertí atención en audiencia',
        description:
          'Capturá interés, guiá visitas hacia tus lanzamientos clave y marcá mejor el próximo paso para quien descubre tu trabajo.',
      },
      {
        title: 'Mostrate listo para oportunidades reales',
        description:
          'Usá secciones premium, embeds y herramientas listas para prensa para presentarte mejor ante fans, bookers y colaboradores.',
      },
    ],
    points: [
      'Pensado específicamente para páginas de artista, no para perfiles genéricos',
      'Un link in bio más claro para DJs, músicos, productores y creadores',
      'Una sola página premium para música, merch, videos y relación con fans',
    ],
  },
  cta: {
    eyebrow: 'Listo para empezar',
    headline: 'Construí un solo link que realmente se sienta como vos',
    body: 'Creá una página premium para tu música, contenido, merch y audiencia. Empezá simple, publicá rápido y crecé desde ahí.',
    primary: 'Crear tu StageLink',
    secondary: 'Explorar cómo funciona',
  },
  contact: {
    eyebrow: 'Contacto',
    headline: 'Contanos qué querés construir',
    body: 'Ya sea que estés lanzando tu primera página de artista o buscando una casa más premium para tu marca, queremos escucharte.',
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
  },
  footer: {
    description:
      'StageLink es una página de artista premium y un link in bio para artistas, músicos, DJs, productores, bandas, creadores y artistas visuales que quieren un solo lugar prolijo para su música, contenido, merch y audiencia.',
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
