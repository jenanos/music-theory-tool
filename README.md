# Gitarist-støtteapp (MVP)

Dette turborepoet inneholder en enkel MVP som hjelper gitarister å utforske
akkorder i en toneart/modus, se trinn-oversikt, og klikke seg inn på grep,
voicings og enkle substitusjonsforslag.

## Kom i gang

Installer avhengigheter og kopier env-filer:

```sh
pnpm install
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/band/.env.local.example apps/band/.env.local
```

Fyll inn **`apps/web/.env.local`** før du starter:

- `ADMIN_EMAIL` — en ekte innboks du kan motta e-post på. Denne
  brukes som admin-bruker i appen og må brukes til å logge inn.
- `RESEND_API_KEY` — API-nøkkel fra [Resend](https://resend.com/api-keys).
  Kreves også i dev nå, siden dev-bypassen er fjernet. På Resend
  sin gratis-plan kan du bare sende til e-posten du registrerte
  kontoen med, og avsender må være `onboarding@resend.dev` med mindre
  du har verifisert eget domene.
- `EMAIL_FROM` — default `Music Theory Tool <onboarding@resend.dev>`
  funker på gratis-planen.

Start så Postgres og appen:

```sh
docker compose up -d
pnpm db:generate
pnpm --filter @repo/db db:migrate:dev
pnpm --filter @repo/db db:seed   # oppretter admin-bruker + "Bandet"-gruppe
pnpm --filter web dev
```

Web-appen kjører på `http://localhost:3001`. Logg inn med adressen du
satte i `ADMIN_EMAIL` — du får magic link og 8-sifret engangskode i
innboksen, og blir promotert til admin på første innlogging.

Band-appen kjører på `http://localhost:3002` med `pnpm --filter band dev`.

## Funksjonalitet

- Velg tonic og modus (dur/ionisk, naturlig moll/aeolisk, dorisk).
- Se diatoniske trinn (I–VII) med akkordsymbol og funksjon.
- Klikk et trinn for akkorddetaljer, akkordtoner, fretboard og grep.
- Enkle substitusjonsforslag basert på funksjon og delte toner.

## Legg til flere voicings

Voicings er kuratert i `packages/voicings/src/index.ts` som et JSON-lignende
objekt. Legg til en ny akkord ved å opprette en nøkkel med akkordsymbolet, og
legg til en liste av grep.

Eksempel:

```ts
const VOICINGS = {
  C: [{ name: "Åpent C", frets: ["x", 3, 2, 0, 1, 0] }],
};
```

Hvert grep følger standard stemming (EADGBE), og `"x"` betyr dempet streng.
