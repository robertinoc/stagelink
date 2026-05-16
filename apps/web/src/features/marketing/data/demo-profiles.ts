/**
 * Demo profiles shown on the StageLink landing page.
 * These are 100% fictional — no real artists, no real URLs, no real handles.
 *
 * To add a new profile:
 * 1. Add an object to DEMO_PROFILES following the DemoProfile type.
 * 2. Give it a unique id string.
 * 3. The landing will automatically include it in rotation.
 *
 * Selection logic: pseudorandom, persisted in localStorage for 24h.
 * See: apps/web/src/hooks/useDemoProfile.ts
 */

export interface DemoProfile {
  id: string;
  name: string;
  artistType: string;
  artistTypeEs: string;
  city: string;
  headline: string;
  headlineEs: string;
  bio: string;
  bioEs: string;
  initials: string; // for avatar placeholder
  accentColor: string; // tailwind gradient classes for avatar bg
  platforms: string[]; // platform label list (Spotify, SoundCloud, etc.)
  handle: string;
  roles: string;
  tags: string[];
  ctaPrimary: string;
  ctaPrimaryEs: string;
  ctaSecondary: string;
  ctaSecondaryEs: string;
  sampleLinks: { label: string; labelEs: string }[];
  mediaItems: { label: string; labelEs: string; meta: string; metaEs: string }[];
  aboutText: string;
  aboutTextEs: string;
  merchName: string;
  merchNameEs: string;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'mia-solari',
    name: 'Mia Solari',
    artistType: 'Indie Pop Singer',
    artistTypeEs: 'Cantante Indie Pop',
    city: 'Madrid, Spain',
    headline: 'New single out now',
    headlineEs: 'Nuevo single disponible ahora',
    bio: 'Crafting songs that feel like late-night conversations. Debut EP out this fall.',
    bioEs: 'Canciones que suenan a conversaciones de madrugada. EP debut este otoño.',
    initials: 'MS',
    accentColor: 'from-rose-400 to-pink-600',
    platforms: ['Spotify', 'Apple Music', 'SoundCloud'],
    handle: '@mia.solari',
    roles: 'Singer · Songwriter · Performer',
    tags: ['Indie Pop', 'Singer-Songwriter', 'Folk', 'Alternative'],
    ctaPrimary: 'Listen Now',
    ctaPrimaryEs: 'Escuchar Ahora',
    ctaSecondary: 'Press Kit',
    ctaSecondaryEs: 'Press Kit',
    sampleLinks: [
      { label: 'Latest Single', labelEs: 'Último Single' },
      { label: 'Tour Dates', labelEs: 'Fechas de Gira' },
      { label: 'Press Kit', labelEs: 'Press Kit' },
      { label: 'Join the fan list', labelEs: 'Unirme a la lista de fans' },
    ],
    mediaItems: [
      {
        label: 'New single',
        labelEs: 'Nuevo single',
        meta: 'Spotify / New release',
        metaEs: 'Spotify / Nuevo lanzamiento',
      },
      {
        label: 'Live session',
        labelEs: 'Sesión en vivo',
        meta: 'YouTube / Live clip',
        metaEs: 'YouTube / Clip en vivo',
      },
    ],
    aboutText:
      'A clear artist page can help fans, bookers, and collaborators understand who you are in seconds.',
    aboutTextEs:
      'Una página clara puede ayudar a fans, bookers y colaboradores a entender quién sos en segundos.',
    merchName: 'Limited EP bundle',
    merchNameEs: 'Bundle EP limitado',
  },
  {
    id: 'nico-vale',
    name: 'Nico Vale',
    artistType: 'Electronic Producer',
    artistTypeEs: 'Productor Electrónico',
    city: 'Buenos Aires, Argentina',
    headline: 'Listen to my latest release',
    headlineEs: 'Escuchá mi último lanzamiento',
    bio: 'Building textures from static and silence. New EP dropping soon.',
    bioEs: 'Construyendo texturas desde el ruido y el silencio. Nuevo EP muy pronto.',
    initials: 'NV',
    accentColor: 'from-violet-500 to-indigo-700',
    platforms: ['SoundCloud', 'Spotify', 'Bandcamp'],
    handle: '@nicovale',
    roles: 'Producer · Sound Designer · Musician',
    tags: ['Electronic', 'Ambient', 'Downtempo', 'Experimental'],
    ctaPrimary: 'Stream Now',
    ctaPrimaryEs: 'Escuchar',
    ctaSecondary: 'Booking',
    ctaSecondaryEs: 'Booking',
    sampleLinks: [
      { label: 'Latest Release', labelEs: 'Último Lanzamiento' },
      { label: 'Booking', labelEs: 'Booking' },
      { label: 'SoundCloud', labelEs: 'SoundCloud' },
      { label: 'Join the fan list', labelEs: 'Unirme a la lista de fans' },
    ],
    mediaItems: [
      {
        label: 'Latest video',
        labelEs: 'Último video',
        meta: 'YouTube / Live clip',
        metaEs: 'YouTube / Clip en vivo',
      },
      {
        label: 'Current release',
        labelEs: 'Lanzamiento actual',
        meta: 'SoundCloud / New music',
        metaEs: 'SoundCloud / Música nueva',
      },
    ],
    aboutText:
      'A clear artist page can help fans, bookers, and collaborators understand who you are in seconds.',
    aboutTextEs:
      'Una página clara puede ayudar a fans, bookers y colaboradores a entender quién sos en segundos.',
    merchName: 'Limited merch drop',
    merchNameEs: 'Drop limitado de merch',
  },
  {
    id: 'theo-hartmann',
    name: 'Theo Hartmann',
    artistType: 'Multi-instrumentalist',
    artistTypeEs: 'Multiinstrumentista',
    city: 'Berlin, Germany',
    headline: 'Live sessions, releases and tour dates',
    headlineEs: 'Sesiones en vivo, lanzamientos y fechas de gira',
    bio: 'Playing with sound, space and rhythm. Live recordings, new albums and upcoming shows.',
    bioEs:
      'Jugando con el sonido, el espacio y el ritmo. Grabaciones en vivo, nuevos álbumes y shows próximos.',
    initials: 'TH',
    accentColor: 'from-amber-400 to-orange-600',
    platforms: ['Spotify', 'YouTube', 'Apple Music'],
    handle: '@theohartmann',
    roles: 'Musician · Composer · Live Artist',
    tags: ['Jazz', 'Fusion', 'Contemporary', 'Live'],
    ctaPrimary: 'Watch Live Session',
    ctaPrimaryEs: 'Ver Sesión en Vivo',
    ctaSecondary: 'Tour Dates',
    ctaSecondaryEs: 'Fechas de Gira',
    sampleLinks: [
      { label: 'Live Session', labelEs: 'Sesión en Vivo' },
      { label: 'Tour Dates', labelEs: 'Fechas de Gira' },
      { label: 'New Album', labelEs: 'Nuevo Álbum' },
      { label: 'Join the fan list', labelEs: 'Unirme a la lista de fans' },
    ],
    mediaItems: [
      {
        label: 'Live session',
        labelEs: 'Sesión en vivo',
        meta: 'YouTube / Live clip',
        metaEs: 'YouTube / Clip en vivo',
      },
      {
        label: 'New album',
        labelEs: 'Nuevo álbum',
        meta: 'Spotify / New music',
        metaEs: 'Spotify / Música nueva',
      },
    ],
    aboutText:
      'A clear artist page can help fans, bookers, and collaborators understand who you are in seconds.',
    aboutTextEs:
      'Una página clara puede ayudar a fans, bookers y colaboradores a entender quién sos en segundos.',
    merchName: 'Limited vinyl edition',
    merchNameEs: 'Edición limitada en vinilo',
  },
  {
    id: 'elena-cruz',
    name: 'Elena Cruz',
    artistType: 'Urban Performer',
    artistTypeEs: 'Performer Urbana',
    city: 'Mexico City, Mexico',
    headline: 'Watch my latest performance',
    headlineEs: 'Mirá mi última presentación',
    bio: 'Where movement meets music. Shows, videos and everything in between.',
    bioEs:
      'Donde el movimiento se encuentra con la música. Shows, videos y todo lo que hay en medio.',
    initials: 'EC',
    accentColor: 'from-emerald-400 to-teal-600',
    platforms: ['YouTube', 'Spotify', 'TikTok'],
    handle: '@elenacruz',
    roles: 'Performer · Singer · Creator',
    tags: ['Urban', 'Pop', 'Dance', 'Latin'],
    ctaPrimary: 'Watch Now',
    ctaPrimaryEs: 'Ver Ahora',
    ctaSecondary: 'Next Shows',
    ctaSecondaryEs: 'Próximos Shows',
    sampleLinks: [
      { label: 'Latest Video', labelEs: 'Último Video' },
      { label: 'Upcoming Shows', labelEs: 'Próximos Shows' },
      { label: 'Press Kit', labelEs: 'Press Kit' },
      { label: 'Join the fan list', labelEs: 'Unirme a la lista de fans' },
    ],
    mediaItems: [
      {
        label: 'Latest video',
        labelEs: 'Último video',
        meta: 'YouTube / Live clip',
        metaEs: 'YouTube / Clip en vivo',
      },
      {
        label: 'Current release',
        labelEs: 'Lanzamiento actual',
        meta: 'Spotify / New music',
        metaEs: 'Spotify / Música nueva',
      },
    ],
    aboutText:
      'A clear artist page can help fans, bookers, and collaborators understand who you are in seconds.',
    aboutTextEs:
      'Una página clara puede ayudar a fans, bookers y colaboradores a entender quién sos en segundos.',
    merchName: 'Limited merch drop',
    merchNameEs: 'Drop limitado de merch',
  },
  {
    id: 'lukas-weber',
    name: 'Lukas Weber',
    artistType: 'Techno DJ',
    artistTypeEs: 'DJ Techno',
    city: 'Hamburg, Germany',
    headline: 'Next shows and latest sets',
    headlineEs: 'Próximos shows y últimos sets',
    bio: 'Club nights, warehouse sets and relentless energy. Booking open worldwide.',
    bioEs: 'Noches de club, sets en galpones y energía sin pausa. Booking abierto a nivel mundial.',
    initials: 'LW',
    accentColor: 'from-slate-500 to-zinc-800',
    platforms: ['SoundCloud', 'Spotify', 'Mixcloud'],
    handle: '@lukasweber',
    roles: 'DJ · Producer · Selector',
    tags: ['Techno', 'Hard Techno', 'Industrial', 'Club'],
    ctaPrimary: 'Listen to Latest Set',
    ctaPrimaryEs: 'Escuchar Último Set',
    ctaSecondary: 'Book Now',
    ctaSecondaryEs: 'Contratar',
    sampleLinks: [
      { label: 'Latest Set', labelEs: 'Último Set' },
      { label: 'Tour Dates', labelEs: 'Fechas' },
      { label: 'Booking', labelEs: 'Booking' },
      { label: 'Join the fan list', labelEs: 'Unirme a la lista de fans' },
    ],
    mediaItems: [
      {
        label: 'Latest set',
        labelEs: 'Último set',
        meta: 'SoundCloud / New mix',
        metaEs: 'SoundCloud / Mix nuevo',
      },
      {
        label: 'Live recording',
        labelEs: 'Grabación en vivo',
        meta: 'YouTube / Live clip',
        metaEs: 'YouTube / Clip en vivo',
      },
    ],
    aboutText:
      'A clear artist page can help fans, bookers, and collaborators understand who you are in seconds.',
    aboutTextEs:
      'Una página clara puede ayudar a fans, bookers y colaboradores a entender quién sos en segundos.',
    merchName: 'Limited merch drop',
    merchNameEs: 'Drop limitado de merch',
  },
];
