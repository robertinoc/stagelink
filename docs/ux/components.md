# StageLink — Catálogo de Componentes por Pantalla

> Versión: 1.0 | Fecha: 2026-03-23
> Base: shadcn/ui + Tailwind CSS. Componentes custom donde shadcn no alcanza.

---

## Convenciones

- `shadcn:NombreComponente` → componente de shadcn/ui, instalar con `npx shadcn@latest add`
- `custom:NombreComponente` → componente a construir (no existe en shadcn)
- `icon:NombreIcono` → icono de lucide-react (incluido con shadcn)

---

## Pantalla 1 — Landing Marketing

| Componente | Tipo | Notas |
|---|---|---|
| `Navbar` | `custom:MarketingNavbar` | Logo + nav links + CTA button. Fixed top, transparente → sólido al scroll |
| CTA primario | `shadcn:Button` variant=`default` size=`lg` | "Crear mi página gratis" |
| CTA secundario | `shadcn:Button` variant=`outline` | "Log in" |
| Hero mockup | `custom:PhoneMockup` | SVG o imagen estática del teléfono con screenshot |
| Feature card | `custom:FeatureCard` | Icono + título + descripción. Grid 3 cols en desktop, 1 en mobile |
| Pricing card | `custom:PricingCard` | Plan name + precio + feature list + CTA. Highlight en Pro |
| Feature check | `icon:Check` | Lista de features incluidas |
| Feature cross | `icon:X` | Features no incluidas (color muted) |
| Testimonial | `custom:TestimonialCard` | Avatar + quote + handle |
| Footer | `custom:MarketingFooter` | Links legales + copyright |

---

## Pantalla 2 — Login / Signup

| Componente | Tipo | Notas |
|---|---|---|
| Auth card | `shadcn:Card` + `CardHeader` + `CardContent` | Centered, max-w-md |
| Google OAuth btn | `shadcn:Button` variant=`outline` | Con `icon:Chrome` o logo SVG de Google |
| Separator | `shadcn:Separator` | "o" en el centro |
| Email input | `shadcn:Input` + `shadcn:Label` | type=email |
| Password input | `shadcn:Input` | type=password + toggle visibilidad |
| Visibility toggle | `icon:Eye` / `icon:EyeOff` | En el input de contraseña |
| Submit button | `shadcn:Button` | Full width, loading state |
| Error message | `shadcn:Alert` variant=`destructive` | Credenciales incorrectas, etc. |
| Redirect link | `shadcn:Button` variant=`link` | "¿No tenés cuenta?" |
| Early access note | `shadcn:Badge` variant=`secondary` | "Solo por invitación" |

---

## Pantalla 3 — Onboarding

### Compartidos entre pasos

| Componente | Tipo | Notas |
|---|---|---|
| Step indicator | `custom:StepIndicator` | 3 pasos con estados: pending / active / done. Usar shadcn `Progress` o custom SVG |
| Paso container | `shadcn:Card` | max-w-lg, centered |
| Back / Next nav | `shadcn:Button` | Back=outline, Next=default |
| Skip link | `shadcn:Button` variant=`ghost` size=`sm` | "Hacerlo después" |

### Paso 1: Username

| Componente | Tipo | Notas |
|---|---|---|
| Prefix label | `custom:InputWithPrefix` | Muestra "stagelink.io/" fijo antes del input |
| Username input | `shadcn:Input` | Autoformat a lowercase, replace spaces |
| Validation icon | `icon:Check` / `icon:X` / `icon:Loader2` | Dentro del input, a la derecha |
| Validation message | `shadcn:FormMessage` | Debajo del input, color según estado |

### Paso 2: Perfil

| Componente | Tipo | Notas |
|---|---|---|
| Avatar upload | `custom:AvatarUpload` | Click para abrir file picker. Preview circular. Resize client-side antes de subir |
| Name input | `shadcn:Input` | |
| Bio textarea | `shadcn:Textarea` | Con contador de caracteres `{n}/280` |
| Char counter | `custom:CharCounter` | Se pone rojo al llegar a 280 |

### Paso 3: Primer link

| Componente | Tipo | Notas |
|---|---|---|
| URL input | `shadcn:Input` | type=url, validación inline |
| Title input | `shadcn:Input` | |
| Publish button | `shadcn:Button` | "Publicar mi página" — acción principal |

### Pantalla de éxito post-onboarding

| Componente | Tipo | Notas |
|---|---|---|
| Success card | `shadcn:Card` | Con confetti animation opcional (canvas-confetti) |
| URL display | `custom:CopyableUrl` | URL del artista + botón copiar |
| Copy button | `shadcn:Button` variant=`outline` | Con `icon:Copy` → feedback ✓ |
| CTA Ver página | `shadcn:Button` variant=`ghost` | Abre en nueva tab |
| CTA Dashboard | `shadcn:Button` | "Ir al dashboard" |

---

## Pantalla 4 — Dashboard

### Layout

| Componente | Tipo | Notas |
|---|---|---|
| App shell | `custom:AppShell` | Sidebar fijo en desktop, drawer en mobile |
| Sidebar | `custom:Sidebar` | Logo + nav + artist info + plan badge + logout |
| Nav item | `shadcn:Button` variant=`ghost` | Con icono + label, active state |
| Artist info block | `custom:ArtistMiniCard` | Avatar small + username + plan badge |
| Plan badge | `shadcn:Badge` | "FREE" o "PRO" con colores distintos |
| Mobile menu | `shadcn:Sheet` side=`left` | Sidebar en mobile |
| Hamburger button | `shadcn:Button` variant=`ghost` | `icon:Menu` |

### Contenido principal

| Componente | Tipo | Notas |
|---|---|---|
| Stats card | `custom:StatCard` | Número grande + label + delta (+ o - %) |
| Stats grid | CSS Grid | 3 columnas en desktop, 1 en mobile |
| Page preview card | `shadcn:Card` | Thumbnail + estado + CTAs |
| Published badge | `shadcn:Badge` variant=`outline` | Verde para publicada |
| Top links table | `shadcn:Table` | 3 filas max. Link + clicks |
| Upgrade banner | `custom:UpgradeBanner` | Card con CTA. Solo visible en plan Free |

---

## Pantalla 5 — Editor de Página

### Layout

| Componente | Tipo | Notas |
|---|---|---|
| Editor shell | `custom:EditorShell` | Split: panel izq (editor) + panel der (preview). En mobile: tabs |
| Mobile tab switcher | `shadcn:Tabs` | "Editor" / "Preview" |
| Save button | `shadcn:Button` | Estado: "Guardar cambios" / "Guardando..." / "Guardado ✓" |
| Unsaved indicator | `shadcn:Badge` variant=`secondary` | "Cambios sin guardar" |

### Lista de bloques

| Componente | Tipo | Notas |
|---|---|---|
| Blocks list | `custom:BlockList` | Wrapper para DnD |
| Drag handle | `icon:GripVertical` | Visible en hover. Activa DnD |
| Block row | `custom:BlockRow` | Handle + tipo icon + título + acciones |
| Block type icon | `icon:Link2` / `icon:Music` / `icon:Video` / `icon:Mail` | Según tipo |
| Edit button | `shadcn:Button` variant=`ghost` size=`sm` | `icon:Pencil` |
| Delete button | `shadcn:Button` variant=`ghost` size=`sm` | `icon:Trash2`, color destructive |
| Delete confirm | `shadcn:AlertDialog` | "¿Eliminar este bloque?" |
| Add block button | `shadcn:Button` variant=`dashed` | Full width. Abre picker |
| Blocks limit badge | `custom:LimitBadge` | "3/10 bloques (Free)" — progress bar inline |

### Block type picker (cuando se hace click en Agregar)

| Componente | Tipo | Notas |
|---|---|---|
| Picker container | `shadcn:Popover` o `shadcn:Dialog` | Grid de tipos |
| Type card | `custom:BlockTypeCard` | Icono + nombre + descripción corta |

### Modales de edición de bloque

| Componente | Tipo | Notas |
|---|---|---|
| Modal wrapper | `shadcn:Dialog` | Título dinámico según tipo |
| Form | `react-hook-form` + `zod` | Validación en cliente |
| URL input | `shadcn:Input` | type=url |
| Text input | `shadcn:Input` | |
| Textarea | `shadcn:Textarea` | Para textos largos (consent text) |
| Form error | `shadcn:FormMessage` | |
| Preview inside modal | `custom:BlockPreview` | Render mini del bloque |
| Cancel / Submit | `shadcn:Button` | Cancel=outline, Submit=default |

### Preview panel

| Componente | Tipo | Notas |
|---|---|---|
| Phone frame | `custom:PhoneFrame` | SVG frame con scroll interno |
| Preview renderer | `custom:PagePreview` | Mismo componente que la página pública, con datos en tiempo real |

---

## Pantalla 6 — Página Pública

| Componente | Tipo | Notas |
|---|---|---|
| Page wrapper | `custom:PublicPageWrapper` | Fondo con color/imagen del tema. Max-w-md, centered |
| Artist avatar | `next/image` + CSS | Circular, 96px, borde blanco sutil |
| Artist name | `h1` | Font heading |
| Artist bio | `p` | text-muted-foreground |
| Block: Link | `custom:LinkBlock` | Botón full-width con icono y título. `target="_blank"` |
| Block: Music | `custom:MusicEmbedBlock` | iframe de Spotify/SoundCloud. Responsive |
| Block: Video | `custom:VideoEmbedBlock` | iframe de YouTube/TikTok. 16:9 aspect ratio |
| Block: Fan Capture | `custom:FanCaptureBlock` | Formulario con email + checkbox consent |
| Fan email input | `shadcn:Input` | type=email |
| Fan submit btn | `shadcn:Button` | Inline con el input |
| Consent checkbox | `shadcn:Checkbox` + `shadcn:Label` | Required para submit |
| Success toast | `shadcn:Sonner` / `shadcn:Toast` | "¡Gracias! Estás en la lista." |
| Powered by footer | `custom:PoweredByFooter` | Solo en plan Free. Link a stagelink.io |
| 404 page | `custom:ArtistNotFound` | "Esta página no existe (aún). Crea la tuya." + CTA |

---

## Pantalla 7 — Analytics

| Componente | Tipo | Notas |
|---|---|---|
| Period selector | `shadcn:Select` | "7 días" / "30 días" |
| Stat card | `custom:StatCard` | Reutilizado del dashboard |
| Line chart | `recharts:LineChart` o `custom:SimpleLineChart` | Views por día. Considerar recharts (liviano) |
| Clicks table | `shadcn:Table` | Bloque + icono + clicks + barra visual |
| Barra visual | `custom:InlineBar` | CSS puro, proporcional al max |
| Pro upsell card | `custom:ProUpsellCard` | Solo visible en plan Free. Con lock icon |
| Pro locked stat | `custom:LockedStat` | Versión blur del stat con candado encima |

---

## Pantalla 8 — Billing

| Componente | Tipo | Notas |
|---|---|---|
| Plan card | `shadcn:Card` | Plan actual con detalles |
| Plan badge | `shadcn:Badge` | "FREE" gris / "PRO" dorado |
| Usage meter | `shadcn:Progress` | Bloques usados vs límite |
| Feature list | Lista con `icon:Check` / `icon:X` | |
| Upgrade card | `custom:UpgradeCard` | Más prominente que el plan actual. CTA a Stripe Checkout |
| Stripe button | `shadcn:Button` | "Actualizar a Pro" → redirect a Stripe |
| Manage sub btn | `shadcn:Button` variant=`outline` | "Administrar en Stripe ↗" → Billing Portal |
| Cancel link | `shadcn:Button` variant=`link` size=`sm` | "Cancelar plan" con confirm dialog |
| Cancel confirm | `shadcn:AlertDialog` | "¿Cancelar plan? Conservás Pro hasta X fecha." |
| Payment history | `shadcn:Table` | Fecha + monto + estado + link recibo |
| Empty state | `custom:EmptyState` | "No hay pagos aún" |

---

## Componentes Custom reutilizables

| Componente | Donde se usa | Descripción |
|---|---|---|
| `AppShell` | Dashboard, Editor, Analytics, Billing | Layout con sidebar + contenido |
| `Sidebar` | Todo el dashboard | Navegación principal |
| `StatCard` | Dashboard, Analytics | Métrica con delta |
| `AvatarUpload` | Onboarding paso 2, Settings | Upload circular con preview |
| `CopyableUrl` | Onboarding success, Settings | URL + botón copiar con feedback |
| `BlockRow` | Editor | Fila de bloque con DnD |
| `BlockPreview` | Editor modal | Mini render del bloque |
| `PoweredByFooter` | Página pública (Free) | Footer con link a StageLink |
| `UpgradeBanner` | Dashboard, Editor, Analytics | CTA de upgrade al plan Pro |
| `ProUpsellCard` | Analytics, Billing | Feature locked con upgrade CTA |
| `EmptyState` | Cualquier lista vacía | Icono + mensaje + CTA opcional |
| `InlineBar` | Tablas de analytics | Barra proporcional CSS |
| `CharCounter` | Bio, textos con límite | `{n}/{max}` con color según proximidad |
| `InputWithPrefix` | Username en onboarding | Input con texto fijo a la izquierda |
| `LimitBadge` | Editor (plan Free) | "X/10 bloques" |
| `PhoneFrame` | Landing, Preview panel | Wrapper SVG de teléfono |

---

## shadcn/ui — Componentes a instalar

```bash
npx shadcn@latest add button card input label textarea
npx shadcn@latest add form          # react-hook-form integration
npx shadcn@latest add dialog alert-dialog
npx shadcn@latest add badge progress separator
npx shadcn@latest add table
npx shadcn@latest add tabs select
npx shadcn@latest add sheet         # Mobile sidebar drawer
npx shadcn@latest add popover
npx shadcn@latest add checkbox
npx shadcn@latest add alert
npx shadcn@latest add sonner        # Toast notifications
npx shadcn@latest add avatar
```

## Dependencias adicionales

```bash
pnpm add recharts                   # Charts (analytics)
pnpm add @dnd-kit/core @dnd-kit/sortable  # Drag & drop (editor de bloques)
pnpm add react-hook-form zod @hookform/resolvers  # Formularios
pnpm add canvas-confetti            # Animación en onboarding success (opcional)
pnpm add lucide-react               # Ya incluido con shadcn
```
