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
    ctaNote: string;
    founderLine: string;
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
    note: string;
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
    title: 'StageLink | A better home for your art',
    description:
      'StageLink helps artists share their work, grow their audience, and open the door to more bookings, collaborations, and support.',
    ogTitle: 'StageLink | Share your art in one place',
    ogDescription:
      'Bring your music, videos, Press Kit, merch, and artist story together in one place that feels like you.',
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
  badge: 'Made by an artist, for artists',
  hero: {
    headline: 'Give your art a real home',
    subheadline:
      'Share your music, videos, Press Kit, merch, and links in one place that helps more people find you and stay with you.',
    supportingText:
      'For DJs, producers, musicians, creators, bands, and visual artists who want to be easier to discover and easier to remember.',
    ctaPrimary: 'Start my StageLink',
    ctaSecondary: 'See a live preview',
    ctaNote: 'Free to start. No credit card. Setup takes a few minutes.',
    founderLine:
      'I built StageLink because I wanted one place that felt like my project, not a pile of random links.',
    previewLabel: 'Artist page preview',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'One place for what matters most',
    previewDescription:
      'Your music, your videos, your merch, your story, and the next step you want people to take.',
    previewMediaLabel: 'Featured media',
    previewMediaBadge: 'Live preview',
    previewMediaItems: ['Latest video', 'Current release'],
    previewMediaMeta: ['YouTube / Live clip', 'Spotify / New music'],
    previewAboutLabel: 'About',
    previewAboutText:
      'A clear artist page can help fans, bookers, and collaborators understand who you are in seconds.',
    previewMerchLabel: 'Merch',
    previewMerchName: 'Limited merch drop',
    previewMerchPrice: '$149',
    previewMerchStatus: 'Available now',
    previewAudienceLabel: 'Audience',
    previewAudienceText:
      'Keep your next release, next show, or next drop close to the people who care.',
    previewAudienceCta: 'Join',
    previewFanLabel: 'Join the fan list',
    mockLinks: ['Listen on Spotify', 'Watch the latest video', 'Shop merch', 'Join the fan list'],
  },
  strip: {
    label: 'A growing home for independent artists',
    items: ['Music', 'Videos', 'Press Kit', 'Merch'],
    platformsLabel: 'Works with the platforms your audience already uses',
    platformsDescription:
      'Your art already lives across different places. StageLink helps you bring it together without losing your identity.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Why this matters',
    headline: 'Your art is in many places',
    intro:
      'That is normal. Music is in one place. Videos are in another. Merch, socials, and press live somewhere else. It gets hard to show the full picture.',
    painLabel: 'What that feels like',
    painPoints: [
      'People find one part of your work, but miss the rest',
      'Your story gets split across too many platforms',
      'Good opportunities can pass because everything feels scattered',
    ],
    solutionLabel: 'What StageLink gives you',
    solutionPoints: [
      'One place to share the full shape of your project',
      'A clearer way for people to discover your music and stay connected',
      'A stronger home for fans, bookers, and collaborators to understand your work',
    ],
  },
  features: {
    eyebrow: 'What it helps you do',
    headline: 'More of the right people find your work',
    intro:
      'The goal is simple. Help your art reach more people and help more of those people stay close.',
    items: [
      {
        title: 'Be easier to discover',
        description: 'Give people one place to find your music, videos, and latest moves.',
      },
      {
        title: 'Grow your audience',
        description: 'Make it easy for new listeners and viewers to keep following your journey.',
      },
      {
        title: 'Get more opportunities',
        description: 'Look ready when bookings, gigs, collaborations, and press chances show up.',
      },
      {
        title: 'Build a stronger identity',
        description:
          'Share your world in a way that feels like you, not like a generic profile page.',
      },
      {
        title: 'Keep your merch close',
        description: 'Let people support your project without sending them through a maze.',
      },
      {
        title: 'Stay connected',
        description: 'Keep your next release, next date, or next drop within easy reach.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    headline: 'Simple from day one',
    intro: 'You do not need to rebuild your whole world. You just bring it together.',
    steps: [
      {
        step: '01',
        title: 'Add your artist profile',
        text: 'Bring in your name, visuals, links, and the parts of your story you want people to see.',
      },
      {
        step: '02',
        title: 'Shape your page',
        text: 'Set up your page, your Press Kit, your merch, and the links that matter most right now.',
      },
      {
        step: '03',
        title: 'Share it everywhere',
        text: 'Use the same home across socials, releases, outreach, and new opportunities.',
      },
    ],
  },
  forArtists: {
    eyebrow: 'Built for different kinds of artists',
    headline: 'Made for artists with something to share',
    body: 'No matter how you create, the idea is the same: help people find your work, remember it, and come back for more.',
    segments: [
      {
        label: 'DJs',
        description:
          'Share sets, releases, bookings, and merch from one place that feels like your project.',
      },
      {
        label: 'Musicians',
        description:
          'Bring together releases, videos, press, and the places people can support you.',
      },
      {
        label: 'Producers',
        description:
          'Show your music, your collaborations, and your artist identity without it feeling scattered.',
      },
      {
        label: 'Creators',
        description:
          'Keep your content, links, and audience in one place people can actually follow.',
      },
      {
        label: 'Bands',
        description:
          'Share music, live content, merch, and press-ready info without repeating yourself everywhere.',
      },
      {
        label: 'Visual artists',
        description:
          'Show your work, your contact, and your shop in a way that feels calm and intentional.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Why StageLink',
    headline: 'Built by an artist. Made for artists.',
    body: 'StageLink came from a simple need: one place to share your work without making it feel small, messy, or generic.',
    pillars: [
      {
        title: 'It starts from the artist',
        description:
          'The page is there to support your music, your story, and the people discovering you.',
      },
      {
        title: 'It feels personal',
        description: 'It is not trying to look like every other link page on the internet.',
      },
      {
        title: 'It helps you look ready',
        description:
          'When a booking, a gig, a collaboration, or a press chance appears, you already have something strong to share.',
      },
    ],
    points: [
      'Your music, merch, and Press Kit can live side by side.',
      'You can keep growing without rebuilding everything every few months.',
      'People get a clearer picture of who you are and what you are making.',
    ],
  },
  cta: {
    eyebrow: 'When you are ready',
    headline: 'Let your art live in one place',
    body: 'Give people a better way to find your work, stay close to it, and share it with others.',
    primary: 'Create my StageLink',
    secondary: 'See how it works',
    note: 'Free to start. No credit card. Easy to edit later.',
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
    title: 'StageLink | Un mejor hogar para tu arte',
    description:
      'StageLink ayuda a los artistas a mostrar su obra, llegar a más gente y abrir la puerta a más bookings, colaboraciones y apoyo.',
    ogTitle: 'StageLink | Compartí tu arte en un solo lugar',
    ogDescription:
      'Uní tu música, tus videos, tu Press Kit, tu merch y tu historia en un lugar que se sienta tuyo.',
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
  badge: 'Hecho por un artista, para artistas',
  hero: {
    headline: 'Dale a tu arte un lugar real',
    subheadline:
      'Compartí tu música, tus videos, tu Press Kit, tu merch y tus links en un solo lugar que te ayude a llegar a más gente y a que se queden con vos.',
    supportingText:
      'Para DJs, productores, músicos, creadores, bandas y artistas visuales que quieren ser más fáciles de descubrir y más difíciles de olvidar.',
    ctaPrimary: 'Empezar mi StageLink',
    ctaSecondary: 'Ver un ejemplo real',
    ctaNote: 'Gratis para empezar. Sin tarjeta. Se arma en pocos minutos.',
    founderLine:
      'Creé StageLink porque necesitaba un lugar que se sintiera como mi proyecto, no como una pila de links sueltos.',
    previewLabel: 'Preview de página de artista',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'Un solo lugar para lo que más importa',
    previewDescription:
      'Tu música, tus videos, tu merch, tu historia y el próximo paso que querés que la gente dé.',
    previewMediaLabel: 'Media destacada',
    previewMediaBadge: 'Preview en vivo',
    previewMediaItems: ['Último video', 'Lanzamiento actual'],
    previewMediaMeta: ['YouTube / Clip en vivo', 'Spotify / Música nueva'],
    previewAboutLabel: 'Sobre el artista',
    previewAboutText:
      'Una página clara puede ayudar a fans, bookers y colaboradores a entender quién sos en segundos.',
    previewMerchLabel: 'Merch',
    previewMerchName: 'Drop limitado de merch',
    previewMerchPrice: '$149',
    previewMerchStatus: 'Disponible ahora',
    previewAudienceLabel: 'Audiencia',
    previewAudienceText:
      'Mantené tu próximo lanzamiento, tu próxima fecha o tu próximo drop cerca de la gente que de verdad conecta con vos.',
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
    label: 'Un hogar que ya están usando artistas independientes',
    items: ['Música', 'Videos', 'Press Kit', 'Merch'],
    platformsLabel: 'Se integra con las plataformas que tu audiencia ya usa',
    platformsDescription:
      'Tu arte ya vive en distintos lugares. StageLink te ayuda a unirlo sin perder tu identidad.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Por qué importa',
    headline: 'Tu arte vive en muchos lugares',
    intro:
      'Es normal. La música está en un lado. Los videos en otro. El merch, las redes y la prensa viven por separado. Se vuelve difícil mostrar el cuadro completo.',
    painLabel: 'Lo que eso genera',
    painPoints: [
      'La gente encuentra una parte de tu obra, pero se pierde el resto',
      'Tu historia queda repartida entre demasiadas plataformas',
      'Buenas oportunidades pueden pasar de largo porque todo se ve disperso',
    ],
    solutionLabel: 'Lo que te da StageLink',
    solutionPoints: [
      'Un solo lugar para mostrar la forma completa de tu proyecto',
      'Una manera más clara de que la gente descubra tu música y siga cerca',
      'Un espacio más fuerte para fans, bookers y colaboradores que quieren entender tu obra',
    ],
  },
  features: {
    eyebrow: 'Cómo te ayuda',
    headline: 'Más gente encuentra tu obra',
    intro:
      'La idea es simple: ayudar a que tu arte llegue a más gente y que más de esa gente se quede con vos.',
    items: [
      {
        title: 'Ser más fácil de descubrir',
        description:
          'Darle a la gente un lugar donde encontrar tu música, tus videos y lo que viene después.',
      },
      {
        title: 'Hacer crecer tu audiencia',
        description: 'Facilitar que nuevos oyentes y nuevas miradas sigan tu camino.',
      },
      {
        title: 'Abrir más oportunidades',
        description: 'Verse listo cuando aparezcan bookings, gigs, colaboraciones o prensa.',
      },
      {
        title: 'Construir una identidad más clara',
        description: 'Compartir tu mundo de una forma que se sienta tuya, no genérica.',
      },
      {
        title: 'Tener el merch cerca',
        description: 'Dejar que la gente apoye tu proyecto sin mandarla por un laberinto.',
      },
      {
        title: 'Seguir conectado',
        description:
          'Mantener tu próximo release, tu próxima fecha o tu próximo drop al alcance de quien te sigue.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Cómo funciona',
    headline: 'Simple desde el primer día',
    intro: 'No hace falta rehacer todo tu mundo. Solo hace falta unirlo.',
    steps: [
      {
        step: '01',
        title: 'Cargá tu perfil',
        text: 'Sumá tu nombre, tus visuales, tus links y las partes de tu historia que querés mostrar.',
      },
      {
        step: '02',
        title: 'Armá tu página',
        text: 'Configurá tu página, tu Press Kit, tu merch y los links que hoy más te importa compartir.',
      },
      {
        step: '03',
        title: 'Compartilo en todos lados',
        text: 'Usá el mismo hogar para redes, lanzamientos, outreach y nuevas oportunidades.',
      },
    ],
  },
  forArtists: {
    eyebrow: 'Para distintos tipos de artistas',
    headline: 'Hecho para artistas con algo que mostrar',
    body: 'No importa cómo crees. La idea es la misma: ayudar a que más gente encuentre tu obra, la recuerde y vuelva.',
    segments: [
      {
        label: 'DJs',
        description:
          'Compartí sets, lanzamientos, bookings y merch desde un lugar que se sienta como tu proyecto.',
      },
      {
        label: 'Músicos',
        description: 'Uní lanzamientos, videos, prensa y formas de apoyo en un solo lugar.',
      },
      {
        label: 'Productores',
        description:
          'Mostrá tu música, tus colaboraciones y tu identidad sin que todo quede disperso.',
      },
      {
        label: 'Creadores',
        description:
          'Mantené tu contenido, tus links y tu comunidad en un lugar que la gente pueda seguir de verdad.',
      },
      {
        label: 'Bandas',
        description:
          'Compartí música, contenido en vivo, merch y Press Kit sin repetir lo mismo en todos lados.',
      },
      {
        label: 'Artistas visuales',
        description: 'Mostrá tu obra, tu contacto y tu tienda de una forma clara y cuidada.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Por qué StageLink',
    headline: 'Hecho por un artista. Pensado para artistas.',
    body: 'StageLink nació de una necesidad simple: tener un solo lugar para compartir tu obra sin que se vea chica, desordenada o genérica.',
    pillars: [
      {
        title: 'Todo empieza en el artista',
        description:
          'La página está para acompañar tu música, tu historia y la gente que te descubre.',
      },
      {
        title: 'Se siente personal',
        description: 'No intenta verse como otra página de links más del montón.',
      },
      {
        title: 'Te ayuda a verte listo',
        description:
          'Cuando aparece un booking, un gig, una colaboración o prensa, ya tenés algo fuerte para compartir.',
      },
    ],
    points: [
      'Tu música, tu merch y tu Press Kit pueden convivir lado a lado.',
      'Podés seguir creciendo sin rehacer todo cada pocos meses.',
      'La gente entiende mejor quién sos y qué estás creando.',
    ],
  },
  cta: {
    eyebrow: 'Cuando quieras',
    headline: 'Dejá que tu arte viva en un solo lugar',
    body: 'Dale a la gente una mejor forma de encontrar tu obra, quedarse cerca y compartirla con otros.',
    primary: 'Crear mi StageLink',
    secondary: 'Ver cómo funciona',
    note: 'Gratis para empezar. Sin tarjeta. Después lo editás a tu ritmo.',
  },
  contact: {
    eyebrow: 'Contacto',
    headline: 'Contanos qué estás creando',
    body: 'Si querés una mejor forma de mostrar tu proyecto, escribinos. Nos encanta hablar con artistas.',
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
      'StageLink es un hogar para tu música, tu historia, tu Press Kit, tu merch y la gente que conecta con tu arte.',
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
