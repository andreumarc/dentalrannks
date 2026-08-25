# DentalRank

Marketplace español de adquisición de pacientes para clínicas dentales:
**ranking patrocinado + comparador + captación de leads + medición de resultados**.

Un paciente busca *«implantes dentales Barcelona»* y ve clínicas ordenadas de forma
transparente. Una clínica compra visibilidad medible en el mercado
`tratamiento × municipio` y sigue cada lead hasta el tratamiento aceptado.

---

## Principio de diseño innegociable

El producto mantiene **dos escalas separadas** que nunca se mezclan:

| | Determinado por | Se muestra como |
|---|---|---|
| **Posición patrocinada** | la puja de la clínica | etiqueta `PATROCINADO`, siempre visible |
| **DentalRank Score** | verificación, reseñas, tiempo de respuesta, completitud de ficha | 0–100, señal editorial |

El importe pagado **no interviene** en el DentalRank Score ni en el orden de los
resultados orgánicos. Hay tests que lo comprueban (`src/lib/ranking.test.ts`,
`src/lib/score.test.ts`). DentalRank no emite juicios clínicos ni presenta
certificaciones sanitarias que no hayan sido verificadas.

---

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript estricto ·
Tailwind CSS v4 · Prisma 6 + PostgreSQL (Neon) · Auth.js v5 · Stripe ·
Google Maps JavaScript API · Zod · React Hook Form · Recharts · Vitest ·
Vercel.

Identidad visual heredada de **Impulsodent Consulting**: cian `#01ADD0` sobre
antracita `#393F42`, tipografías Exo 2 + Outfit + IBM Plex Mono, titulares en
caja alta, geometría recta de 6 px.

El mapa de clínicas usa la **Google Maps JavaScript API** (cargada de forma
perezosa desde `src/lib/google-maps.ts`, sin dependencia npm). Sin
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` configurada se muestra un estado de
respaldo con la lista de clínicas y enlaces a Google Maps: nunca se rompe.

Las fotografías de las páginas públicas (`src/lib/images.ts`,
`public/img/*.webp`) son un catálogo curado de **imágenes de banco**, usado
como contenido de demostración y como respaldo para clínicas que aún no han
subido las suyas. Nunca se presentan como instalaciones reales de una clínica
concreta que no las haya aportado.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env        # rellena DATABASE_URL, DIRECT_URL y AUTH_SECRET
npx prisma migrate deploy   # aplica el esquema
npm run db:seed             # datos de demostración (opcional)
npm run dev
```

Credenciales de demostración tras el seed:

- `admin@dentalrank.es` — SUPER_ADMIN
- `clinica-<slug-organizacion>@dentalrank.es` — CLINIC_ADMIN
- contraseña: valor de `SEED_PASSWORD` (por defecto `DentalRank2026!`)

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | build de producción (ejecuta `prisma generate`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (93 tests, sin base de datos ni red) |
| `npm run db:migrate` | nueva migración en desarrollo |
| `npm run db:deploy` | aplica migraciones en producción |
| `npm run db:seed` | datos de demostración |
| `npm run db:studio` | Prisma Studio |

---

## Arquitectura

```
src/
  app/
    (public)/        marketplace: home, resultados, municipio, ficha, SEO, legales
    (auth)/          login y alta de clínica
    (app)/dashboard/ panel de la clínica
    admin/           back-office (solo SUPER_ADMIN)
    api/             auth, stripe (checkout + webhook), seed
    r/               redirección con tracking de clics
  components/
    ui/              primitivas del sistema de diseño
    site/ marketing/ public/ dashboard/ admin/ auth/
  lib/               dominio puro y utilidades (testeable sin base de datos)
  server/            acceso a datos y lógica de servidor
    actions/         superficie de Server Actions expuesta al cliente
prisma/              esquema, migraciones y seed
```

### Rutas públicas

```
/                            home con buscador
/{tratamiento}/{municipio}   resultados  → /implantes/barcelona
/dentistas/{municipio}       todas las clínicas del municipio
/clinica/{slug}              ficha completa
/tratamientos                índice por categorías
/ciudades                    índice de municipios
/como-funciona               explicación del modelo
/para-clinicas               landing B2B
/legal/{privacidad|aviso-legal|cookies}
```

### Panel de clínica · `/dashboard`

Resumen con KPIs y funnel · Leads con filtros y exportación CSV · CRM por lead
con timeline · Posiciones patrocinadas con cálculo de *outbid* · Analítica por
tratamiento y ciudad · Saldo y ledger · Perfil público · Equipo.

### Back-office · `/admin`

Resumen de negocio · Clínicas y verificación · Organizaciones · Mercados ·
Pujas · Leads y calidad · Pagos · Usuarios · Importación CSV · Señales de
fraude · Registro de auditoría.

---

## Modelo de negocio en el código

La arquitectura soporta los tres modelos desde el primer día
(`AuctionMarket.pricingModel`):

- **BALANCE** — la clínica compromete saldo y sube en el ranking. *Implementado.*
- **CPC** — se descuenta saldo por clic válido. *Implementado en el tracking.*
- **CPL** — se cobra por lead válido. *Implementado en el alta de leads.*

No hay todavía un motor de subasta continuo tipo Google Ads: las posiciones se
calculan por importe comprometido, con desempate por `reachedAmountAt`. Las
entidades (`ClinicBudget`, `BidHistory`, `SponsoredPosition`) ya están
preparadas para ese salto.

### Dinero

Todos los importes son **enteros en céntimos de euro**. Nunca `Float`.
La fuente de verdad del saldo es el **ledger** (`WalletTransaction`);
`Wallet.balanceCents` es una caché derivada que se recalcula en cada asiento y
puede conciliarse con `reconcile(clinicId)`.

El saldo **solo** se modifica en servidor. Las recargas pasan por el webhook de
Stripe, con verificación de firma e idempotencia por `StripeEvent.id`.

---

## Seguridad

- Autorización en servidor en cada Server Action (`src/lib/authz.ts`); nunca se
  confía en un identificador enviado por el cliente.
- Validación de toda entrada con Zod.
- Cabeceras de seguridad y CSP en `middleware.ts`.
- Rate limiting persistente en formularios públicos y login.
- Prevención de SSRF al leer webs de clínicas (`isSafeExternalUrl`).
- Registro de auditoría (`AuditLog`) de las acciones sensibles.
- Las IPs se guardan siempre **hasheadas**, nunca en claro.

## Protección de datos

Orientado a España: GDPR y LOPDGDD.

- **Doble consentimiento separado**: envío de datos a la clínica (obligatorio) y
  comunicaciones comerciales (opcional). Nunca una sola casilla para todo.
- Se guarda `consent_version`, texto íntegro, momento y origen de cada
  consentimiento (`Consent`).
- No se solicitan ni almacenan datos de salud.
- Los textos legales incluidos son **plantillas pendientes de revisión
  jurídica**, con marcadores `[…]` en los datos registrales.

---

## Despliegue

1. Sube el repositorio a GitHub.
2. Importa el proyecto en Vercel.
3. Crea la base de datos en Neon y configura `DATABASE_URL` y `DIRECT_URL`.
4. Define el resto de variables de `.env.example` en Vercel.
5. Ejecuta `npx prisma migrate deploy` contra la base de datos de producción.
6. Configura el webhook de Stripe apuntando a `https://<dominio>/api/stripe/webhook`
   con los eventos `checkout.session.completed`, `payment_intent.succeeded`,
   `payment_intent.payment_failed` y `charge.refunded`, y copia el secreto en
   `STRIPE_WEBHOOK_SECRET`.

Las lecturas de contenido público toleran una caída de la base de datos durante
el build (`safeRead`): la página se degrada y se regenera en la siguiente
revalidación, en lugar de romper el despliegue.

---

## Estado y siguientes pasos

Fases 1 a 5 del plan implementadas. Pendiente, por orden de valor:

1. Envío real de correos (leads e invitaciones) — hoy solo se persisten.
2. Reseñas externas vía API autorizada. **No** se scrapea Google Maps.
3. Motor de subasta continuo con reparto automático de presupuesto.
4. Barrios como unidad de segmentación (el esquema ya lo contempla).
5. Transacción única que abarque ledger y puja al reclamar posición.
6. Revisión jurídica de los textos legales antes de operar con datos reales.
