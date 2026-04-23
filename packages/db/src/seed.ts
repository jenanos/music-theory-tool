/**
 * Seed script to populate the database with initial data from the hardcoded songs.
 * Run with: pnpm db:seed
 */

import { prisma } from "./client";

// Initial songs data (migrated from apps/web/app/charts/data.ts)
const initialSongs = [
    {
        id: "kjaerlighed",
        title: "Kjærlighed",
        artist: "Gete",
        key: "Fm",
        sections: [
            {
                id: "intro",
                label: "Intro",
                chordLines: ["B♭ - Fm"],
                degreeLines: ["IV - i"],
            },
            {
                id: "verse",
                label: "Vers",
                chordLines: ["Fm - B♭", "B♭"],
                degreeLines: ["i - IV", "IV"],
            },
            {
                id: "prechorus",
                label: "Pre-chorus",
                chordLines: ["C7 - Gm", "B♭ - E♭"],
                degreeLines: ["V7 - ii", "IV - ♭VII"],
            },
            {
                id: "chorus",
                label: "Refreng",
                chordLines: ["D♭", "E♭ - D♭ - Fm"],
                degreeLines: ["VI", "♭VII - VI - i"],
            },
            {
                id: "outro",
                label: "Outro",
                chordLines: ["B♭ - Fm"],
                degreeLines: ["IV - i"],
            },
        ],
        arrangement: [
            "intro",
            "verse",
            "prechorus",
            "chorus",
            "verse",
            "prechorus",
            "chorus",
            "outro",
        ],
    },
    {
        id: "strekke-armane-ud",
        title: "Strekke armane ud",
        artist: "Gete",
        key: "E dorisk",
        notes: "Analysert som E dorisk. E♭ og Cm tolkes som lånte akkorder.",
        sections: [
            {
                id: "verse",
                label: "Vers",
                chordLines: ["Em - A", "Em - Csus2add6"],
                degreeLines: ["i - IV", "i - ♭VI"],
                notes: "I arket står Csus2(6) → skrevet som Csus2add6.",
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "G - Bm - C",
                    "E♭ - Cm - G",
                    "Bm - C",
                    "Am7 - Bm - Em",
                ],
                degreeLines: [
                    "♭III - v - ♭VI",
                    "♭II - ♭vi - ♭III",
                    "v - ♭VI",
                    "iv7 - v - i",
                ],
                notes:
                    "I arket står 'E♭?' (usikkert) → satt til E♭. Linje 3 har alternativ: 'Bm - C (eller F - Em)'.",
            },
            {
                id: "bridge",
                label: "Bru",
                chordLines: ["C - Cm - Em - Asus4"],
                degreeLines: ["♭VI - ♭vi - i - IVsus4"],
                notes: "I arket står 'Asus' → standardisert til Asus4.",
            },
            {
                id: "verse2",
                label: "Vers 2",
                chordLines: ["Em - A", "Em - Csus2add6"],
                degreeLines: ["i - IV", "i - ♭VI"],
                notes: "I arket står: '(samme som Vers)'.",
            },
        ],
        arrangement: ["verse", "chorus", "verse2", "chorus", "bridge", "chorus"],
    },
    {
        id: "ide-em",
        title: "Idé Em",
        artist: "Gete",
        key: "Em",
        notes:
            "Renset bort takt-/repeat-info fra chordLines og lagt det i seksjonsnotater. 'G(no3)' → 'G5'.",
        sections: [
            {
                id: "atmos",
                label: "Atmos-rytme",
                chordLines: ["Em"],
                degreeLines: ["i"],
            },
            {
                id: "verse1_atmos",
                label: "Vers del 1 (atmos)",
                chordLines: ["Em - Em - Em - Em"],
                degreeLines: ["i - i - i - i"],
                notes: "Original notat: 'Em (x4)'.",
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "Cmaj7 - G/B - B/D♯ - Em",
                    "Cmaj7 - G/B - B/D♯ - Em",
                ],
                degreeLines: ["VImaj7 - III6 - V6 - i", "VImaj7 - III6 - V6 - i"],
                notes:
                    "Original notat med taktskifte/antall slag: '5/4 Cmaj7 - G/B - 6/4 B/D# - Em' (gjentas).",
            },
            {
                id: "riff",
                label: "Riff (groove)",
                chordLines: ["Em - Em - Em - Em"],
                degreeLines: ["i - i - i - i"],
                notes: "Original notat: '4/4 Em (x4)'.",
            },
            {
                id: "verse1_short",
                label: "Vers del 1 (korte toner)",
                chordLines: ["Em - Em - Em - Em", "E♭ - Cm - G", "E♭ - Cm - G"],
                degreeLines: ["i - i - i - i", "♭I - vi - III", "♭I - vi - III"],
                notes: "Original notat: 'Em (x4)' og 'E♭ - Cm - G (x2)'.",
            },
            {
                id: "verse2_long",
                label: "Vers del 2 (lange toner)",
                chordLines: [
                    "Am - F",
                    "Dm - Gsus4 - G",
                    "Am - F",
                    "Dm - G5 - B/D♯",
                ],
                degreeLines: [
                    "iv - ♭II",
                    "♭vii - III - III",
                    "iv - ♭II",
                    "♭vii - III - V6",
                ],
                notes:
                    "Original notat: siste linje hadde 'G(no3) - B/D# (riff)'. 'G(no3)' → 'G5'.",
            },
            {
                id: "verse1_short_variant",
                label: "Vers del 1 (korte toner) – variant",
                chordLines: ["Em - Em - Em - Em", "E♭ - Cm - Gsus4 - G"],
                degreeLines: ["i - i - i - i", "♭I - vi - III - III"],
                notes: "Original notat: '(4 over 3)'.",
            },
        ],
        arrangement: [
            "atmos",
            "verse1_atmos",
            "chorus",
            "riff",
            "verse1_short",
            "verse2_long",
            "chorus",
            "riff",
        ],
    },
    {
        id: "det-e-di-tid",
        title: "Det e di tid",
        artist: "Gete",
        key: "Em",
        sections: [
            {
                id: "intro",
                label: "Introriff",
                chordLines: ["Em - C - Am"],
                degreeLines: ["i - VI - iv"],
            },
            {
                id: "verse",
                label: "Vers",
                chordLines: ["Em - G - C - Am"],
                degreeLines: ["i - III - VI - iv"],
                notes: "Original notat: '(riff)'.",
            },
            {
                id: "prechorus",
                label: "Pre-ref",
                chordLines: [
                    "C - Am - D - C - Em - Am - D",
                    "C - Am - D - C - Bm - A - Bm",
                ],
                degreeLines: [
                    "VI - iv - ♭VII - VI - i - iv - ♭VII",
                    "VI - iv - ♭VII - VI - v - IV - v",
                ],
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "Em - D - Am - C - Am",
                    "Em - D - Am - C - D",
                    "Em - D - Am - D - B/D♯",
                ],
                degreeLines: [
                    "i - ♭VII - iv - VI - iv",
                    "i - ♭VII - iv - VI - ♭VII",
                    "i - ♭VII - iv - ♭VII - V6",
                ],
                notes: "Original notat: 'B/D# (no3)'. Beholdt som B/D♯.",
            },
            {
                id: "riff",
                label: "Riff",
                chordLines: ["Em - C - Am"],
                degreeLines: ["i - VI - iv"],
                notes: "Original notat: '(som Introriff)'.",
            },
            {
                id: "bridge",
                label: "Bro",
                chordLines: ["C - B/D♯ - Em - A/C♯", "C - B/D♯ - Em - A/C♯"],
                degreeLines: ["VI - V6 - i - IV6", "VI - V6 - i - IV6"],
                notes: "Original label: 'Bro (forslag)'.",
            },
            {
                id: "outro",
                label: "Outro",
                chordLines: ["Em - C - Am"],
                degreeLines: ["i - VI - iv"],
                notes: "Original notat: '(som Introriff)'.",
            },
        ],
        arrangement: [
            "intro",
            "verse",
            "prechorus",
            "chorus",
            "verse",
            "prechorus",
            "chorus",
            "bridge",
            "prechorus",
            "chorus",
            "outro",
        ],
    },
    {
        id: "slow-rock",
        title: "Slow rock",
        artist: "Gete",
        key: "G",
        notes:
            "I originalarket betyr % 'repeter forrige akkord', og 'x2' betyr gjenta linjen. Her er alt ekspandert i chordLines, og infoen ligger som notater.",
        sections: [
            {
                id: "intro",
                label: "Introriff",
                chordLines: ["G - G - D - D - Am - C - G - D"],
                degreeLines: ["I - I - V - V - ii - IV - I - V"],
                notes: "Original notasjon brukte % (repeter forrige).",
            },
            {
                id: "verse",
                label: "Vers",
                chordLines: ["G - G - D - D - Am - C - G - D"],
                degreeLines: ["I - I - V - V - ii - IV - I - V"],
            },
            {
                id: "prechorus",
                label: "Pre-ref",
                chordLines: ["C - C - G - D", "C - C - Em - D"],
                degreeLines: ["IV - IV - I - V", "IV - IV - vi - V"],
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "G - G - D - D - Am - Am - Em - D",
                    "G - G - D - D - Am - Am - Em - D",
                ],
                degreeLines: [
                    "I - I - V - V - ii - ii - vi - V",
                    "I - I - V - V - ii - ii - vi - V",
                ],
                notes: "Original notasjon: linjen merket x2.",
            },
            {
                id: "interlude",
                label: "Kort mellomspill",
                chordLines: ["G"],
                degreeLines: ["I"],
            },
            {
                id: "bridge",
                label: "Bro",
                chordLines: [
                    "Am - C - Em - D",
                    "Am - C - Em - D",
                    "Am - C/A - Em/A - D/A",
                    "Am - C - Em - D",
                    "Am - C - Em - D",
                ],
                degreeLines: [
                    "ii - IV - vi - V",
                    "ii - IV - vi - V",
                    "ii - IV - vi - V",
                    "ii - IV - vi - V",
                    "ii - IV - vi - V",
                ],
                notes:
                    "Slash-akkorder på A indikerer basslinje/pedal på A i den linja.",
            },
            {
                id: "outro",
                label: "Outro",
                chordLines: ["Am - C - Em - D", "Am - C - Em - D"],
                degreeLines: ["ii - IV - vi - V", "ii - IV - vi - V"],
            },
        ],
        arrangement: [
            "intro",
            "verse",
            "prechorus",
            "chorus",
            "interlude",
            "verse",
            "prechorus",
            "chorus",
            "bridge",
            "chorus",
            "outro",
        ],
    },
];

async function seed() {
    const seedOnlyIfEmpty = process.argv.includes("--if-empty");
    console.log("🌱 Seeding database...");

    if (seedOnlyIfEmpty) {
        const existingSongs = await prisma.song.count();
        if (existingSongs > 0) {
            console.log("⏭️  Seed skipped (songs table already has data).");
            await prisma.$disconnect();
            process.exit(0);
        }
    }

    // Seed admin user. Prefer ADMIN_EMAIL (same var bootstrap-admin uses
    // in prod and the signIn callback uses to gate access). Falls back to
    // the legacy DEV_ADMIN_EMAIL for backwards compat, then a placeholder.
    const adminEmail =
        [process.env.ADMIN_EMAIL, process.env.DEV_ADMIN_EMAIL, "dev@example.com"]
            .map((email) => email?.trim())
            .find((email) => email)
            ?.toLowerCase() ?? "dev@example.com";
    console.log(`  Upserting admin user: ${adminEmail}`);
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: "admin" },
        create: {
            email: adminEmail,
            name: "Admin",
            role: "admin",
        },
    });

    // Seed a default group ("Bandet")
    console.log("  Upserting default group: Bandet");
    let group = await prisma.group.findFirst({ where: { name: "Bandet" } });
    if (!group) {
        group = await prisma.group.create({
            data: {
                name: "Bandet",
                members: {
                    create: {
                        userId: adminUser.id,
                        role: "admin",
                    },
                },
            },
        });
    }

    await prisma.$transaction(async (tx) => {
        console.log("  Clearing existing data...");
        await tx.section.deleteMany();
        await tx.song.deleteMany();
        await tx.originalSection.deleteMany();
        await tx.originalSong.deleteMany();

        for (const song of initialSongs) {
            console.log(`  Adding song: ${song.title}`);

            const songData = {
                id: song.id,
                title: song.title,
                artist: song.artist ?? null,
                key: song.key ?? null,
                notes: song.notes ?? null,
                arrangement: song.arrangement ?? [],
            };

            await tx.song.create({
                data: {
                    ...songData,
                    visibility: "shared",
                    userId: adminUser.id,
                },
            });
            await tx.originalSong.create({ data: songData });

            if (song.sections.length > 0) {
                await tx.section.createMany({
                    data: song.sections.map((section, index) => ({
                        id: `${song.id}-${section.id}`,
                        songId: song.id,
                        label: section.label,
                        chordLines: section.chordLines ?? [],
                        degreeLines: section.degreeLines ?? [],
                        notes: section.notes ?? null,
                        orderIndex: index,
                    })),
                });

                await tx.originalSection.createMany({
                    data: song.sections.map((section, index) => ({
                        id: `${song.id}-${section.id}`,
                        songId: song.id,
                        label: section.label,
                        chordLines: section.chordLines ?? [],
                        degreeLines: section.degreeLines ?? [],
                        notes: section.notes ?? null,
                        orderIndex: index,
                    })),
                });
            }
        }
    });

    console.log("✅ Seeding complete!");
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await prisma.$disconnect();
    process.exit(1);
});
