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
    socialProof: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ctaNote: string;
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
    socialProof: string;
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
    founderSupport: string;
    founderQuote: string;
    founderCredit: string;
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
    title: 'StageLink | A better home for your music',
    description:
      'StageLink helps artists share their music, grow their audience, and open the door to more bookings, collaborations, and support.',
    ogTitle: 'StageLink | Share your music in one place',
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
    headline: 'Show the full identity behind your music',
    subheadline:
      'Bring your music, sets, visuals, links, social profiles, and content into one artist page that helps people discover you fast and keeps gigs, bookings, and collaborations closer.',
    supportingText:
      'StageLink is more than a link page. It gives your sound, style, and story one place that feels like you.',
    socialProof: '1,000+ independent artists are building their presence with StageLink',
    ctaPrimary: 'Create my artist profile',
    ctaSecondary: 'See how it looks',
    ctaNote: 'Free. No credit card required.',
    previewLabel: 'Artist page preview',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'One place for what matters most',
    previewDescription:
      'Your music, your sets, your links, your social profiles, and the next step you want people to take.',
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
    label: 'A growing home for artists building a real presence',
    socialProof:
      'Your music, sets, links, social profiles, and content can live together without looking like just another link tool.',
    items: ['Music', 'Sets', 'Links', 'Social profiles', 'Content'],
    platformsLabel: 'Works with the platforms your audience already uses',
    platformsDescription:
      'Your music already lives across different platforms. StageLink brings it together in one artist presence that still feels personal.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Why this matters',
    headline: 'People can hear one track and still miss who you are',
    intro:
      'Your music is on one platform. Your sets, visuals, links, and socials live somewhere else. When everything is scattered, discovery gets harder and opportunities are easier to miss.',
    painLabel: 'What that feels like',
    painPoints: [
      'People find one part of what you do, but miss the rest of your music and identity',
      'Your story gets split into pieces across too many platforms',
      'Bookings, gigs, and collaborations are easier to miss when nothing feels connected',
    ],
    solutionLabel: 'What StageLink gives you',
    solutionPoints: [
      'One place that shows your full sound, style, visuals, and story',
      'A clearer path for people to hear your music and keep following what you do',
      'Something strong to send when a booking, collaboration, or press moment shows up',
    ],
  },
  features: {
    eyebrow: 'What it helps you do',
    headline: 'Help more people hear your music and stay close',
    intro:
      'Make it easier to discover your music, follow your world, and know where to go when they want more.',
    items: [
      {
        title: 'Help people find your music',
        description:
          'Give listeners one place to hear your music, open your sets, and keep exploring.',
      },
      {
        title: 'Grow your audience',
        description:
          'Make it simple for new listeners to follow your links, socials, and next release.',
      },
      {
        title: 'Get more opportunities',
        description: 'Be ready when gigs, bookings, collaborations, or press moments show up.',
      },
      {
        title: 'Show a stronger identity',
        description: 'Show your music, visuals, content, and story in a way that feels like you.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    headline: 'Simple from day one',
    intro:
      'You do not need to rebuild everything. You just bring your artist world into one place.',
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
    headline: 'For artists already out there',
    body: 'Different paths, same need: one place that helps people hear your music, get your identity, and keep following what you do.',
    segments: [
      {
        label: 'DJs',
        description:
          'Share sets, releases, bookings, and merch from one place that feels like you.',
      },
      {
        label: 'Musicians',
        description:
          'Bring together releases, videos, press, and the places people can support your music.',
      },
      {
        label: 'Producers',
        description:
          'Show your tracks, your collaborations, and your sound without it feeling scattered.',
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
    headline: 'Built by a DJ and producer',
    body: 'StageLink was made for music artists who need more than a list of links. It helps you show your music, sets, visuals, and story in one artist presence.',
    pillars: [
      {
        title: 'It starts with the artist',
        description:
          'The page is there to support your music, your story, and the people finding you.',
      },
      {
        title: 'It feels like your identity',
        description:
          'Your music, links, socials, and content live together in a page that still feels like you.',
      },
      {
        title: 'It helps opportunities feel closer',
        description:
          'When a booking, a gig, a collaboration, or a press moment shows up, you already have something strong to send.',
      },
    ],
    points: [
      'Your music, sets, merch, and Press Kit can live side by side.',
      'People get a clearer sense of who you are and what your sound is about in seconds.',
      'You can keep growing without rebuilding your whole presence every few months.',
    ],
    founderSupport: 'This is how I organize my music, my sets, and everything I do as a DJ',
    founderQuote:
      '“I created StageLink because I was using different tools for everything, and I needed one place to bring it all together in a way that actually felt like me as an artist.”',
    founderCredit: '— Robertino, DJ, Producer & creator of StageLink',
  },
  cta: {
    eyebrow: 'When you are ready',
    headline: 'Give your music a home people remember',
    body: 'Create one artist profile for your music, sets, links, social profiles, and content so the right people know where to go.',
    primary: 'Show my music',
    secondary: 'See how it works',
    note: 'Free. No credit card required.',
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
      'StageLink is where artists bring together their page, Press Kit, merch, links, and the parts of their music they want the world to see.',
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
    title: 'StageLink | Un mejor hogar para tu música',
    description:
      'StageLink ayuda a los artistas a mostrar su música, llegar a más gente y abrir la puerta a más bookings, colaboraciones y apoyo.',
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
    headline: 'Mostrá la identidad completa detrás de tu música',
    subheadline:
      'Uní tu música, tus sets, tus visuales, tus links, tus perfiles sociales y tu contenido en una sola página para que te descubran rápido y se acerquen más fechas, bookings y colaboraciones.',
    supportingText:
      'StageLink es más que una página de links. Le da a tu sonido, tu estilo y tu historia un lugar que se siente tuyo.',
    socialProof:
      'Más de 1.000 artistas independientes están construyendo su presencia con StageLink',
    ctaPrimary: 'Crear mi perfil artístico',
    ctaSecondary: 'Ver cómo se ve',
    ctaNote: 'Gratis. Sin tarjeta.',
    previewLabel: 'Preview de página de artista',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'Un solo lugar para lo que más importa',
    previewDescription:
      'Tu música, tus sets, tus links, tus perfiles sociales y el próximo paso que querés que la gente dé.',
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
    label: 'Un hogar para artistas que están construyendo una presencia real',
    socialProof:
      'Tu música, tus sets, tus links, tus perfiles sociales y tu contenido pueden convivir sin verse como otra herramienta más.',
    items: ['Música', 'Sets', 'Links', 'Perfiles sociales', 'Contenido'],
    platformsLabel: 'Se integra con las plataformas que tu audiencia ya usa',
    platformsDescription:
      'Tu música ya vive en distintas plataformas. StageLink la reúne en una presencia artística que sigue sintiéndose personal.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Por qué importa',
    headline: 'Pueden escuchar un track tuyo y aun así no entender quién sos',
    intro:
      'Tu música está en una plataforma. Tus sets, visuales, links y redes viven en otras. Cuando todo queda disperso, descubrirte se vuelve más difícil y las oportunidades pasan más fácil de largo.',
    painLabel: 'Lo que eso genera',
    painPoints: [
      'La gente encuentra una parte de tu música, pero se pierde todo lo demás',
      'Tu historia queda partida en pedazos entre demasiadas plataformas',
      'Bookings, gigs y colaboraciones pueden pasar de largo cuando todo se ve desconectado',
    ],
    solutionLabel: 'Lo que te da StageLink',
    solutionPoints: [
      'Un lugar para mostrar tu sonido, tu estilo, tus visuales y tu historia completos',
      'Una forma más clara de que la gente escuche tu música y siga de cerca lo que hacés',
      'Algo fuerte para mandar cuando aparece un booking, una colaboración o prensa',
    ],
  },
  features: {
    eyebrow: 'Cómo te ayuda',
    headline: 'Hacé que más personas escuchen tu música y se queden cerca',
    intro:
      'Hacé más fácil que te descubran, entren en tu mundo y sepan dónde encontrarte cuando quieren más.',
    items: [
      {
        title: 'Hacer que te encuentren más fácil',
        description:
          'Darles a las personas un lugar para escuchar tu música, abrir tus sets y seguir descubriendo lo que hacés.',
      },
      {
        title: 'Hacer crecer tu audiencia',
        description:
          'Facilitar que nuevos oyentes sigan tus links, tus redes y tu próximo lanzamiento.',
      },
      {
        title: 'Abrir más oportunidades',
        description: 'Estar listo cuando aparezcan bookings, gigs, colaboraciones o prensa.',
      },
      {
        title: 'Construir una identidad más clara',
        description:
          'Mostrar tu música, tus visuales, tu contenido y tu historia de una forma que se sienta tuya.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Cómo funciona',
    headline: 'Simple desde el primer día',
    intro: 'No hace falta rehacer todo. Solo hace falta unir tu mundo artístico en un solo lugar.',
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
    headline: 'Para artistas que ya están ahí afuera',
    body: 'No importa cómo crees. La necesidad es la misma: que la gente escuche tu música, entienda tu identidad y quiera seguir de cerca lo que hacés.',
    segments: [
      {
        label: 'DJs',
        description:
          'Compartí sets, lanzamientos, bookings y merch desde un lugar que se sienta como vos.',
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
        description: 'Mostrá tu trabajo, tu contacto y tu tienda de una forma clara y cuidada.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Por qué StageLink',
    headline: 'Hecho por un DJ y productor',
    body: 'StageLink nació para artistas de música que necesitan más que una lista de links. Te ayuda a mostrar tu música, tus sets, tus visuales y tu historia en una sola presencia artística.',
    pillars: [
      {
        title: 'Todo empieza en el artista',
        description:
          'La página está para acompañar tu música, tu historia y la gente que te va encontrando.',
      },
      {
        title: 'Se siente como tu identidad',
        description:
          'Tu música, tus links, tus redes y tu contenido conviven en una página que sigue sintiéndose tuya.',
      },
      {
        title: 'Acerca más oportunidades',
        description:
          'Cuando aparece un booking, un gig, una colaboración o prensa, ya tenés algo fuerte para mandar.',
      },
    ],
    points: [
      'Tu música, tus sets, tu merch y tu Press Kit pueden convivir lado a lado.',
      'La gente entiende mejor quién sos y cómo suena lo que hacés en segundos.',
      'Podés seguir creciendo sin rehacer todo cada pocos meses.',
    ],
    founderSupport: 'Así organizo mi música, mis sets y todo lo que hago como DJ',
    founderQuote:
      '“Creé StageLink porque usaba muchas herramientas para distintas cosas, y necesitaba un solo lugar que reúna todo de una forma que de verdad se sintiera como yo como artista.”',
    founderCredit: '— Robertino, DJ, Producer & creador de StageLink',
  },
  cta: {
    eyebrow: 'Cuando quieras',
    headline: 'Dale a tu música un lugar que la gente recuerde',
    body: 'Creá un perfil artístico para tu música, tus sets, tus links, tus perfiles sociales y tu contenido para que la gente indicada sepa adónde ir.',
    primary: 'Mostrar mi música',
    secondary: 'Ver cómo funciona',
    note: 'Gratis. Sin tarjeta.',
  },
  contact: {
    eyebrow: 'Contacto',
    headline: 'Contanos qué estás creando',
    body: 'Si querés una mejor forma de mostrar tu música, escribinos. Nos encanta hablar con artistas.',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    email: 'Email',
    emailPlaceholder: 'vos@ejemplo.com',
    artistType: 'Tipo de artista',
    artistTypePlaceholder: 'Elegí tu tipo de artista',
    artistTypeOptions: ['DJ', 'Músico', 'Productor', 'Banda', 'Creador', 'Artista visual', 'Otro'],
    message: 'Mensaje',
    messagePlaceholder: 'Contanos sobre tu música, tu perfil o en qué necesitás ayuda.',
    submit: 'Enviar mensaje',
    submitting: 'Enviando...',
    success: 'Gracias. Te vamos a responder pronto.',
    error: 'Algo salió mal. Probá de nuevo en un minuto.',
  },
  footer: {
    description:
      'StageLink es el lugar donde unís tu página, tu Press Kit, tu merch, tus links y las partes de tu música que querés mostrar al mundo.',
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
