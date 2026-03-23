# StageLink — Wireframes Low-Fi

> Versión: 1.0 | Fecha: 2026-03-23
> Notación: ASCII / Markdown. No representa diseño final.
> `[ ]` = input | `[ btn ]` = botón | `{ }` = contenido dinámico

---

## Pantalla 1 — Landing Marketing

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                          │
│ [◈ StageLink]                    [Log in]  [ Crear mi página ] │
├─────────────────────────────────────────────────────────────────┤
│ HERO                                                            │
│                                                                 │
│   Tu escenario digital.                  ┌─────────────┐       │
│   Crea tu página de artista              │  ╔═══════╗  │       │
│   en menos de 5 minutos.                 │  ║ foto  ║  │       │
│                                          │  ╟───────╢  │       │
│   [ Crear mi página gratis → ]           │  ║ links ║  │       │
│                                          │  ║ music ║  │       │
│   ✓ Sin tarjeta de crédito              │  ║ video ║  │       │
│   ✓ Tu página en stagelink.io/tuNombre  │  ╚═══════╝  │       │
│                                          │  (mockup)   │       │
│                                          └─────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│ SOCIAL PROOF                                                    │
│                                                                 │
│   "Usé StageLink antes de cada show y    [foto] @artist1       │
│    mis seguidores encontraron todo en    [foto] @artist2       │
│    un solo lugar."                       [foto] @artist3       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ FEATURES (3 columnas)                                           │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ 🎵 Música    │  │ 📊 Analytics  │  │ 🛍 Merch      │      │
│  │               │  │               │  │ (plan Pro)    │      │
│  │ Embed Spotify │  │ Ve quién hace │  │               │      │
│  │ y SoundCloud  │  │ click y desde │  │ Conecta tu    │      │
│  │ sin código.   │  │ dónde te      │  │ tienda        │      │
│  │               │  │ visitan.      │  │ Shopify.      │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ PRICING                                                         │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐           │
│  │ FREE                │    │ PRO          $5/mes  │           │
│  │                     │    │ ★                   │           │
│  │ • Hasta 10 bloques  │    │ • Links ilimitados   │           │
│  │ • Analytics básico  │    │ • Sin branding       │           │
│  │ • Branding SL       │    │ • Analytics completo │           │
│  │                     │    │ • Custom domain      │           │
│  │ [ Empezar gratis ]  │    │ [ Empezar con Pro ]  │           │
│  └─────────────────────┘    └─────────────────────┘           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                                          │
│ © 2026 StageLink   |   Privacidad   |   Términos               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pantalla 2 — Login / Signup

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                          │
│ [◈ StageLink]                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌──────────────────────────────┐                  │
│              │                              │                  │
│              │   Bienvenido de nuevo        │                  │
│              │   o crea tu cuenta           │                  │
│              │                              │                  │
│              │  [ Google ] Continuar con    │                  │
│              │             Google           │                  │
│              │                              │                  │
│              │  ──────── o ────────         │                  │
│              │                              │                  │
│              │  Email                       │                  │
│              │  [                       ]   │                  │
│              │                              │                  │
│              │  Contraseña                  │                  │
│              │  [                       ]   │                  │
│              │                    [👁]       │                  │
│              │                              │                  │
│              │  [ Continuar → ]             │                  │
│              │                              │                  │
│              │  ¿No tenés cuenta?           │                  │
│              │  Registrate                  │                  │
│              │                              │                  │
│              └──────────────────────────────┘                  │
│                                                                 │
│    StageLink es una plataforma solo por invitación             │
│    durante el early access.                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pantalla 3 — Onboarding (3 pasos)

### Paso 1: Elegir username

```
┌─────────────────────────────────────────────────────────────────┐
│ [◈ StageLink]                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ●───────────○───────────○                              │
│       Username    Perfil     Primer link                        │
│                                                                 │
│         ┌──────────────────────────────────────┐               │
│         │                                      │               │
│         │  Elegí tu nombre en StageLink        │               │
│         │                                      │               │
│         │  stagelink.io/                       │               │
│         │  [  rockstar_ar              ] ✓     │               │
│         │                                      │               │
│         │  ✓ "rockstar_ar" está disponible     │               │
│         │                                      │               │
│         │  Solo letras, números, _ y -         │               │
│         │  (3–30 caracteres)                   │               │
│         │                                      │               │
│         │           [ Continuar → ]            │               │
│         │                                      │               │
│         └──────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Estados del input:
  → Escribiendo:     [  rock...              ] (spinner)
  → Disponible:      [  rockstar_ar          ] ✓  (verde)
  → No disponible:   [  coldplay             ] ✗  (rojo)
  → Inválido:        [  mi nombre!!          ] ⚠  (amarillo)
```

### Paso 2: Perfil

```
┌─────────────────────────────────────────────────────────────────┐
│ [◈ StageLink]                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ✓───────────●───────────○                              │
│       Username    Perfil     Primer link                        │
│                                                                 │
│         ┌──────────────────────────────────────┐               │
│         │                                      │               │
│         │  Poné cara a tu página               │               │
│         │                                      │               │
│         │     ┌─────────┐                      │               │
│         │     │         │  ← Click para subir  │               │
│         │     │   📷    │     tu foto          │               │
│         │     │         │  JPG/PNG, máx 5MB    │               │
│         │     └─────────┘                      │               │
│         │                                      │               │
│         │  Nombre artístico                    │               │
│         │  [  Rocket Band               ]      │               │
│         │                                      │               │
│         │  Bio  (0/280)                        │               │
│         │  ┌────────────────────────────────┐  │               │
│         │  │                                │  │               │
│         │  └────────────────────────────────┘  │               │
│         │                                      │               │
│         │  [ ← Atrás ]      [ Continuar → ]   │               │
│         │  (no obligatorio, puedo hacerlo      │               │
│         │   después)                           │               │
│         │                                      │               │
│         └──────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Paso 3: Primer link

```
┌─────────────────────────────────────────────────────────────────┐
│ [◈ StageLink]                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ✓───────────✓───────────●                              │
│       Username    Perfil     Primer link                        │
│                                                                 │
│         ┌──────────────────────────────────────┐               │
│         │                                      │               │
│         │  Agregá tu primer link               │               │
│         │                                      │               │
│         │  URL                                 │               │
│         │  [  https://spotify.com/artist/...  ]│               │
│         │                                      │               │
│         │  Título                              │               │
│         │  [  Mi música en Spotify      ]      │               │
│         │                                      │               │
│         │  [ ← Atrás ]  [ Publicar mi página ]│               │
│         │                                      │               │
│         │  También podés saltear esto →        │               │
│         │                                      │               │
│         └──────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

→ Al publicar:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🎉  ¡Tu página está lista!                                   │
│                                                                 │
│   stagelink.io/rockstar_ar                                     │
│                                                                 │
│   [ 📋 Copiar link ]    [ Ver mi página ]                       │
│                                                                 │
│   [ Ir al dashboard → ]                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pantalla 4 — Dashboard

```
┌────────────────┬────────────────────────────────────────────────┐
│ SIDEBAR        │ MAIN CONTENT                                   │
│                │                                                │
│ ◈ StageLink   │  Buenos días, Rocket 👋                        │
│                │                                                │
│ ┌────────────┐ │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │   [foto]   │ │  │  Views   │ │  Clicks  │ │   CTR    │     │
│ │            │ │  │          │ │          │ │          │     │
│ │ Rocket Band│ │  │   1,234  │ │   456    │ │  36.9%   │     │
│ │@rockstar_ar│ │  │ +12% ↑   │ │ +8% ↑   │ │ últimos  │     │
│ │ FREE plan  │ │  │ 30 días  │ │ 30 días  │ │ 30 días  │     │
│ └────────────┘ │  └──────────┘ └──────────┘ └──────────┘     │
│                │                                                │
│ Navegación     │  ┌─────────────────────────────────────────┐  │
│ ─────────────  │  │ MI PÁGINA                               │  │
│ 🏠 Dashboard  │  │                                         │  │
│ ✏️  Editor    │  │  [foto] Rocket Band                     │  │
│ 📊 Analytics  │  │  @rockstar_ar · 3 bloques               │  │
│ 💳 Billing    │  │                                         │  │
│                │  │  ● Publicada  [Ver página ↗]           │  │
│ ─────────────  │  │             [Editar página]             │  │
│ ⚙️  Settings  │  │                                         │  │
│                │  └─────────────────────────────────────────┘  │
│                │                                                │
│ [Cerrar sesión]│  ┌─────────────────────────────────────────┐  │
│                │  │ TOP LINKS (últimos 7 días)               │  │
└────────────────┤  │                                         │  │
                 │  │  1. Spotify          134 clicks         │  │
                 │  │  2. Instagram         89 clicks         │  │
                 │  │  3. YouTube           67 clicks         │  │
                 │  │                                         │  │
                 │  │  [ Ver analytics completo → ]           │  │
                 │  └─────────────────────────────────────────┘  │
                 │                                                │
                 │  ┌─────────────────────────────────────────┐  │
                 │  │ ✦ UPGRADE A PRO ($5/mes)                │  │
                 │  │ Links ilimitados · Sin branding ·        │  │
                 │  │ Analytics por país y dispositivo         │  │
                 │  │ [ Actualizar plan → ]                    │  │
                 │  └─────────────────────────────────────────┘  │
                 │                                                │
                 └────────────────────────────────────────────────┘
```

---

## Pantalla 5 — Editor de página

```
┌────────────────┬────────────────────────────────────────────────┐
│ SIDEBAR        │ EDITOR                     PREVIEW             │
│ (igual)        │                            ┌──────────────────┐│
│                │  ┌─────────────────────┐   │  stagelink.io/   ││
│                │  │ BLOQUES (3/10 Free) │   │  rockstar_ar     ││
│                │  ├─────────────────────┤   │                  ││
│                │  │                     │   │ ┌──────────────┐ ││
│                │  │ ⠿ [🔗] Mi Spotify  │   │ │   [foto]     │ ││
│                │  │   Mi música en...   │   │ │ Rocket Band  │ ││
│                │  │   [Editar] [🗑]     │   │ │ Bio del art. │ ││
│                │  │                     │   │ └──────────────┘ ││
│                │  │ ⠿ [🎵] SoundCloud  │   │                  ││
│                │  │   [Editar] [🗑]     │   │ [Mi Spotify →  ] ││
│                │  │                     │   │                  ││
│                │  │ ⠿ [📹] YouTube     │   │ ┌──────────────┐ ││
│                │  │   Live desde...     │   │ │  ♫ SoundCloud│ ││
│                │  │   [Editar] [🗑]     │   │ │  [  player  ]│ ││
│                │  │                     │   │ └──────────────┘ ││
│                │  │ ┌─────────────────┐ │   │                  ││
│                │  │ │ + Agregar bloque│ │   │ ┌──────────────┐ ││
│                │  │ └─────────────────┘ │   │ │  ▶ YouTube   │ ││
│                │  │                     │   │ │  [  player  ]│ ││
│                │  │   Tipos disponibles:│   │ └──────────────┘ ││
│                │  │   [🔗 Link]         │   │                  ││
│                │  │   [🎵 Música]       │   │ ─────────────── ││
│                │  │   [📹 Video]        │   │ Powered by       ││
│                │  │   [📧 Fan Capture]  │   │ StageLink        ││
│                │  │                     │   └──────────────────┘│
│                │  └─────────────────────┘                       │
│                │                                                 │
│                │  [ Cambios sin guardar ]  [ Guardar cambios ]  │
│                │                                                 │
└────────────────┴────────────────────────────────────────────────┘
```

### Modal: Agregar bloque Link

```
┌──────────────────────────────────────────┐
│  Agregar link                            │
├──────────────────────────────────────────┤
│  URL *                                   │
│  [  https://                        ]    │
│                                          │
│  Título *                                │
│  [  Mi página de Instagram          ]    │
│  Máx. 60 caracteres                      │
│                                          │
│  Vista previa:                           │
│  ┌────────────────────────────────────┐  │
│  │  [icono]  Mi página de Instagram  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [ Cancelar ]          [ Agregar bloque ]│
└──────────────────────────────────────────┘
```

### Modal: Agregar bloque Music / Video

```
┌──────────────────────────────────────────┐
│  Agregar embed de música                 │
├──────────────────────────────────────────┤
│  Pegá la URL de tu canción o playlist    │
│                                          │
│  [  https://open.spotify.com/...   ]     │
│                                          │
│  ✓ Plataformas soportadas:              │
│    Spotify · SoundCloud                  │
│                                          │
│  Vista previa:                           │
│  ┌────────────────────────────────────┐  │
│  │  ♫ Spotify player                 │  │
│  │  [▶] Nombre del track             │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [ Cancelar ]          [ Agregar bloque ]│
└──────────────────────────────────────────┘
```

### Modal: Agregar bloque Fan Capture

```
┌──────────────────────────────────────────┐
│  Agregar captura de emails               │
├──────────────────────────────────────────┤
│  Título del bloque                       │
│  [  Sumate a mi lista de fans     ]      │
│                                          │
│  Placeholder del campo email             │
│  [  Tu email...                   ]      │
│                                          │
│  Texto del botón                         │
│  [  Suscribirme                   ]      │
│                                          │
│  Texto de consentimiento *               │
│  ┌────────────────────────────────────┐  │
│  │ Acepto recibir novedades de este   │  │
│  │ artista. Podés darte de baja...    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Vista previa:                           │
│  ┌────────────────────────────────────┐  │
│  │  Sumate a mi lista de fans         │  │
│  │  [ Tu email...          ] [Subs.]  │  │
│  │  □ Acepto recibir novedades...     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [ Cancelar ]          [ Agregar bloque ]│
└──────────────────────────────────────────┘
```

---

## Pantalla 6 — Página Pública del Artista

```
┌─────────────────────────────────────────────────────────────────┐
│                  stagelink.io/rockstar_ar                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌───────────┐                                │
│                    │           │                                │
│                    │  [avatar] │                                │
│                    │           │                                │
│                    └───────────┘                                │
│                                                                 │
│                    Rocket Band                                  │
│              Músico indie de Buenos Aires 🇦🇷                  │
│              Bio: Tocamos en todos los escenarios...           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Spotify icon]  Escuchanos en Spotify          →       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Instagram icon]  Seguinos en Instagram        →       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ♫ SoundCloud                                           │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ [▶▶]  Nombre del track ───────────────── 3:24  │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ▶ Mirá nuestro último video                            │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │                                                 │   │   │
│  │  │   [  YouTube embed  ]                           │   │   │
│  │  │                                                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📧  Sumate a nuestra lista de fans                     │   │
│  │                                                         │   │
│  │  [ tu email...                    ] [ Suscribirme ]    │   │
│  │  ☐ Acepto recibir novedades...                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│           Powered by ◈ StageLink  ← (solo plan Free)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pantalla 7 — Analytics

```
┌────────────────┬────────────────────────────────────────────────┐
│ SIDEBAR        │ ANALYTICS                                      │
│ (igual)        │                                                │
│                │  Últimos  [ 7 días ▾ ]                         │
│                │                                                │
│                │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│                │  │  Views   │ │  Clicks  │ │   CTR    │      │
│                │  │  1,234   │ │   456    │ │  36.9%   │      │
│                │  │ +12% ↑   │ │ +8% ↑   │ │          │      │
│                │  └──────────┘ └──────────┘ └──────────┘      │
│                │                                                │
│                │  ┌──────────────────────────────────────────┐ │
│                │  │ VISITAS DIARIAS                          │ │
│                │  │                                          │ │
│                │  │ 200 ┤                         *          │ │
│                │  │ 150 ┤               *    *  *   *        │ │
│                │  │ 100 ┤    *   *  *                        │ │
│                │  │  50 ┤ *                                  │ │
│                │  │   0 └──────────────────────────────────  │ │
│                │  │      L  M  X  J  V  S  D                 │ │
│                │  └──────────────────────────────────────────┘ │
│                │                                                │
│                │  ┌──────────────────────────────────────────┐ │
│                │  │ CLICKS POR BLOQUE                        │ │
│                │  │                                          │ │
│                │  │  1  [Spotify]    Mi música   ██████  134 │ │
│                │  │  2  [Instagram]  Seguinos    ████    89  │ │
│                │  │  3  [YouTube]    Último video ███    67  │ │
│                │  │  4  [SoundCloud] Demo         █      23  │ │
│                │  │                                          │ │
│                │  └──────────────────────────────────────────┘ │
│                │                                                │
│                │  ┌──────────────────────────────────────────┐ │
│                │  │ 🔒 ANALYTICS PRO                         │ │
│                │  │ Breakdown por país y dispositivo         │ │
│                │  │ Disponible en plan Pro ($5/mes)          │ │
│                │  │ [ Actualizar plan → ]                    │ │
│                │  └──────────────────────────────────────────┘ │
│                │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

---

## Pantalla 8 — Billing

```
┌────────────────┬────────────────────────────────────────────────┐
│ SIDEBAR        │ BILLING                                        │
│ (igual)        │                                                │
│                │  ┌──────────────────────────────────────────┐ │
│                │  │ PLAN ACTUAL                              │ │
│                │  │                                          │ │
│                │  │  ● FREE                                  │ │
│                │  │  Gratis para siempre                     │ │
│                │  │                                          │ │
│                │  │  Uso actual:                             │ │
│                │  │  Bloques   ████████░░  8/10             │ │
│                │  │                                          │ │
│                │  │  Incluye:                                │ │
│                │  │  ✓ Hasta 10 bloques                     │ │
│                │  │  ✓ Analytics básico (30 días)           │ │
│                │  │  ✗ Branding "Powered by StageLink"      │ │
│                │  │  ✗ Custom domain                        │ │
│                │  │                                          │ │
│                │  └──────────────────────────────────────────┘ │
│                │                                                │
│                │  ┌──────────────────────────────────────────┐ │
│                │  │ ✦ UPGRADE A PRO — $5/mes                 │ │
│                │  │                                          │ │
│                │  │  ✓ Links ilimitados                     │ │
│                │  │  ✓ Sin branding en tu página            │ │
│                │  │  ✓ Analytics: países + dispositivos     │ │
│                │  │  ✓ Custom domain (ej: tuband.com)       │ │
│                │  │                                          │ │
│                │  │  [ Actualizar a Pro → ]                  │ │
│                │  │  Cancela cuando quieras                  │ │
│                │  │                                          │ │
│                │  └──────────────────────────────────────────┘ │
│                │                                                │
│                │  HISTORIAL DE PAGOS                           │
│                │  ─────────────────────────────────────────    │
│                │  No hay pagos aún.                            │
│                │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

*(Versión con plan Pro activo)*

```
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PLAN ACTUAL                                              │  │
│  │                                                          │  │
│  │  ★ PRO — $5/mes                                         │  │
│  │  Próximo cobro: 23 de Abril, 2026                       │  │
│  │                                                          │  │
│  │  [Administrar suscripción en Stripe ↗]                  │  │
│  │  [Cancelar plan]  (conservás Pro hasta el 23/04)        │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
```
