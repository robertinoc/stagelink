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
    title: 'StageLink | The artist platform that turns attention into fans, streams, and sales',
    description:
      'StageLink helps artists turn profile traffic into streams, followers, fans, and sales with a public page, Press Kit (EPK), merch, smart links, and connected analytics.',
    ogTitle: 'StageLink | Turn artist attention into fans, streams, and sales',
    ogDescription:
      'A platform for artists who need more than a bio link: page, Press Kit, merch, smart links, audience capture, and analytics in one place.',
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
  badge: 'For artists building real momentum',
  hero: {
    headline: 'Stop sending people everywhere. Start turning attention into fans.',
    subheadline:
      'StageLink gives artists one place to turn profile traffic into streams, followers, fans, and sales with a public page, Press Kit (EPK), merch, smart links, and built-in analytics.',
    supportingText:
      'Built for DJs, producers, musicians, creators, and artist teams who are tired of sending traffic into a mess of disconnected links and hoping people figure it out.',
    ctaPrimary: 'Start building my StageLink',
    ctaSecondary: 'See the preview',
    ctaNote: 'Free to start. No credit card. Fast setup.',
    previewLabel: 'Artist page preview',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'What fans see when everything finally connects',
    previewDescription:
      'Instead of hunting through random links, people get one clear path into your music, your videos, your merch, your fan list, and your next move.',
    previewMediaLabel: 'Featured media',
    previewMediaBadge: 'Live preview',
    previewMediaItems: ['Latest video', 'Current release'],
    previewMediaMeta: ['YouTube / Performance clip', 'Spotify / Release push'],
    previewAboutLabel: 'About',
    previewAboutText:
      'Your profile, your story, your latest drop, your Press Kit, and your audience flow can finally live in one place that feels intentional.',
    previewMerchLabel: 'Merch',
    previewMerchName: 'Limited merch drop',
    previewMerchPrice: '$149',
    previewMerchStatus: 'Available now',
    previewAudienceLabel: 'Audience',
    previewAudienceText:
      'Capture warm traffic before it disappears and keep your next release one click away.',
    previewAudienceCta: 'Join',
    previewFanLabel: 'Join the fan list',
    mockLinks: [
      'Stream the new release',
      'Watch the latest video',
      'Shop merch',
      'Join the fan list',
    ],
  },
  strip: {
    label: 'Join a growing wave of artists building a smarter home online',
    items: [
      'Artist landing page',
      'Link in bio for artists',
      'Landing page for musicians',
      'Creator landing page',
    ],
    platformsLabel: 'Works with the platforms your audience already uses',
    platformsDescription:
      'Spotify, SoundCloud, YouTube, Shopify, TikTok, and Instagram are already part of your audience flow. StageLink helps you turn that traffic into action instead of losing it in the shuffle.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Why artists get stuck',
    headline: "Most artists don't have a traffic problem. They have a conversion problem.",
    intro:
      'People click your profile, but then what? One link goes to Spotify. Another goes to YouTube. Merch lives somewhere else. Your Press Kit is separate. Your analytics are fragmented. Attention shows up, then leaks out.',
    painLabel: 'What happens now',
    painPoints: [
      'You send people to too many places and hope they keep following the trail',
      'Your content feels fragmented, so your audience never gets a clear next step',
      'You cannot easily tell what is actually driving streams, fans, or sales',
    ],
    solutionLabel: 'What StageLink changes',
    solutionPoints: [
      'One artist platform where your page, Press Kit, merch, audience capture, and analytics work together',
      'A cleaner path from profile visit to stream, follow, signup, or purchase',
      'A setup that actually helps you understand what is working so you can improve it',
    ],
  },
  features: {
    eyebrow: 'Outcomes first',
    headline: 'What StageLink helps you do with the attention you already have',
    intro:
      'The features matter because of what they help you get: more streams, more fan capture, better decisions, a stronger brand, and fewer missed opportunities.',
    items: [
      {
        title: 'Turn clicks into streams',
        description:
          'Guide visitors from one artist page into your release, your latest video, or the next action that actually matters.',
      },
      {
        title: 'Stop losing warm traffic',
        description:
          'Use audience capture, smart links, merch, and focused sections so attention does not disappear after one click.',
      },
      {
        title: 'Know what is working',
        description:
          'Read StageLink analytics and connected platform snapshots so you can see what your audience actually responds to.',
      },
      {
        title: 'Sell merch without chaos',
        description:
          'Bring Shopify and Smart Merch into the same experience instead of sending fans into a disconnected store flow.',
      },
      {
        title: 'Look ready when opportunities show up',
        description:
          'Turn your profile into a Press Kit (EPK) that is ready to share with bookers, collaborators, and press.',
      },
      {
        title: 'Keep your project organized as you grow',
        description:
          'One profile powers your page, your Press Kit, your links, your merch, and your connected insights.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    headline: 'Set it up once. Use it everywhere.',
    intro:
      'The goal is not more admin. It is less chaos and better outcomes from the traffic you already earn.',
    steps: [
      {
        step: '01',
        title: 'Build your artist home',
        text: 'Set up your profile, your page, and your core links once so your public presence stops feeling fragmented.',
      },
      {
        step: '02',
        title: 'Connect what matters',
        text: 'Add music, videos, merch, smart links, Press Kit details, and fan capture without juggling five separate tools.',
      },
      {
        step: '03',
        title: 'Share it and learn from it',
        text: 'Use the same system across social media, releases, outreach, and campaigns, then check what is driving real response.',
      },
    ],
  },
  forArtists: {
    eyebrow: 'Built for artists',
    headline: 'Built for artists. Not for everyone.',
    body: 'StageLink is for artists whose work already lives across multiple platforms, releases, audiences, and goals. It is not trying to be a generic creator page for everyone on the internet.',
    segments: [
      {
        label: 'DJs',
        description:
          'Push mixes, releases, bookings, merch, and crowd-building links from one place that feels like your project.',
      },
      {
        label: 'Musicians',
        description:
          'Turn profile traffic into streams, follows, ticket clicks, and fan capture instead of scattering it across random destinations.',
      },
      {
        label: 'Producers',
        description:
          'Share beats, collaborations, releases, and professional materials without rebuilding your story in different tools.',
      },
      {
        label: 'Bands',
        description:
          'Keep songs, live content, merch, updates, and a usable Press Kit in one shared system.',
      },
      {
        label: 'Creators',
        description:
          'Turn your audience into an actual funnel for content, products, community, and repeat attention.',
      },
      {
        label: 'Visual artists',
        description:
          'Present portfolio, contact, store, and audience actions without looking like a generic bio page.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Why StageLink',
    headline: 'Generic link tools help you list things. StageLink helps you move people.',
    body: 'That is the difference. StageLink is built for artists who want one system for visibility, credibility, audience capture, merch, and analytics instead of a prettier list of links.',
    pillars: [
      {
        title: 'Made for artist workflows',
        description:
          'Page, Press Kit, merch, analytics, and audience flow are treated like parts of the same project because that is what they are.',
      },
      {
        title: 'Outcomes before features',
        description:
          'The goal is not to give you more widgets. It is to help you get more streams, more followers, more fans, and more sales.',
      },
      {
        title: 'Built to grow with you',
        description:
          'You can start with a page and grow into Press Kit, merch, insights, localization, and smarter audience flows without rebuilding from scratch.',
      },
    ],
    points: [
      'One profile powers your public page, your Press Kit, and your platform connections.',
      'Merch, smart links, and fan capture help you turn attention into action.',
      'Analytics help you see what is earning clicks, streams, and interest so you can adjust with confidence.',
    ],
  },
  cta: {
    eyebrow: 'Ready when you are',
    headline: 'If your audience is already paying attention, give them somewhere better to land.',
    body: 'Stop sending people into a dead-end link page. Build a StageLink that helps your music, your content, your merch, and your audience actually move.',
    primary: 'Create my StageLink',
    secondary: 'See how it works',
    note: 'Free to start. No credit card. You can publish fast.',
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
    title:
      'StageLink | La plataforma para artistas que convierte atención en fans, streams y ventas',
    description:
      'StageLink ayuda a los artistas a convertir el tráfico de su perfil en streams, seguidores, fans y ventas con página pública, Press Kit (EPK), merch, smart links y analíticas conectadas.',
    ogTitle: 'StageLink | Convertí atención en fans, streams y ventas',
    ogDescription:
      'Una plataforma para artistas que necesitan más que un bio link: página, Press Kit, merch, smart links, captura de audiencia y analíticas en un solo lugar.',
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
  badge: 'Para artistas que están construyendo algo real',
  hero: {
    headline: 'Dejá de mandar gente para todos lados. Empezá a convertir atención en fans.',
    subheadline:
      'StageLink le da a los artistas un solo lugar para convertir el tráfico de su perfil en streams, seguidores, fans y ventas con página pública, Press Kit (EPK), merch, smart links y analíticas integradas.',
    supportingText:
      'Hecho para DJs, productores, músicos, creadores y equipos artísticos que están cansados de mandar tráfico a un caos de links desconectados y esperar que la gente se arregle sola.',
    ctaPrimary: 'Empezar mi StageLink',
    ctaSecondary: 'Ver cómo se ve',
    ctaNote: 'Gratis para empezar. Sin tarjeta. Setup rápido.',
    previewLabel: 'Preview de página de artista',
    previewHandle: '@robertino',
    previewRoles: 'DJ · Producer · Creator',
    previewTags: ['Techno', 'Hard Techno', 'Bounce', 'Psytrance'],
    previewTitle: 'Lo que ve la gente cuando por fin todo está conectado',
    previewDescription:
      'En lugar de perseguir links sueltos, la gente encuentra un camino claro hacia tu música, tus videos, tu merch, tu lista de fans y tu próximo paso.',
    previewMediaLabel: 'Media destacada',
    previewMediaBadge: 'Preview en vivo',
    previewMediaItems: ['Último video', 'Lanzamiento actual'],
    previewMediaMeta: ['YouTube / Clip en vivo', 'Spotify / Push de lanzamiento'],
    previewAboutLabel: 'Sobre el artista',
    previewAboutText:
      'Tu perfil, tu historia, tu lanzamiento, tu Press Kit y tu flujo de audiencia finalmente pueden vivir en un mismo lugar con sentido.',
    previewMerchLabel: 'Merch',
    previewMerchName: 'Drop limitado de merch',
    previewMerchPrice: '$149',
    previewMerchStatus: 'Disponible ahora',
    previewAudienceLabel: 'Audiencia',
    previewAudienceText:
      'Capturá tráfico caliente antes de que se pierda y dejá tu próximo lanzamiento a un solo click.',
    previewAudienceCta: 'Sumarme',
    previewFanLabel: 'Sumarme a la lista de fans',
    mockLinks: [
      'Escuchar el nuevo release',
      'Ver el último video',
      'Comprar merch',
      'Sumarme a la lista de fans',
    ],
  },
  strip: {
    label: 'Sumate a una nueva camada de artistas que arma una base online más inteligente',
    items: [
      'Página de artista',
      'Link in bio para artistas',
      'Landing page para músicos',
      'Landing page para creadores',
    ],
    platformsLabel: 'Se integra con las plataformas que tu audiencia ya usa',
    platformsDescription:
      'Spotify, SoundCloud, YouTube, Shopify, TikTok e Instagram ya forman parte del recorrido de tu audiencia. StageLink te ayuda a convertir ese tráfico en acción, no a perderlo en el camino.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'TikTok', 'Instagram'],
  },
  problem: {
    eyebrow: 'Por qué cuesta tanto convertir',
    headline:
      'La mayoría de los artistas no tiene un problema de tráfico. Tiene un problema de conversión.',
    intro:
      'La gente entra a tu perfil, pero después qué. Un link va a Spotify. Otro a YouTube. El merch vive en otro lado. El Press Kit está separado. Las analíticas están fragmentadas. La atención llega, pero se escapa.',
    painLabel: 'Lo que pasa hoy',
    painPoints: [
      'Mandás gente a demasiados lugares y esperás que siga sola el recorrido',
      'Tu contenido se siente fragmentado, así que tu audiencia nunca recibe un próximo paso claro',
      'No podés ver con claridad qué está generando streams, fans o ventas de verdad',
    ],
    solutionLabel: 'Lo que cambia con StageLink',
    solutionPoints: [
      'Una sola plataforma donde tu página, tu Press Kit, tu merch, tu captura de audiencia y tus analíticas trabajan juntas',
      'Un camino mucho más claro desde una visita hasta un stream, un follow, un signup o una compra',
      'Un sistema pensado para artistas que quieren entender qué les funciona y mejorar desde ahí',
    ],
  },
  features: {
    eyebrow: 'Resultados primero',
    headline: 'Lo que StageLink te ayuda a conseguir con la atención que ya generás',
    intro:
      'Las funciones importan por lo que te ayudan a lograr: más streams, más captura de fans, mejores decisiones, mejor presentación y menos oportunidades perdidas.',
    items: [
      {
        title: 'Convertir clicks en streams',
        description:
          'Guiá a la gente desde una sola página hacia tu release, tu último video o la acción que realmente te importa.',
      },
      {
        title: 'Dejar de perder tráfico caliente',
        description:
          'Usá captura de audiencia, smart links, merch y secciones enfocadas para que la atención no se corte después del primer click.',
      },
      {
        title: 'Entender qué te funciona',
        description:
          'Leé las analíticas de StageLink y los snapshots conectados para ver a qué responde de verdad tu audiencia.',
      },
      {
        title: 'Vender merch sin caos',
        description:
          'Traé Shopify y Smart Merch al mismo sistema en vez de mandar fans a una experiencia desconectada.',
      },
      {
        title: 'Mostrarse listo cuando aparece una oportunidad',
        description:
          'Convertí tu perfil en un Press Kit (EPK) compartible para bookers, prensa y colaboraciones sin rearmar tu historia cada vez.',
      },
      {
        title: 'Mantener el proyecto ordenado mientras crece',
        description:
          'Un solo perfil impulsa tu página, tu Press Kit, tus links, tu merch y tus insights conectados.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Cómo funciona',
    headline: 'Lo configurás una vez. Lo usás en todos lados.',
    intro:
      'La idea no es sumar más admin. Es bajar el caos y sacar más resultado del tráfico que ya conseguís.',
    steps: [
      {
        step: '01',
        title: 'Armá tu base de artista',
        text: 'Configurá tu perfil, tu página y tus links principales una sola vez para que tu presencia pública deje de sentirse fragmentada.',
      },
      {
        step: '02',
        title: 'Conectá lo importante',
        text: 'Sumá música, videos, merch, smart links, datos de Press Kit y captura de audiencia sin saltar entre cinco herramientas.',
      },
      {
        step: '03',
        title: 'Compartilo y aprendé de eso',
        text: 'Usá el mismo sistema para redes, lanzamientos, outreach y campañas, y después mirá qué está generando respuesta real.',
      },
    ],
  },
  forArtists: {
    eyebrow: 'Para artistas',
    headline: 'Hecho para artistas. No para cualquiera.',
    body: 'StageLink está pensado para artistas cuyo trabajo ya vive en múltiples plataformas, formatos, audiencias y objetivos. No intenta ser otra tool genérica para cualquier tipo de creador.',
    segments: [
      {
        label: 'DJs',
        description:
          'Impulsá sets, lanzamientos, bookings, merch y links de comunidad desde una sola base que sí se siente como tu proyecto.',
      },
      {
        label: 'Músicos',
        description:
          'Convertí visitas a tu perfil en streams, follows, clicks a tickets y captura de audiencia en vez de repartirlas por todos lados.',
      },
      {
        label: 'Productores',
        description:
          'Compartí beats, colaboraciones, lanzamientos y materiales profesionales sin reconstruir tu historia en herramientas distintas.',
      },
      {
        label: 'Bandas',
        description:
          'Mantené canciones, contenido en vivo, merch, novedades y un Press Kit utilizable dentro del mismo sistema.',
      },
      {
        label: 'Creadores',
        description:
          'Convertí tu audiencia en un recorrido real hacia contenido, productos, comunidad y atención repetida.',
      },
      {
        label: 'Artistas visuales',
        description:
          'Mostrá portfolio, contacto, tienda y acciones clave sin parecer otra bio page genérica.',
      },
    ],
  },
  monetization: {
    eyebrow: 'Por qué StageLink',
    headline:
      'Las herramientas genéricas te ayudan a listar cosas. StageLink te ayuda a mover gente.',
    body: 'Esa es la diferencia. StageLink está hecho para artistas que quieren un solo sistema para visibilidad, credibilidad, captura de audiencia, merch y analíticas, no una lista más linda de links.',
    pillars: [
      {
        title: 'Hecho para el workflow artístico',
        description:
          'Página, Press Kit, merch, analíticas y flujo de audiencia se tratan como partes del mismo proyecto porque eso es lo que son.',
      },
      {
        title: 'Resultados antes que features',
        description:
          'La idea no es darte más widgets. La idea es ayudarte a conseguir más streams, más seguidores, más fans y más ventas.',
      },
      {
        title: 'Crece con vos',
        description:
          'Podés arrancar con una página y crecer hacia Press Kit, merch, insights, localización y flujos de audiencia más inteligentes sin rehacer todo desde cero.',
      },
    ],
    points: [
      'Un solo perfil impulsa tu página pública, tu Press Kit y tus conexiones de plataforma.',
      'Merch, smart links y captura de audiencia te ayudan a convertir atención en acción.',
      'Las analíticas te muestran qué está generando clicks, streams e interés para que ajustes con criterio.',
    ],
  },
  cta: {
    eyebrow: 'Cuando quieras',
    headline: 'Si tu audiencia ya te está prestando atención, dale un lugar mejor a donde llegar.',
    body: 'Dejá de mandar gente a una página de links sin salida. Construí un StageLink que ayude a mover tu música, tu contenido, tu merch y tu audiencia.',
    primary: 'Crear mi StageLink',
    secondary: 'Ver cómo funciona',
    note: 'Gratis para empezar. Sin tarjeta. Publicás rápido.',
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
