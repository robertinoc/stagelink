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

interface PlaceholderItem {
  icon: string;
  label: string;
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
    blog: string;
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
    ctaSubnote: string;
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
    install: string;
    note: string;
    subnote: string;
  };
  install: {
    eyebrow: string;
    title: string;
    description: string;
    androidTitle: string;
    androidSteps: string[];
    iosTitle: string;
    iosSteps: string[];
    noteTitle: string;
    note: string;
    primaryCta: string;
    secondaryCta: string;
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
  faq: {
    eyebrow: string;
    headline: string;
    items: { question: string; answer: string }[];
  };
  footer: {
    description: string;
    links: {
      product: string;
      features: string;
      howItWorks: string;
      pricing: string;
      contact: string;
      blog: string;
      docs: string;
      install: string;
    };
    community: {
      heading: string;
      instagram: string;
      linkedin: string;
      discord: string;
    };
    copyright: string;
  };
  docs: {
    eyebrow: string;
    title: string;
    description: string;
    comingSoon: string;
    backLabel: string;
    items: PlaceholderItem[];
  };
  blog: {
    eyebrow: string;
    title: string;
    description: string;
    comingSoon: string;
    backLabel: string;
    items: PlaceholderItem[];
  };
}

const en: LandingTranslation = {
  seo: {
    title: 'StageLink | Artist pages, EPKs, merch and insights',
    description:
      'StageLink gives independent artists a booking-ready home for music, EPKs, merch, links, fan capture, and audience insights.',
    ogTitle: 'StageLink | Your booking-ready artist hub',
    ogDescription:
      'Bring your artist page, Press Kit, merch, music links, fan capture, and insights together in one place that feels like you.',
  },
  nav: {
    product: 'Product',
    features: 'Features',
    howItWorks: 'How it works',
    forArtists: 'For artists',
    contact: 'Contact',
    blog: 'Blog',
    login: 'Log in',
    cta: 'Create your StageLink',
    languageLabel: 'Language',
  },
  badge: 'Made by an artist, for artists',
  hero: {
    headline: 'Your artist page, Press Kit, merch and insights in one link.',
    subheadline:
      'For DJs, producers, singers, musicians and performers who need more than a link-in-bio. StageLink brings your public artist page, booking-ready EPK, smart links, merch, fan capture, and analytics into one workspace.',
    supportingText:
      'Start with a free artist page. Upgrade when you need deeper EPK controls, localization, connected platform insights, or merch integrations.',
    socialProof:
      'Built for independent artists who need one public home for fans, bookers, press, and collaborators.',
    ctaPrimary: 'Create my artist profile',
    ctaSecondary: 'See how it looks',
    ctaNote: 'Free. No credit card required.',
    ctaSubnote: 'Set it up in minutes.',
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
    label: 'A product workspace, not just a link list',
    socialProof:
      'Your page, EPK, links, merch, fan capture, and analytics can live together without making your audience jump between disconnected tools.',
    items: ['Artist page', 'Press Kit', 'Smart Links', 'Fan capture', 'Merch', 'Insights'],
    platformsLabel: 'Works with the platforms your audience already uses',
    platformsDescription:
      'StageLink connects the surfaces your audience already knows, then gives them one artist presence that is easier to share, measure, and maintain.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'Printful', 'Instagram'],
  },
  problem: {
    eyebrow: 'Why this matters',
    headline: 'People can hear one track and still miss the next step',
    intro:
      'Your music is on one platform. Your EPK, merch, visuals, links, audience capture, and analytics live somewhere else. When everything is scattered, discovery gets harder and opportunities are easier to miss.',
    painLabel: 'What that feels like',
    painPoints: [
      'People find one part of what you do, but miss the rest of your music and identity',
      'Bookers and press need a clean EPK, but your materials are split across files and profiles',
      'You cannot easily see which links, platforms, and content are actually moving people forward',
    ],
    solutionLabel: 'What StageLink gives you',
    solutionPoints: [
      'One public artist page for your sound, style, links, visuals, merch, and fan capture',
      'A Press Kit you can share when a booking, collaboration, label, or press moment shows up',
      'Analytics and connected platform insights that help you understand what people actually use',
    ],
  },
  features: {
    eyebrow: 'What it helps you do',
    headline: 'Run your public artist presence from one workspace',
    intro:
      'Make it easier to publish, share, measure, and upgrade the parts of your artist presence that usually live in separate tools.',
    items: [
      {
        title: 'Publish a real artist page',
        description:
          'Give listeners one place to open your music, videos, socials, smart links, and next call to action.',
      },
      {
        title: 'Build a booking-ready EPK',
        description:
          'Turn your profile into a Press Kit with bio, contacts, highlights, media, gallery, rider, and templates.',
      },
      {
        title: 'Understand what people click',
        description:
          'Track page views, link clicks, smart link activity, and richer trends as your plan grows.',
      },
      {
        title: 'Connect platform signals',
        description:
          'Bring public Spotify, YouTube, and SoundCloud signals into StageLink Insights as your audience grows.',
      },
      {
        title: 'Show merch without a custom shop',
        description:
          'Surface Shopify or Printful products from your page and send fans to the right purchase path.',
      },
      {
        title: 'Localize for more audiences',
        description:
          'Keep English and Spanish public pages consistent with locale-aware copy, fallbacks, and SEO.',
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
        text: 'Bring in your name, visuals, music links, social profiles, contact details, and the story you want people to see.',
      },
      {
        step: '02',
        title: 'Shape your public presence',
        text: 'Set up your page blocks, Press Kit, smart links, merch, localized copy, and the actions that matter most right now.',
      },
      {
        step: '03',
        title: 'Share, measure, and refine',
        text: 'Use the same home across socials, releases, outreach, and bookings while analytics show what people actually use.',
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
    headline: 'Built for the work around the music',
    body: 'StageLink was made for music artists who need more than a list of links. It combines the public page, Press Kit, merch surfaces, fan capture, and insights that usually get spread across too many tools.',
    pillars: [
      {
        title: 'Not a generic profile',
        description:
          'The public page is built around music, visuals, releases, links, merch, and the next action you want people to take.',
      },
      {
        title: 'Ready when opportunity appears',
        description:
          'Your EPK, contacts, media, and booking information stay close to the same profile you already maintain.',
      },
      {
        title: 'Measurable as it grows',
        description:
          'Analytics, smart link performance, and connected platform signals help you decide what to update next.',
      },
    ],
    points: [
      'Free is enough to publish a useful artist page and start collecting signal.',
      'Pro adds stronger EPK controls for artists sending material to bookers, labels, and press.',
      'Pro+ adds the heavier growth layer: platform insights, localization, Smart Merch, and advanced analytics.',
    ],
    founderSupport: 'This is how I organize my music, my sets, and everything I do as a DJ',
    founderQuote:
      '“I created StageLink because I was using different tools for everything, and I needed one place to bring it all together in a way that actually felt like me as an artist.”',
    founderCredit: '— Robertino, DJ, Producer & creator of StageLink',
  },
  cta: {
    eyebrow: 'When you are ready',
    headline: 'Give fans, bookers, and press one place to go',
    body: 'Create one artist profile for your music, links, EPK, merch, fan capture, and insights so the right people know what to do next.',
    primary: 'Create my StageLink',
    secondary: 'See how it works',
    install: 'Install StageLink',
    note: 'Free. No credit card required.',
    subnote: 'Set it up in minutes.',
  },
  install: {
    eyebrow: 'Install StageLink',
    title: 'Add StageLink to your home screen',
    description:
      'StageLink works in your browser and can be saved like an app on supported phones and tablets. No app store download is required.',
    androidTitle: 'Android / Chrome',
    androidSteps: [
      'Open StageLink in Chrome.',
      'Tap Install app if Chrome shows it, or open the browser menu.',
      'Choose Add to Home Screen and confirm.',
    ],
    iosTitle: 'iPhone / Safari',
    iosSteps: [
      'Open StageLink in Safari.',
      'Tap the Share button.',
      'Choose Add to Home Screen, then tap Add.',
    ],
    noteTitle: 'Good to know',
    note: 'This is the web version of StageLink. It does not add offline mode, push notifications, or a native mobile app in this phase.',
    primaryCta: 'Open StageLink',
    secondaryCta: 'Create your StageLink',
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
  faq: {
    eyebrow: 'FAQ',
    headline: 'Questions we hear most',
    items: [
      {
        question: 'What is StageLink?',
        answer:
          'StageLink is an artist presence platform. It gives you one page where your music, sets, links, Press Kit, merch, and social profiles all live together — so fans, bookers, and collaborators can understand who you are and what you do in seconds.',
      },
      {
        question: 'Who is StageLink for?',
        answer:
          'StageLink is for independent music artists who want a stronger online presence: DJs, musicians, producers, bands, creators, and visual artists. If you are releasing music, playing live, or building an audience, StageLink gives you a home that feels like your identity.',
      },
      {
        question: 'Is StageLink free?',
        answer:
          'Yes. You can create your artist profile and start building your page for free — no credit card required. Pro plans unlock additional features like the EPK builder and advanced analytics for artists who want to go further.',
      },
      {
        question: 'What does the Pro plan include?',
        answer:
          'Pro gives you access to the full Electronic Press Kit (EPK) builder, which helps you create a professional document to share with promoters, labels, and press. It also removes StageLink branding from your page so your identity stays front and center.',
      },
      {
        question: 'What is Pro+ and what does it add?',
        answer:
          'Pro+ includes everything in Pro, plus StageLink Insights — a dedicated analytics layer that shows you how people are finding and interacting with your page. You get a clearer picture of your audience so you can make better decisions about where to focus your energy.',
      },
      {
        question: 'What does the analytics feature show me?',
        answer:
          'StageLink Insights (available on Pro+) shows you page views, link clicks, and audience behavior over time. You can see which parts of your page people engage with most, where your traffic comes from, and how your presence is growing — all from one dashboard.',
      },
      {
        question: 'How is StageLink different from a regular link-in-bio tool?',
        answer:
          'Link-in-bio tools are designed to hold a list of links. StageLink is built around your artist identity. Your music, sets, visuals, Press Kit, merch, and story all live together in a way that feels intentional — not like a landing page, but like a real artist presence.',
      },
    ],
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
      blog: 'Blog',
      docs: 'Docs',
      install: 'Install for mobile',
    },
    community: {
      heading: 'Community',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      discord: 'Discord',
    },
    copyright: '© {year} StageLink. All rights reserved.',
  },
  docs: {
    eyebrow: 'Documentation',
    title: 'Everything you need to build your presence',
    description:
      'Step-by-step guides, feature references, and setup docs for artists using StageLink. Coming soon.',
    comingSoon: 'Coming soon',
    backLabel: 'Back to StageLink',
    items: [
      {
        icon: '🚀',
        label: 'Quick start',
        description: 'Set up your artist profile and go live in minutes.',
      },
      {
        icon: '🎨',
        label: 'Artist page',
        description: 'Customize your page, blocks, and media sections.',
      },
      {
        icon: '📋',
        label: 'Press Kit (EPK)',
        description: 'Build and share a professional press kit.',
      },
      {
        icon: '🔗',
        label: 'Links & blocks',
        description: 'Manage link blocks, ordering, and visibility.',
      },
      {
        icon: '📊',
        label: 'Analytics',
        description: 'Track views, clicks, and audience growth.',
      },
      {
        icon: '⚙️',
        label: 'Account & billing',
        description: 'Plans, billing, and account settings.',
      },
    ],
  },
  blog: {
    eyebrow: 'Blog',
    title: 'Stories, tips, and ideas for artists',
    description:
      'Guides, case studies, and ideas for independent artists building their presence. Coming soon.',
    comingSoon: 'Coming soon',
    backLabel: 'Back to StageLink',
    items: [
      {
        icon: '🎵',
        label: 'Artist presence',
        description: 'How to build a profile that actually represents who you are.',
      },
      {
        icon: '📣',
        label: 'Promotion tips',
        description: 'Getting your music in front of the right people.',
      },
      {
        icon: '📁',
        label: 'Press Kit guide',
        description: 'Everything a booker or journalist needs in one place.',
      },
      {
        icon: '🤝',
        label: 'Bookings & gigs',
        description: 'Turning your page into a booking-ready asset.',
      },
      {
        icon: '📈',
        label: 'Grow your audience',
        description: 'Small moves that compound over time.',
      },
      {
        icon: '🎤',
        label: 'Artist stories',
        description: 'Real artists, real pages, real results.',
      },
    ],
  },
};

const es: LandingTranslation = {
  seo: {
    title: 'StageLink | Página de artista, EPK, merch e insights',
    description:
      'StageLink les da a artistas independientes un hogar listo para bookings con música, EPK, merch, links, fan capture e insights.',
    ogTitle: 'StageLink | Tu hub artístico listo para bookings',
    ogDescription:
      'Uní tu página de artista, Press Kit, merch, links de música, fan capture e insights en un lugar que se sienta tuyo.',
  },
  nav: {
    product: 'Producto',
    features: 'Funciones',
    howItWorks: 'Cómo funciona',
    forArtists: 'Para artistas',
    contact: 'Contacto',
    blog: 'Blog',
    login: 'Iniciar sesión',
    cta: 'Crear tu StageLink',
    languageLabel: 'Idioma',
  },
  badge: 'Hecho por un artista, para artistas',
  hero: {
    headline: 'Tu página de artista, Press Kit, merch e insights en un solo link.',
    subheadline:
      'Para DJs, productores, cantantes, músicos y performers que necesitan más que un link-in-bio. StageLink reúne tu página pública, EPK listo para bookings, smart links, merch, fan capture y analytics en un workspace.',
    supportingText:
      'Empezá con una página de artista gratis. Subí de plan cuando necesites más control de EPK, localización, platform insights conectados o integraciones de merch.',
    socialProof:
      'Hecho para artistas independientes que necesitan un hogar público para fans, bookers, prensa y colaboradores.',
    ctaPrimary: 'Crear mi perfil artístico',
    ctaSecondary: 'Ver cómo se ve',
    ctaNote: 'Gratis. Sin tarjeta.',
    ctaSubnote: 'Lo podés armar en minutos.',
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
    label: 'Un workspace de producto, no solo una lista de links',
    socialProof:
      'Tu página, EPK, links, merch, fan capture y analytics pueden convivir sin hacer saltar a tu audiencia entre herramientas desconectadas.',
    items: ['Página de artista', 'Press Kit', 'Smart Links', 'Fan capture', 'Merch', 'Insights'],
    platformsLabel: 'Trabaja con las plataformas que tu audiencia ya usa',
    platformsDescription:
      'StageLink conecta las superficies que tu audiencia ya conoce y las reúne en una presencia artística más fácil de compartir, medir y mantener.',
    platforms: ['Spotify', 'SoundCloud', 'YouTube', 'Shopify', 'Printful', 'Instagram'],
  },
  problem: {
    eyebrow: 'Por qué importa',
    headline: 'Pueden escuchar un track tuyo y aun así perderse el próximo paso',
    intro:
      'Tu música está en una plataforma. Tu EPK, merch, visuales, links, fan capture y analytics viven en otras. Cuando todo queda disperso, descubrirte se vuelve más difícil y las oportunidades pasan más fácil de largo.',
    painLabel: 'Lo que eso genera',
    painPoints: [
      'La gente encuentra una parte de tu música, pero se pierde todo lo demás',
      'Bookers y prensa necesitan un EPK claro, pero tus materiales quedan repartidos entre archivos y perfiles',
      'No siempre podés ver qué links, plataformas y contenido están moviendo a la gente hacia adelante',
    ],
    solutionLabel: 'Lo que te da StageLink',
    solutionPoints: [
      'Una página pública de artista para tu sonido, estilo, links, visuales, merch y fan capture',
      'Un Press Kit para compartir cuando aparece un booking, una colaboración, un sello o prensa',
      'Analytics y platform insights conectados para entender qué usa realmente la gente',
    ],
  },
  features: {
    eyebrow: 'Cómo te ayuda',
    headline: 'Gestioná tu presencia artística pública desde un workspace',
    intro:
      'Hacé más fácil publicar, compartir, medir y mejorar las partes de tu presencia artística que suelen vivir en herramientas separadas.',
    items: [
      {
        title: 'Publicar una página real de artista',
        description:
          'Dale a la gente un lugar para abrir tu música, videos, redes, smart links y el próximo llamado a la acción.',
      },
      {
        title: 'Armar un EPK listo para bookings',
        description:
          'Convertí tu perfil en un Press Kit con bio, contactos, highlights, media, galería, rider y templates.',
      },
      {
        title: 'Entender qué clickea la gente',
        description:
          'Medí visitas, clicks, actividad de smart links y tendencias más ricas a medida que crece tu plan.',
      },
      {
        title: 'Conectar señales de plataformas',
        description:
          'Traé señales públicas de Spotify, YouTube y SoundCloud a StageLink Insights cuando tu audiencia crece.',
      },
      {
        title: 'Mostrar merch sin tienda propia',
        description:
          'Mostrá productos de Shopify o Printful desde tu página y mandá fans al camino correcto de compra.',
      },
      {
        title: 'Localizar para más audiencias',
        description:
          'Mantené páginas públicas en inglés y español con copy por idioma, fallbacks y SEO consistentes.',
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
        text: 'Sumá tu nombre, visuales, links de música, redes, datos de contacto y la historia que querés mostrar.',
      },
      {
        step: '02',
        title: 'Armá tu presencia pública',
        text: 'Configurá bloques de página, Press Kit, smart links, merch, copy localizado y las acciones que hoy más importan.',
      },
      {
        step: '03',
        title: 'Compartí, medí y ajustá',
        text: 'Usá el mismo hogar para redes, lanzamientos, outreach y bookings mientras analytics muestra qué usa realmente la gente.',
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
    headline: 'Hecho para el trabajo alrededor de la música',
    body: 'StageLink nació para artistas de música que necesitan más que una lista de links. Reúne página pública, Press Kit, merch, fan capture e insights que suelen quedar repartidos entre demasiadas herramientas.',
    pillars: [
      {
        title: 'No es un perfil genérico',
        description:
          'La página pública está pensada alrededor de música, visuales, lanzamientos, links, merch y la próxima acción que querés que tomen.',
      },
      {
        title: 'Listo cuando aparece una oportunidad',
        description:
          'Tu EPK, contactos, media y datos de booking viven cerca del mismo perfil que ya mantenés.',
      },
      {
        title: 'Medible cuando crece',
        description:
          'Analytics, rendimiento de smart links y señales de plataformas conectadas te ayudan a decidir qué actualizar después.',
      },
    ],
    points: [
      'Free alcanza para publicar una página útil de artista y empezar a captar señal.',
      'Pro suma controles de EPK para artistas que mandan material a bookers, sellos y prensa.',
      'Pro+ agrega la capa más pesada de crecimiento: platform insights, localización, Smart Merch y analytics avanzados.',
    ],
    founderSupport: 'Así organizo mi música, mis sets y todo lo que hago como DJ',
    founderQuote:
      '“Creé StageLink porque usaba muchas herramientas para distintas cosas, y necesitaba un solo lugar que reúna todo de una forma que de verdad se sintiera como yo como artista.”',
    founderCredit: '— Robertino, DJ, Producer & creador de StageLink',
  },
  cta: {
    eyebrow: 'Cuando quieras',
    headline: 'Dale a fans, bookers y prensa un solo lugar adonde ir',
    body: 'Creá un perfil artístico para tu música, links, EPK, merch, fan capture e insights para que la gente indicada sepa qué hacer después.',
    primary: 'Crear mi StageLink',
    secondary: 'Ver cómo funciona',
    install: 'Instalar StageLink',
    note: 'Gratis. Sin tarjeta.',
    subnote: 'Lo podés armar en minutos.',
  },
  install: {
    eyebrow: 'Instalar StageLink',
    title: 'Agregá StageLink a tu pantalla de inicio',
    description:
      'StageLink funciona en el navegador y se puede guardar como una app en teléfonos y tablets compatibles. No hace falta descargar nada desde una tienda.',
    androidTitle: 'Android / Chrome',
    androidSteps: [
      'Abrí StageLink en Chrome.',
      'Tocá Instalar app si Chrome lo muestra, o abrí el menú del navegador.',
      'Elegí Agregar a la pantalla principal y confirmá.',
    ],
    iosTitle: 'iPhone / Safari',
    iosSteps: [
      'Abrí StageLink en Safari.',
      'Tocá el botón Compartir.',
      'Elegí Agregar a pantalla de inicio y después Agregar.',
    ],
    noteTitle: 'Para tener en cuenta',
    note: 'Esta es la versión web de StageLink. En esta etapa no agrega modo offline, notificaciones push ni una app mobile nativa.',
    primaryCta: 'Abrir StageLink',
    secondaryCta: 'Crear tu StageLink',
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
  faq: {
    eyebrow: 'FAQ',
    headline: 'Las preguntas que más nos hacen',
    items: [
      {
        question: '¿Qué es StageLink?',
        answer:
          'StageLink es una plataforma de presencia artística. Te da una sola página donde conviven tu música, tus sets, tus links, tu Press Kit, tu merch y tus perfiles sociales, para que fans, bookers y colaboradores entiendan quién sos y qué hacés en segundos.',
      },
      {
        question: '¿Para quién es StageLink?',
        answer:
          'StageLink es para artistas de música independientes que quieren una presencia digital más fuerte: DJs, músicos, productores, bandas, creadores y artistas visuales. Si estás lanzando música, tocando en vivo o construyendo una audiencia, StageLink te da un hogar que se siente como tu identidad.',
      },
      {
        question: '¿StageLink es gratis?',
        answer:
          'Sí. Podés crear tu perfil artístico y empezar a armar tu página gratis, sin tarjeta. Los planes Pro desbloquean funciones adicionales como el EPK y analíticas avanzadas para artistas que quieren ir más lejos.',
      },
      {
        question: '¿Qué incluye el plan Pro?',
        answer:
          'Pro te da acceso al constructor de Electronic Press Kit (EPK), que te ayuda a crear un documento profesional para compartir con promotores, sellos y prensa. También elimina el branding de StageLink de tu página para que tu identidad quede en primer plano.',
      },
      {
        question: '¿Qué es Pro+ y qué agrega?',
        answer:
          'Pro+ incluye todo lo de Pro, más StageLink Insights: una capa de analíticas dedicada que te muestra cómo la gente encuentra e interactúa con tu página. Obtenés una imagen más clara de tu audiencia para tomar mejores decisiones sobre dónde poner tu energía.',
      },
      {
        question: '¿Qué me muestra la función de analíticas?',
        answer:
          'StageLink Insights (disponible en Pro+) te muestra vistas de página, clics en links y comportamiento de la audiencia a lo largo del tiempo. Podés ver qué partes de tu página generan más interacción, de dónde viene tu tráfico y cómo crece tu presencia, todo desde un solo panel.',
      },
      {
        question: '¿En qué se diferencia StageLink de una herramienta de link-in-bio?',
        answer:
          'Las herramientas de link-in-bio están pensadas para tener una lista de links. StageLink está construido alrededor de tu identidad artística. Tu música, tus sets, tus visuales, tu Press Kit, tu merch y tu historia conviven de una forma que se siente intencional, no como una landing page, sino como una presencia artística real.',
      },
    ],
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
      blog: 'Blog',
      docs: 'Docs',
      install: 'Instalar en mobile',
    },
    community: {
      heading: 'Comunidad',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      discord: 'Discord',
    },
    copyright: '© {year} StageLink. Todos los derechos reservados.',
  },
  docs: {
    eyebrow: 'Documentación',
    title: 'Todo lo que necesitás para construir tu presencia',
    description:
      'Guías paso a paso, referencias de funciones y docs de configuración para artistas que usan StageLink. Próximamente.',
    comingSoon: 'Próximamente',
    backLabel: 'Volver a StageLink',
    items: [
      {
        icon: '🚀',
        label: 'Primeros pasos',
        description: 'Configurá tu perfil de artista y publicalo en minutos.',
      },
      {
        icon: '🎨',
        label: 'Página de artista',
        description: 'Personalizá tu página, bloques y secciones de media.',
      },
      {
        icon: '📋',
        label: 'Press Kit (EPK)',
        description: 'Armá y compartí un press kit profesional.',
      },
      {
        icon: '🔗',
        label: 'Links y bloques',
        description: 'Gestioná bloques, orden y visibilidad.',
      },
      {
        icon: '📊',
        label: 'Analytics',
        description: 'Medí visitas, clics y crecimiento de audiencia.',
      },
      {
        icon: '⚙️',
        label: 'Cuenta y facturación',
        description: 'Planes, billing y configuración de cuenta.',
      },
    ],
  },
  blog: {
    eyebrow: 'Blog',
    title: 'Historias, tips e ideas para artistas',
    description:
      'Guías, casos de uso e ideas para artistas independientes que están construyendo su presencia. Próximamente.',
    comingSoon: 'Próximamente',
    backLabel: 'Volver a StageLink',
    items: [
      {
        icon: '🎵',
        label: 'Presencia artística',
        description: 'Cómo crear un perfil que realmente represente quién sos.',
      },
      {
        icon: '📣',
        label: 'Tips de promoción',
        description: 'Llevá tu música a las personas correctas.',
      },
      {
        icon: '📁',
        label: 'Guía de Press Kit',
        description: 'Todo lo que bookers o periodistas necesitan en un solo lugar.',
      },
      {
        icon: '🤝',
        label: 'Bookings y shows',
        description: 'Convertí tu página en un activo listo para bookings.',
      },
      {
        icon: '📈',
        label: 'Crecer audiencia',
        description: 'Movimientos chicos que se acumulan con el tiempo.',
      },
      {
        icon: '🎤',
        label: 'Historias de artistas',
        description: 'Artistas reales, páginas reales, resultados reales.',
      },
    ],
  },
};

export const landingTranslations = { en, es };

export function getLandingT(locale: string): LandingTranslation {
  return landingTranslations[locale as SupportedLocale] ?? landingTranslations.en;
}
