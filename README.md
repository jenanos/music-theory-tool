# Gitarist-støtteapp (MVP)

Dette turborepoet inneholder en enkel MVP som hjelper gitarister å utforske
akkorder i en toneart/modus, se trinn-oversikt, og klikke seg inn på grep,
voicings og enkle substitusjonsforslag.

## Kom i gang

Installer avhengigheter og start web-appen:

```sh
pnpm install
cp .env.dev.example .env.dev
cp apps/web/.env.local.example apps/web/.env.local
cp apps/band/.env.local.example apps/band/.env.local
pnpm dev:db:up
pnpm --filter web dev
```

Web-appen kjører da på `http://localhost:3001`.

Band-appen kjører på `http://localhost:3002` med `pnpm --filter band dev`.

Initialiser databasen med:

```sh
pnpm --filter @repo/db db:migrate:dev
pnpm --filter @repo/db db:seed
```

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
