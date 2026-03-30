# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A music theory web app for guitarists — explore diatonic chords, voicings, scales, and chord substitutions. Norwegian-language UI. Built as a **pnpm + Turborepo monorepo** with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and PostgreSQL via Prisma.

## Commands

```bash
pnpm install                  # Install all dependencies
pnpm dev                      # Start all dev servers (web :3001, band :3002)
pnpm --filter web dev         # Start only the web app
pnpm --filter band dev        # Start only the band app
pnpm build                    # Build all packages
pnpm lint                     # ESLint (max-warnings=0)
pnpm check-types              # TypeScript type checking
pnpm test                     # Vitest across all packages
pnpm format                   # Prettier

# Database (requires Docker)
pnpm dev:db:up                # Start PostgreSQL container
pnpm dev:db:down              # Stop PostgreSQL container
pnpm db:migrate:dev           # Run Prisma migrations
pnpm db:seed                  # Seed database
pnpm db:generate              # Regenerate Prisma client
```

To run a single test file: `pnpm --filter @repo/theory vitest run tests/<file>.test.ts`

## Monorepo Structure

| Package | Purpose |
|---------|---------|
| `apps/web` | Main guitarist tool (Next.js, port 3001) |
| `apps/band` | Band collaboration tool (Next.js, port 3002) |
| `apps/practice` | Practice mode app |
| `packages/theory` | Pure music theory engine — scales, chords, substitutions, progressions |
| `packages/voicings` | Curated guitar voicings database + Fretboard component |
| `packages/db` | Prisma schema, client, seeds (PostgreSQL) |
| `packages/ui` | Shared React components (shadcn/ui CLI + Radix) |
| `packages/eslint-config` | Shared ESLint config |
| `packages/tailwind-config` | Shared Tailwind config |
| `packages/typescript-config` | Shared tsconfig |

## Architecture

**Data flow:** React pages → `@repo/theory` pure functions → `@repo/voicings` for guitar data → `@repo/db` for persistence → `@repo/ui` shared components.

### `packages/theory` (core engine, all pure functions)

- **`chords.ts`** — `buildDiatonicChords(tonic, mode, includeSevenths)` returns `DiatonicChord[]` with degree, roman numeral, quality, harmonic function, tones
- **`scales.ts`** — 15+ scale definitions (7 church modes + harmonic/melodic minor + pentatonic + blues + symmetric). Each scale has intervals, family, degree labels, avoid degrees, context-aware scoring
- **`substitutions.ts`** — `suggestSubstitutions()` with categories (basic/spice/approach), multi-factor scoring (shared tones, function preservation, context), and richness profiles
- **`chord_richness.ts`** — `ChordRichnessProfile` type ("triad" | "seventh" | "jazz") controls chord complexity throughout the app
- **`progressions.ts`** — 40+ curated progressions (modal, blues, jazz, pop) with roman numerals, descriptions, weights
- **`data.ts`** — Modal signatures, function groups, enharmonic mappings

### `packages/voicings`

Voicings stored as `{ [chordSymbol]: Array<{ name, frets }> }` in `index.ts`. Frets array follows EADGBE tuning, `"x"` = muted string.

### Key domain types

- `ModeId` — union of mode strings (ionian, dorian, phrygian, etc.)
- `ChordRichnessProfile` — "triad" | "seventh" | "jazz"
- `HarmonicFunction` — "tonic" | "predominant" | "dominant" | "variable"
- `SlashChordType` — "none" | "inversion" | "non_chord_bass"
- Pitch classes use chromatic integers 0–11 (C=0)

### Database models (Prisma)

Song, Section, OriginalSong, OriginalSection, SavedProgression

## shadcn/ui Components

All UI components in `packages/ui` are managed via the **shadcn CLI**. When you need a new shadcn component:

```bash
# From repo root (preferred):
pnpm dlx shadcn@latest add <component> -c packages/ui

# Or from within packages/ui/:
cd packages/ui && pnpm dlx shadcn@latest add <component>
```

**Rules for code agents:**
- **Always use the shadcn CLI** to add new components — never copy-paste component code manually.
- shadcn components are placed in `packages/ui/src/ui/<component>.tsx`. Hooks go to `packages/ui/src/hooks/`.
- **Post-CLI fixup (required):** After running `shadcn add`, replace `@/utils` imports with `../utils` in the generated files. This is needed because apps transpile the package and don't resolve the `@/` alias.
- After adding, run `pnpm install` if the CLI added new dependencies.
- Domain-specific components (chord-editor, create-song-modal, etc.) stay in `packages/ui/src/` and import shadcn components from `./ui/<component>`.
- Apps import as `import { Button } from "@repo/ui/button"`. Each new shadcn component needs an explicit export entry in `packages/ui/package.json`.
- The `cn()` utility is at `packages/ui/src/utils.ts` (import as `@repo/ui/utils`).
- To preview what a component will look like before adding: `pnpm dlx shadcn@latest add <component> --dry-run -c packages/ui`
- To see the diff against an existing component: `pnpm dlx shadcn@latest add <component> --diff -c packages/ui`

## Dev Setup

```bash
cp .env.dev.example .env.dev
cp apps/web/.env.local.example apps/web/.env.local
cp apps/band/.env.local.example apps/band/.env.local
pnpm install
pnpm dev:db:up
pnpm db:migrate:dev
pnpm db:seed
```
