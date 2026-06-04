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

interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalDoc {
  title: string;
  sections: LegalSection[];
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
    legal: {
      heading: string;
      privacy: string;
      terms: string;
      cookies: string;
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
  legal: {
    eyebrow: string;
    lastUpdatedLabel: string;
    reviewNotice: string;
    backLabel: string;
    privacy: LegalDoc;
    terms: LegalDoc;
    cookies: LegalDoc;
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
    legal: {
      heading: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookies: 'Cookie Policy',
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
  legal: {
    eyebrow: 'Legal',
    lastUpdatedLabel: 'Last updated: pending publication',
    reviewNotice:
      'This is a working draft published for structure and review. It is not yet the final, lawyer-reviewed agreement and should not be relied upon. The definitive version will replace this text before StageLink opens to the public.',
    backLabel: 'Back to StageLink',
    privacy: {
      title: 'Privacy Policy',
      sections: [
        {
          heading: '1. Introduction',
          body: [
            'StageLink is a platform for artists, DJs, musicians, and creators to publish profiles, Press Kits (EPKs), links, media, merch, and audience analytics. This policy explains what personal data we process and why.',
            'It applies to account holders, artists and team members, public visitors, fans who submit forms, and business contacts. [TODO legal review: insert the final legal entity, registered address, and privacy contact.]',
          ],
        },
        {
          heading: "2. StageLink's role",
          body: [
            'StageLink is the data controller for platform accounts, billing, security, analytics, support, and platform operations.',
            'For an artist’s own fan or subscriber lists, the artist may be the controller and StageLink may process that data on the artist’s behalf. StageLink remains controller for security, fraud prevention, and service operation.',
          ],
        },
        {
          heading: '3. Data we collect',
          body: [
            'Data you provide: account information, artist profile, EPK, public content, contact emails, and uploaded assets.',
            'Data from fans and public visitors: email capture, contact forms, page and link events, device and country, and a hashed IP address.',
            'Data from integrations you connect (Spotify, YouTube, SoundCloud, Shopify, merch providers), from payments (Stripe customer/subscription IDs and billing state), and automatically (cookies, analytics, logs, security events).',
          ],
        },
        {
          heading: '4. How we use your data',
          body: [
            'To provide, secure, and maintain accounts; publish artist pages and EPKs; process subscriptions and payments; provide analytics dashboards; operate integrations; send service messages and communications you request; prevent abuse, fraud, and security incidents; provide support and improve StageLink; and comply with legal obligations.',
          ],
        },
        {
          heading: '5. Legal bases (GDPR)',
          body: [
            'Where GDPR applies, we rely on: contract (accounts, profiles, EPKs, billing, integrations); legitimate interests (security, abuse prevention, limited operational analytics, reliability); consent (non-essential cookies/analytics, marketing, email capture where applicable, OAuth authorization); and legal obligation (accounting, tax, compliance, incident response).',
          ],
        },
        {
          heading: '6. Public content',
          body: [
            'Artist pages, EPKs, links, images, biographies, media, and selected contact information may be public when you publish them. You are responsible for having the rights and permissions for content you upload or publish.',
            'Removing content from StageLink may not immediately remove third-party copies, search-engine caches, or previously shared links.',
          ],
        },
        {
          heading: '7. Fan and subscriber data',
          body: [
            'Fans may submit email addresses to artists through StageLink blocks. Artists may use those lists subject to their own legal responsibilities, and should provide an unsubscribe or deletion path. StageLink stores consent text and metadata to support consent records.',
            '[TODO implementation: define whether subscriber data requests go to StageLink, the artist, or both.]',
          ],
        },
        {
          heading: '8. Cookies and analytics',
          body: [
            'We use strictly necessary cookies for authentication, session, localization, and security, and analytics cookies/events subject to consent. See the Cookie Policy for details and how to change your choices.',
            '[TODO legal review: for EU users, non-essential analytics should be opt-in at launch rather than default-on.]',
          ],
        },
        {
          heading: '9. Sharing and providers',
          body: [
            'We share data with provider categories needed to run the service: authentication, payment processing, hosting/database/storage, analytics, email, user-selected integrations, and legal/compliance/safety providers where needed. StageLink does not sell personal information as a product feature.',
            '[TODO legal review: validate CCPA/CPRA sale/share status for analytics.]',
          ],
        },
        {
          heading: '10. International transfers',
          body: [
            'Your data may be processed in countries outside your own. Where required, we use contractual and technical safeguards such as Data Processing Agreements or Standard Contractual Clauses, or comparable mechanisms.',
          ],
        },
        {
          heading: '11. Retention',
          body: [
            'We keep personal data only as long as needed for the purposes above or as required by law, by category: account/profile, public content/assets, subscriber lists, analytics events, billing records, security/audit logs, and integration tokens.',
            '[TODO legal review: insert the final retention periods per category.]',
          ],
        },
        {
          heading: '12. Your rights',
          body: [
            'Subject to applicable law you may request access/export, correction, deletion, restriction or objection, and portability; withdraw consent; and opt out of marketing. CCPA/CPRA rights apply to California residents and Argentine data-protection rights (access, rectification, update, deletion) apply where relevant.',
            '[TODO implementation: define the data-request intake email, identity verification, response SLA, and logging.]',
          ],
        },
        {
          heading: '13. Security',
          body: [
            'We use HTTPS, WorkOS-managed authentication and sessions, role and ownership checks, audit logging, rate limiting and anti-abuse controls, upload controls, and managed provider secrets. No online service can be guaranteed fully secure.',
          ],
        },
        {
          heading: '14. Children',
          body: [
            'StageLink accounts are for users 18 or older, and the service is not directed to children under 13. Contact us if you believe a child’s data was submitted.',
          ],
        },
        {
          heading: '15. Changes to this policy',
          body: [
            'We may update this policy. Material changes will be communicated through appropriate channels, with an effective date and version history.',
          ],
        },
        {
          heading: '16. Contact',
          body: [
            '[TODO legal review: insert the privacy contact email, legal entity and address, any data-protection contact, and the data-request path.]',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      sections: [
        {
          heading: '1. Introduction and acceptance',
          body: [
            'StageLink provides artist pages, EPKs, links, analytics, integrations, and subscription features. By using StageLink you accept these terms and our privacy documents, and you confirm you are legally able to enter into this agreement.',
          ],
        },
        {
          heading: '2. Eligibility and accounts',
          body: [
            'Account creators must be at least 18 and must provide accurate information. You are responsible for your account access and team permissions. Authentication is handled through WorkOS / AuthKit.',
          ],
        },
        {
          heading: '3. Artist pages, EPKs, and public content',
          body: [
            'You choose what to publish. Public pages, EPKs, images, links, and contact details may be visible to anyone, and you must have the rights to the content you upload or link. Keep booking and contact information accurate.',
            'We may remove or disable content that violates these terms, the law, our security rules, or third-party rights.',
          ],
        },
        {
          heading: '4. User responsibilities',
          body: [
            'You must not use StageLink for illegal activity; harassment, hate, exploitation, or abusive content; impersonation; uploading malware; violating copyright, trademark, privacy, or publicity rights; scraping, reverse engineering, or attacking the platform; circumventing rate limits, auth, or access controls; or sending spam or collecting emails without proper consent.',
          ],
        },
        {
          heading: '5. Fan, subscriber, and contact data',
          body: [
            'Artists are responsible for the lawful use of fan and subscriber data collected through StageLink, must honor unsubscribe and deletion requests where applicable, and must not collect data without permission. StageLink may provide tools to store consent evidence but does not make your marketing compliant by default.',
          ],
        },
        {
          heading: '6. Integrations',
          body: [
            'Integrations such as Spotify, YouTube, SoundCloud, Shopify, Printful/Printify, and Stripe are optional. By connecting one you authorize StageLink to access integration data only for the features you choose; third-party terms apply. We may stop supporting an integration or require reauthorization, and you can disconnect at any time.',
          ],
        },
        {
          heading: '7. Subscriptions, billing, and plans',
          body: [
            'StageLink offers Free, Pro, and Pro+ plans. Payments are processed by Stripe. Billing cycles, cancellations, upgrades/downgrades, taxes, and payment failures apply as described in the product. Access to paid-only features is not guaranteed after cancellation or non-payment.',
            '[TODO legal review: refund policy and consumer-law cancellation language.]',
          ],
        },
        {
          heading: '8. Acceptable use and anti-abuse',
          body: [
            'We may rate-limit, suspend, or restrict accounts for abuse. Security controls may block suspicious behavior, and we may investigate suspicious uploads, contact forms, or login attacks.',
          ],
        },
        {
          heading: '9. Intellectual property',
          body: [
            'You keep ownership of your content and grant StageLink a license to host, display, process, resize, translate, cache, and transmit it to operate the service. StageLink owns its software, brand, UI, and platform materials, and may use feedback to improve the platform.',
          ],
        },
        {
          heading: '10. Service availability and changes',
          body: [
            'StageLink may evolve, suspend, or discontinue features, and integrations or third-party services may fail or change. Analytics may be estimates and may exclude bot, QA, or internal traffic. We do not guarantee uninterrupted service.',
          ],
        },
        {
          heading: '11. Termination and suspension',
          body: [
            'You may cancel or delete your account at any time. We may suspend or terminate access for breach, risk, legal request, payment failure, or abuse. Termination may affect public pages, EPKs, assets, subscriptions, and retained records.',
          ],
        },
        {
          heading: '12. Disclaimers and liability',
          body: [
            'To the extent allowed by law the service is provided “as is,” with no guarantee of bookings, audience growth, revenue, or platform results. Your mandatory legal rights remain unaffected.',
            '[TODO legal review: final limitation-of-liability and warranty language.]',
          ],
        },
        {
          heading: '13. Indemnity',
          body: [
            'You may be required to indemnify StageLink for your content, rights violations, unlawful marketing or contact practices, misuse of integrations, and breach of these terms.',
            '[TODO legal review: adapt indemnity to the governing law and consumer limitations.]',
          ],
        },
        {
          heading: '14. Governing law and disputes',
          body: [
            '[TODO legal review: final governing law, venue, any arbitration/class-action waiver, and consumer-rights exceptions.]',
          ],
        },
        {
          heading: '15. Contact and notices',
          body: [
            'For legal and support matters, and for notice of material changes, use the contact channels published here. [TODO legal review: insert the legal and support contacts.]',
          ],
        },
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      sections: [
        {
          heading: '1. What cookies are',
          body: [
            'Cookies and similar technologies are small files or storage items a site uses to keep you signed in, remember preferences, and understand usage. This policy explains which ones StageLink uses and how to control them.',
          ],
        },
        {
          heading: '2. Strictly necessary',
          body: [
            'Used for authentication and session management, PKCE/state/CSRF protection, locale and basic UI preferences, and security, rate limiting, and abuse prevention. These are required for the service and cannot be turned off in-product, though you can control them in your browser.',
          ],
        },
        {
          heading: '3. Analytics',
          body: [
            'Used to understand page visits, link clicks, public-page performance, and product usage, and to give artists dashboard metrics. Your choice is stored in the `sl_ac` cookie (1 = accepted, 0 = rejected); product analytics such as PostHog are gated by consent.',
            '[TODO legal review: for EU users, non-essential analytics should require opt-in consent.]',
          ],
        },
        {
          heading: '4. Marketing',
          body: [
            'Used for campaign attribution, retargeting, advertising, or marketing pixels. No marketing pixels are assumed active today; any such cookies would require opt-in consent with preference and opt-out controls.',
          ],
        },
        {
          heading: '5. Cookie inventory',
          body: [
            'WorkOS session cookie (Necessary, WorkOS/StageLink) — auth session.',
            'PKCE/state cookie (Necessary, StageLink/WorkOS) — OAuth security.',
            '`NEXT_LOCALE` (Necessary/preference, StageLink) — language.',
            '`sl_ac` (Analytics preference, StageLink) — analytics consent state, ~365 days.',
            'PostHog cookies/local storage (Analytics, PostHog) — product analytics, only after consent where required.',
            '[TODO legal review: confirm exact cookie names and lifetimes in production before publishing.]',
          ],
        },
        {
          heading: '6. Managing your choices',
          body: [
            'You can accept all, reject non-essential, or manage categories through the in-product consent control, and change your choice at any time. You can also manage cookies through your browser settings.',
          ],
        },
        {
          heading: '7. Changes and contact',
          body: [
            'We may update this Cookie Policy. Questions can be sent to the contact channel published here. [TODO legal review: insert the contact details.]',
          ],
        },
      ],
    },
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
    legal: {
      heading: 'Legal',
      privacy: 'Política de Privacidad',
      terms: 'Términos del Servicio',
      cookies: 'Política de Cookies',
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
  legal: {
    eyebrow: 'Legal',
    lastUpdatedLabel: 'Última actualización: pendiente de publicación',
    reviewNotice:
      'Este es un borrador de trabajo publicado para revisión y estructura. Todavía no es el acuerdo final revisado por un abogado y no debe tomarse como definitivo. La versión final reemplazará este texto antes de que StageLink se abra al público.',
    backLabel: 'Volver a StageLink',
    privacy: {
      title: 'Política de Privacidad',
      sections: [
        {
          heading: '1. Introducción',
          body: [
            'StageLink es una plataforma para artistas, DJs, músicos y creadores donde publican perfiles, Press Kits (EPKs), links, media, merch e insights de audiencia. Esta política explica qué datos personales tratamos y por qué.',
            'Aplica a titulares de cuenta, artistas y miembros de equipo, visitantes públicos, fans que envían formularios y contactos comerciales. [TODO revisión legal: insertar la entidad legal, el domicilio y el contacto de privacidad finales.]',
          ],
        },
        {
          heading: '2. El rol de StageLink',
          body: [
            'StageLink es responsable del tratamiento (controller) de las cuentas de la plataforma, facturación, seguridad, analytics, soporte y operación.',
            'Para las listas de fans o suscriptores de un artista, el artista puede ser el responsable y StageLink puede tratar esos datos por cuenta del artista. StageLink sigue siendo responsable de la seguridad, la prevención de fraude y la operación del servicio.',
          ],
        },
        {
          heading: '3. Datos que recopilamos',
          body: [
            'Datos que proporcionás: información de cuenta, perfil de artista, EPK, contenido público, emails de contacto y archivos subidos.',
            'Datos de fans y visitantes públicos: captura de email, formularios de contacto, eventos de página y links, dispositivo y país, y una IP hasheada.',
            'Datos de integraciones que conectás (Spotify, YouTube, SoundCloud, Shopify, proveedores de merch), de pagos (IDs de cliente/suscripción de Stripe y estado de facturación) y de recolección automática (cookies, analytics, logs, eventos de seguridad).',
          ],
        },
        {
          heading: '4. Cómo usamos tus datos',
          body: [
            'Para prestar, asegurar y mantener cuentas; publicar páginas de artista y EPKs; procesar suscripciones y pagos; ofrecer dashboards de analytics; operar integraciones; enviar mensajes de servicio y comunicaciones que pedís; prevenir abuso, fraude e incidentes de seguridad; dar soporte y mejorar StageLink; y cumplir obligaciones legales.',
          ],
        },
        {
          heading: '5. Bases legales (GDPR)',
          body: [
            'Cuando aplica el GDPR nos basamos en: contrato (cuentas, perfiles, EPKs, facturación, integraciones); interés legítimo (seguridad, prevención de abuso, analytics operativo limitado, fiabilidad); consentimiento (cookies/analytics no esenciales, marketing, captura de email cuando corresponde, autorización OAuth); y obligación legal (contabilidad, impuestos, cumplimiento, respuesta a incidentes).',
          ],
        },
        {
          heading: '6. Contenido público',
          body: [
            'Las páginas de artista, EPKs, links, imágenes, biografías, media y cierta información de contacto pueden ser públicas cuando las publicás. Sos responsable de tener los derechos y permisos del contenido que subís o publicás.',
            'Eliminar contenido de StageLink puede no eliminar de inmediato copias de terceros, cachés de buscadores o links compartidos previamente.',
          ],
        },
        {
          heading: '7. Datos de fans y suscriptores',
          body: [
            'Los fans pueden enviar su email a los artistas mediante bloques de StageLink. Los artistas pueden usar esas listas bajo su propia responsabilidad legal y deben ofrecer una vía de baja o eliminación. StageLink guarda el texto y los metadatos de consentimiento para respaldar los registros.',
            '[TODO implementación: definir si las solicitudes de datos de suscriptores se gestionan en StageLink, el artista, o ambos.]',
          ],
        },
        {
          heading: '8. Cookies y analytics',
          body: [
            'Usamos cookies estrictamente necesarias para autenticación, sesión, localización y seguridad, y cookies/eventos de analytics sujetos a consentimiento. Ver la Política de Cookies para el detalle y cómo cambiar tus elecciones.',
            '[TODO revisión legal: para usuarios de la UE, los analytics no esenciales deberían ser opt-in en el lanzamiento, no activados por defecto.]',
          ],
        },
        {
          heading: '9. Compartición y proveedores',
          body: [
            'Compartimos datos con categorías de proveedores necesarias para operar: autenticación, procesamiento de pagos, hosting/base de datos/almacenamiento, analytics, email, integraciones que elegís, y proveedores legales/de cumplimiento/seguridad cuando hace falta. StageLink no vende información personal como funcionalidad del producto.',
            '[TODO revisión legal: validar el estado de venta/compartición CCPA/CPRA para analytics.]',
          ],
        },
        {
          heading: '10. Transferencias internacionales',
          body: [
            'Tus datos pueden tratarse en países distintos al tuyo. Cuando es necesario, usamos salvaguardas contractuales y técnicas como Acuerdos de Tratamiento de Datos o Cláusulas Contractuales Estándar, o mecanismos comparables.',
          ],
        },
        {
          heading: '11. Conservación',
          body: [
            'Conservamos los datos personales solo el tiempo necesario para los fines anteriores o según lo exija la ley, por categoría: cuenta/perfil, contenido/archivos públicos, listas de suscriptores, eventos de analytics, registros de facturación, logs de seguridad/auditoría y tokens de integración.',
            '[TODO revisión legal: insertar los plazos de conservación finales por categoría.]',
          ],
        },
        {
          heading: '12. Tus derechos',
          body: [
            'Sujeto a la ley aplicable podés solicitar acceso/exportación, corrección, eliminación, restricción u oposición, y portabilidad; retirar el consentimiento; y darte de baja del marketing. Los derechos CCPA/CPRA aplican a residentes de California y los derechos de protección de datos de Argentina (acceso, rectificación, actualización, supresión) aplican cuando corresponde.',
            '[TODO implementación: definir el email de recepción de solicitudes, verificación de identidad, plazo de respuesta y registro.]',
          ],
        },
        {
          heading: '13. Seguridad',
          body: [
            'Usamos HTTPS, autenticación y sesiones gestionadas por WorkOS, controles de rol y propiedad, registro de auditoría, rate limiting y controles anti-abuso, controles de subida y gestión de secretos de proveedores. Ningún servicio online puede garantizarse completamente seguro.',
          ],
        },
        {
          heading: '14. Menores',
          body: [
            'Las cuentas de StageLink son para usuarios de 18 años o más, y el servicio no está dirigido a menores de 13. Contactanos si creés que se enviaron datos de un menor.',
          ],
        },
        {
          heading: '15. Cambios en esta política',
          body: [
            'Podemos actualizar esta política. Los cambios materiales se comunicarán por los canales adecuados, con fecha de vigencia e historial de versiones.',
          ],
        },
        {
          heading: '16. Contacto',
          body: [
            '[TODO revisión legal: insertar el email de contacto de privacidad, la entidad legal y domicilio, cualquier contacto de protección de datos y la vía para solicitudes de datos.]',
          ],
        },
      ],
    },
    terms: {
      title: 'Términos del Servicio',
      sections: [
        {
          heading: '1. Introducción y aceptación',
          body: [
            'StageLink ofrece páginas de artista, EPKs, links, analytics, integraciones y funciones de suscripción. Al usar StageLink aceptás estos términos y nuestros documentos de privacidad, y confirmás que podés celebrar legalmente este acuerdo.',
          ],
        },
        {
          heading: '2. Elegibilidad y cuentas',
          body: [
            'Quienes crean cuentas deben tener al menos 18 años y proporcionar información exacta. Sos responsable del acceso a tu cuenta y de los permisos de equipo. La autenticación se gestiona mediante WorkOS / AuthKit.',
          ],
        },
        {
          heading: '3. Páginas de artista, EPKs y contenido público',
          body: [
            'Vos elegís qué publicar. Las páginas públicas, EPKs, imágenes, links y datos de contacto pueden ser visibles para cualquiera, y debés tener los derechos del contenido que subís o enlazás. Mantené la información de booking y contacto actualizada.',
            'Podemos eliminar o deshabilitar contenido que viole estos términos, la ley, nuestras reglas de seguridad o derechos de terceros.',
          ],
        },
        {
          heading: '4. Responsabilidades del usuario',
          body: [
            'No debés usar StageLink para actividad ilegal; acoso, odio, explotación o contenido abusivo; suplantación de identidad; subir malware; violar derechos de autor, marca, privacidad o imagen; scraping, ingeniería inversa o ataques a la plataforma; eludir rate limits, autenticación o controles de acceso; ni enviar spam o recopilar emails sin el consentimiento adecuado.',
          ],
        },
        {
          heading: '5. Datos de fans, suscriptores y contacto',
          body: [
            'Los artistas son responsables del uso lícito de los datos de fans y suscriptores recopilados mediante StageLink, deben atender las solicitudes de baja y eliminación cuando corresponde, y no deben recopilar datos sin permiso. StageLink puede ofrecer herramientas para guardar evidencia de consentimiento, pero no hace que tu marketing sea conforme por defecto.',
          ],
        },
        {
          heading: '6. Integraciones',
          body: [
            'Integraciones como Spotify, YouTube, SoundCloud, Shopify, Printful/Printify y Stripe son opcionales. Al conectar una, autorizás a StageLink a acceder a sus datos solo para las funciones que elegís; aplican los términos de terceros. Podemos dejar de soportar una integración o requerir reautorización, y podés desconectarla cuando quieras.',
          ],
        },
        {
          heading: '7. Suscripciones, facturación y planes',
          body: [
            'StageLink ofrece planes Free, Pro y Pro+. Los pagos los procesa Stripe. Los ciclos de facturación, cancelaciones, upgrades/downgrades, impuestos y fallos de pago aplican según se describe en el producto. No se garantiza el acceso a funciones de pago tras la cancelación o falta de pago.',
            '[TODO revisión legal: política de reembolsos y redacción de cancelación conforme a la ley de consumo.]',
          ],
        },
        {
          heading: '8. Uso aceptable y anti-abuso',
          body: [
            'Podemos limitar la tasa, suspender o restringir cuentas por abuso. Los controles de seguridad pueden bloquear comportamiento sospechoso, y podemos investigar subidas, formularios de contacto o ataques de login sospechosos.',
          ],
        },
        {
          heading: '9. Propiedad intelectual',
          body: [
            'Conservás la propiedad de tu contenido y otorgás a StageLink una licencia para alojarlo, mostrarlo, procesarlo, redimensionarlo, traducirlo, cachearlo y transmitirlo para operar el servicio. StageLink es dueño de su software, marca, UI y materiales de la plataforma, y puede usar feedback para mejorarla.',
          ],
        },
        {
          heading: '10. Disponibilidad y cambios del servicio',
          body: [
            'StageLink puede evolucionar, suspender o discontinuar funciones, y las integraciones o servicios de terceros pueden fallar o cambiar. Los analytics pueden ser estimaciones y excluir tráfico de bots, QA o interno. No garantizamos un servicio ininterrumpido.',
          ],
        },
        {
          heading: '11. Terminación y suspensión',
          body: [
            'Podés cancelar o eliminar tu cuenta en cualquier momento. Podemos suspender o terminar el acceso por incumplimiento, riesgo, requerimiento legal, falta de pago o abuso. La terminación puede afectar páginas públicas, EPKs, archivos, suscripciones y registros conservados.',
          ],
        },
        {
          heading: '12. Descargos y responsabilidad',
          body: [
            'En la medida permitida por la ley, el servicio se presta “tal cual”, sin garantía de bookings, crecimiento de audiencia, ingresos ni resultados. Tus derechos legales imperativos no se ven afectados.',
            '[TODO revisión legal: redacción final de limitación de responsabilidad y garantías.]',
          ],
        },
        {
          heading: '13. Indemnidad',
          body: [
            'Podés tener que indemnizar a StageLink por tu contenido, violaciones de derechos, prácticas de marketing o contacto ilícitas, uso indebido de integraciones e incumplimiento de estos términos.',
            '[TODO revisión legal: adaptar la indemnidad a la ley aplicable y las limitaciones de consumo.]',
          ],
        },
        {
          heading: '14. Ley aplicable y disputas',
          body: [
            '[TODO revisión legal: ley aplicable final, jurisdicción, cualquier renuncia a arbitraje/acción colectiva y excepciones de derechos del consumidor.]',
          ],
        },
        {
          heading: '15. Contacto y notificaciones',
          body: [
            'Para temas legales y de soporte, y para la notificación de cambios materiales, usá los canales de contacto publicados acá. [TODO revisión legal: insertar los contactos legal y de soporte.]',
          ],
        },
      ],
    },
    cookies: {
      title: 'Política de Cookies',
      sections: [
        {
          heading: '1. Qué son las cookies',
          body: [
            'Las cookies y tecnologías similares son pequeños archivos o elementos de almacenamiento que un sitio usa para mantenerte con sesión iniciada, recordar preferencias y entender el uso. Esta política explica cuáles usa StageLink y cómo controlarlas.',
          ],
        },
        {
          heading: '2. Estrictamente necesarias',
          body: [
            'Se usan para autenticación y gestión de sesión, protección PKCE/state/CSRF, idioma y preferencias básicas de UI, y seguridad, rate limiting y prevención de abuso. Son necesarias para el servicio y no pueden desactivarse dentro del producto, aunque podés controlarlas en tu navegador.',
          ],
        },
        {
          heading: '3. Analytics',
          body: [
            'Se usan para entender visitas, clics en links, rendimiento de páginas públicas y uso del producto, y para dar métricas a los artistas. Tu elección se guarda en la cookie `sl_ac` (1 = aceptado, 0 = rechazado); los analytics de producto como PostHog están condicionados al consentimiento.',
            '[TODO revisión legal: para usuarios de la UE, los analytics no esenciales deberían requerir consentimiento opt-in.]',
          ],
        },
        {
          heading: '4. Marketing',
          body: [
            'Se usan para atribución de campañas, retargeting, publicidad o píxeles de marketing. Hoy no se asume ningún píxel de marketing activo; cualquier cookie de este tipo requeriría consentimiento opt-in con controles de preferencia y baja.',
          ],
        },
        {
          heading: '5. Inventario de cookies',
          body: [
            'Cookie de sesión de WorkOS (Necesaria, WorkOS/StageLink) — sesión de autenticación.',
            'Cookie PKCE/state (Necesaria, StageLink/WorkOS) — seguridad OAuth.',
            '`NEXT_LOCALE` (Necesaria/preferencia, StageLink) — idioma.',
            '`sl_ac` (Preferencia de analytics, StageLink) — estado de consentimiento de analytics, ~365 días.',
            'Cookies/almacenamiento local de PostHog (Analytics, PostHog) — analytics de producto, solo tras consentimiento cuando corresponde.',
            '[TODO revisión legal: confirmar los nombres y duraciones exactos en producción antes de publicar.]',
          ],
        },
        {
          heading: '6. Gestionar tus elecciones',
          body: [
            'Podés aceptar todo, rechazar las no esenciales o gestionar categorías mediante el control de consentimiento dentro del producto, y cambiar tu elección en cualquier momento. También podés gestionar las cookies desde la configuración de tu navegador.',
          ],
        },
        {
          heading: '7. Cambios y contacto',
          body: [
            'Podemos actualizar esta Política de Cookies. Las consultas pueden enviarse al canal de contacto publicado acá. [TODO revisión legal: insertar los datos de contacto.]',
          ],
        },
      ],
    },
  },
};

export const landingTranslations = { en, es };

export function getLandingT(locale: string): LandingTranslation {
  return landingTranslations[locale as SupportedLocale] ?? landingTranslations.en;
}
