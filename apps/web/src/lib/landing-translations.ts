/**
 * Landing page translations — simple front-end dictionary.
 * Intentionally separate from the platform's next-intl i18n system,
 * which is for the authenticated app. The marketing site only needs EN + ES.
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

interface PlanItem {
  name: string;
  price: string;
  description: string;
  items: string[];
  cta: string;
  featured?: boolean;
}

export interface LandingTranslation {
  nav: {
    product: string;
    features: string;
    howItWorks: string;
    forArtists: string;
    contact: string;
    login: string;
    cta: string;
  };
  badge: string;
  hero: {
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    mockLinks: string[];
  };
  strip: {
    label: string;
    platforms: string[];
  };
  problem: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  features: {
    eyebrow: string;
    headline: string;
    items: Feature[];
  };
  howItWorks: {
    eyebrow: string;
    headline: string;
    steps: Step[];
    blocksLabel: string;
    blocksHeadline: string;
    blocks: string[];
  };
  forArtists: {
    eyebrow: string;
    headline: string;
    body: string;
    segments: Segment[];
  };
  differentiation: {
    eyebrow: string;
    headline: string;
    body: string;
    points: string[];
  };
  pricing: {
    eyebrow: string;
    headline: string;
    popular: string;
    plans: PlanItem[];
  };
  cta: {
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
    message: string;
    messagePlaceholder: string;
    submit: string;
    success: string;
  };
  footer: {
    description: string;
    links: {
      features: string;
      pricing: string;
      contact: string;
    };
    copyright: string;
  };
}

const en: LandingTranslation = {
  nav: {
    product: 'Product',
    features: 'Features',
    howItWorks: 'How it works',
    forArtists: 'For artists',
    contact: 'Contact',
    login: 'Log in',
    cta: 'Create your StageLink',
  },
  badge: 'Your Digital Stage',
  hero: {
    headline: 'Build your artist landing page in minutes.',
    subheadline:
      'Centralize your music, links, videos, and merch in one premium page. Made for musicians, DJs, producers, and creators.',
    ctaPrimary: 'Create your StageLink',
    ctaSecondary: 'See an example',
    mockLinks: ['Listen on Spotify', 'Watch on YouTube', 'Buy merch', 'Join my fan list'],
  },
  strip: {
    label: 'Connects with your platforms',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'The problem',
    headline: 'Your audience is everywhere. Your links are a mess.',
    body: 'Music on Spotify, mixes on SoundCloud, videos on YouTube, merch on another store — and a different link for each one. StageLink brings everything together in one polished page, so fans always know where to find you.',
  },
  features: {
    eyebrow: 'Features',
    headline: "Everything artists need. Nothing they don't.",
    items: [
      {
        title: 'Built for artists',
        description:
          'Musicians, DJs, painters, actors, photographers and creators can build a professional page in minutes — no design skills needed.',
      },
      {
        title: 'All your platforms, one link',
        description:
          'Connect Spotify, SoundCloud, YouTube, TikTok, Instagram and more in a clean, beautiful setup.',
      },
      {
        title: 'Sell merch directly',
        description:
          'Connect your Shopify store to showcase products, drops and limited editions right from your artist page.',
      },
      {
        title: 'Grow your audience',
        description:
          'Capture fan emails, promote events, announce releases and understand your audience with built-in analytics.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    headline: 'Your page live in under 5 minutes.',
    steps: [
      {
        step: '01',
        title: 'Create your profile',
        text: 'Pick your artist type, upload your photo, write your bio and claim your unique username.',
      },
      {
        step: '02',
        title: 'Add your links and content',
        text: 'Paste your Spotify, YouTube, Instagram and Shopify links. Add music embeds, video or a fan capture form.',
      },
      {
        step: '03',
        title: 'Share everywhere',
        text: 'Go live instantly. Use your StageLink URL on Instagram, TikTok, email — wherever fans find you.',
      },
    ],
    blocksLabel: 'Content blocks',
    blocksHeadline: 'Mix and match your stage.',
    blocks: [
      'Music embeds',
      'Video embeds',
      'Event dates',
      'Portfolio gallery',
      'Fan email capture',
      'Shopify store',
      'Electronic press kit',
      'Smart links',
    ],
  },
  forArtists: {
    eyebrow: "Who it's for",
    headline: 'Made for every kind of artist.',
    body: "Whether you're a DJ building your booking presence, a musician connecting fans to your latest release, or a visual artist sharing your portfolio — StageLink was made for you.",
    segments: [
      { label: 'DJs', description: 'Booking links, SoundCloud mixes, event dates' },
      { label: 'Musicians', description: 'Spotify, Apple Music, tour dates, merch' },
      { label: 'Producers', description: 'Beats, collabs, SoundCloud, contact' },
      { label: 'Visual artists', description: 'Portfolio, shop, commissions, social' },
      { label: 'Bands', description: 'Shows, merch, music, fan list' },
      { label: 'Creators', description: 'Content, collabs, audience, monetization' },
    ],
  },
  differentiation: {
    eyebrow: 'Why StageLink',
    headline: "Generic bio tools weren't built for artists.",
    body: 'StageLink focuses on the workflows that matter most to creative professionals: releases, shows, visual portfolio, merch, fan relationships and press materials.',
    points: [
      'Smart links automatically route fans to their preferred platform.',
      'Artist-first templates that look premium from day one.',
      'EPK builder to help you pitch yourself professionally.',
      'Direct Shopify integration — sell without the complexity.',
    ],
  },
  pricing: {
    eyebrow: 'Pricing',
    headline: 'Affordable plans for every stage of growth.',
    popular: 'Most popular',
    plans: [
      {
        name: 'Free',
        price: '$0',
        description: 'Perfect to get started',
        items: ['1 artist page', 'Core links and embeds', 'Basic analytics', 'Google Ads enabled'],
        cta: 'Start free',
      },
      {
        name: 'Pro',
        price: '$5/mo',
        description: 'For growing artists',
        items: ['No ads', 'Advanced analytics', 'Custom domain', 'Shopify integration'],
        cta: 'Go Pro',
        featured: true,
      },
      {
        name: 'Pro+',
        price: '$9/mo',
        description: 'For serious creator brands',
        items: ['EPK builder', 'Fan email capture', 'Multi-language pages', 'Priority features'],
        cta: 'Get Pro+',
      },
    ],
  },
  cta: {
    headline: 'Your audience deserves a better page.',
    body: 'Build a beautiful home for your music, art, events and products. Start free — no credit card needed.',
    primary: 'Create your StageLink',
    secondary: 'See an example',
  },
  contact: {
    eyebrow: 'Contact',
    headline: 'Get in touch.',
    body: "Have a question, idea or want to explore a partnership? We'd love to hear from you.",
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    artistType: 'Artist type',
    artistTypePlaceholder: 'e.g. DJ, musician, producer...',
    message: 'Message',
    messagePlaceholder: "Tell us about yourself and what you're looking for...",
    submit: 'Send message',
    success: "Thanks! We'll be in touch soon.",
  },
  footer: {
    description:
      'StageLink is a premium artist landing page platform for musicians, DJs, producers and creators. Build your digital stage in minutes.',
    links: {
      features: 'Features',
      pricing: 'Pricing',
      contact: 'Contact',
    },
    copyright: '© {year} StageLink. All rights reserved.',
  },
};

const es: LandingTranslation = {
  nav: {
    product: 'Producto',
    features: 'Funciones',
    howItWorks: 'Cómo funciona',
    forArtists: 'Para artistas',
    contact: 'Contacto',
    login: 'Iniciar sesión',
    cta: 'Crear tu StageLink',
  },
  badge: 'Tu Escenario Digital',
  hero: {
    headline: 'Tu página de artista lista en minutos.',
    subheadline:
      'Centralizá tu música, links, videos y merch en una sola página premium. Hecha para músicos, DJs, productores y creadores.',
    ctaPrimary: 'Crear tu StageLink',
    ctaSecondary: 'Ver un ejemplo',
    mockLinks: ['Escuchar en Spotify', 'Ver en YouTube', 'Comprar merch', 'Unirme a la lista'],
  },
  strip: {
    label: 'Se conecta con tus plataformas',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'El problema',
    headline: 'Tu audiencia está en todos lados. Tus links, no.',
    body: 'Música en Spotify, mixes en SoundCloud, videos en YouTube, merch en otra tienda — y un link diferente para cada cosa. StageLink une todo en una sola página prolija, para que tus fans siempre sepan dónde encontrarte.',
  },
  features: {
    eyebrow: 'Funciones',
    headline: 'Todo lo que un artista necesita. Nada que no.',
    items: [
      {
        title: 'Hecho para artistas',
        description:
          'Músicos, DJs, pintores, actores, fotógrafos y creadores pueden armar una página profesional en minutos, sin necesitar diseño.',
      },
      {
        title: 'Todas tus plataformas, un solo link',
        description:
          'Conectá Spotify, SoundCloud, YouTube, TikTok, Instagram y más en una configuración simple y elegante.',
      },
      {
        title: 'Vendé merch directamente',
        description:
          'Conectá tu tienda Shopify para mostrar productos, lanzamientos y ediciones limitadas desde tu página de artista.',
      },
      {
        title: 'Hacé crecer tu audiencia',
        description:
          'Capturá emails de fans, promové eventos, anunciá lanzamientos y entendé a tu audiencia con analíticas integradas.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Cómo funciona',
    headline: 'Tu página en vivo en menos de 5 minutos.',
    steps: [
      {
        step: '01',
        title: 'Creá tu perfil',
        text: 'Elegí tu tipo de artista, subí tu foto, escribí tu bio y elegí tu nombre de usuario único.',
      },
      {
        step: '02',
        title: 'Agregá tus links y contenido',
        text: 'Pegá tus links de Spotify, YouTube, Instagram y Shopify. Sumá embeds de música, video o formularios para fans.',
      },
      {
        step: '03',
        title: 'Compartí en todos lados',
        text: 'Publicá al instante. Usá tu URL de StageLink en Instagram, TikTok, email — donde sea que tus fans te encuentren.',
      },
    ],
    blocksLabel: 'Bloques de contenido',
    blocksHeadline: 'Armá tu escenario como quieras.',
    blocks: [
      'Embeds de música',
      'Embeds de video',
      'Fechas de shows',
      'Galería de portfolio',
      'Captura de emails',
      'Tienda Shopify',
      'Kit de prensa electrónico',
      'Smart links',
    ],
  },
  forArtists: {
    eyebrow: 'Para quién',
    headline: 'Hecho para todo tipo de artista.',
    body: 'Seas un DJ construyendo tu presencia para bookings, un músico conectando fans con tu último lanzamiento, o un artista visual compartiendo tu portfolio — StageLink fue hecho para vos.',
    segments: [
      { label: 'DJs', description: 'Links de booking, mixes en SoundCloud, fechas de shows' },
      { label: 'Músicos', description: 'Spotify, Apple Music, giras, merch' },
      { label: 'Productores', description: 'Beats, collabs, SoundCloud, contacto' },
      { label: 'Artistas visuales', description: 'Portfolio, tienda, comisiones, redes' },
      { label: 'Bandas', description: 'Shows, merch, música, lista de fans' },
      { label: 'Creadores', description: 'Contenido, collabs, audiencia, monetización' },
    ],
  },
  differentiation: {
    eyebrow: 'Por qué StageLink',
    headline: 'Las herramientas genéricas no fueron hechas para artistas.',
    body: 'StageLink se enfoca en los flujos que más importan a los profesionales creativos: lanzamientos, shows, portfolio visual, merch, relaciones con fans y materiales de prensa.',
    points: [
      'Los smart links llevan a cada fan a su plataforma preferida.',
      'Templates pensados para artistas, premium desde el primer día.',
      'EPK builder para que te presentes como profesional.',
      'Integración directa con Shopify — vendé sin complicaciones.',
    ],
  },
  pricing: {
    eyebrow: 'Precios',
    headline: 'Planes accesibles para cada etapa de crecimiento.',
    popular: 'El más popular',
    plans: [
      {
        name: 'Free',
        price: '$0',
        description: 'Perfecto para comenzar',
        items: [
          '1 página de artista',
          'Links y embeds principales',
          'Analíticas básicas',
          'Anuncios de Google activos',
        ],
        cta: 'Empezar gratis',
      },
      {
        name: 'Pro',
        price: '$5/mes',
        description: 'Para artistas en crecimiento',
        items: [
          'Sin anuncios',
          'Analíticas avanzadas',
          'Dominio personalizado',
          'Integración con Shopify',
        ],
        cta: 'Ir a Pro',
        featured: true,
      },
      {
        name: 'Pro+',
        price: '$9/mes',
        description: 'Para marcas creativas serias',
        items: [
          'EPK builder',
          'Captura de emails de fans',
          'Páginas multiidioma',
          'Features prioritarias',
        ],
        cta: 'Obtener Pro+',
      },
    ],
  },
  cta: {
    headline: 'Tu audiencia merece una mejor página.',
    body: 'Armá un hogar hermoso para tu música, arte, eventos y productos. Empezá gratis — sin tarjeta de crédito.',
    primary: 'Crear tu StageLink',
    secondary: 'Ver un ejemplo',
  },
  contact: {
    eyebrow: 'Contacto',
    headline: 'Hablemos.',
    body: '¿Tenés una pregunta, idea o querés explorar una colaboración? Nos encantaría escucharte.',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    artistType: 'Tipo de artista',
    artistTypePlaceholder: 'Ej: DJ, músico, productor...',
    message: 'Mensaje',
    messagePlaceholder: 'Contanos sobre vos y qué estás buscando...',
    submit: 'Enviar mensaje',
    success: '¡Gracias! Nos comunicaremos pronto.',
  },
  footer: {
    description:
      'StageLink es una plataforma premium de páginas de artistas para músicos, DJs, productores y creadores. Armá tu escenario digital en minutos.',
    links: {
      features: 'Funciones',
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
