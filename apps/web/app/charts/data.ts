
export interface Section {
    id: string;
    label: string;
    chordLines: string[];
}

export interface Song {
    id: string;
    title: string;
    artist?: string;
    key?: string;
    sections: Section[];
    arrangement: string[];
    notes?: string;
}

export const initialSongs: Song[] = [
    {
        "id": "kjaerlighed",
        "title": "Kjærlighed",
        "artist": "Margrete Wilhelmsen (Gete)",
        "key": "Fm",
        "sections": [
            { "id": "intro", "label": "Intro", "chordLines": ["B♭ - Fm"] },
            { "id": "verse", "label": "Vers", "chordLines": ["Fm - B♭", "B♭"] },
            { "id": "prechorus", "label": "Pre-chorus", "chordLines": ["C7 - Gm", "B♭ - E♭"] },
            { "id": "chorus", "label": "Refreng", "chordLines": ["D♭", "E♭ - D♭ - Fm"] },
            { "id": "outro", "label": "Outro", "chordLines": ["B♭ - Fm"] }
        ],
        "arrangement": ["intro", "verse", "prechorus", "chorus", "verse", "prechorus", "chorus", "outro"]
    },
    {
        "id": "strekke-armane-ud",
        "title": "Strekke armane ud",
        "key": "Em",
        "sections": [
            { "id": "verse", "label": "Vers", "chordLines": ["Em - A", "Em - Csus2(6)"] },
            {
                "id": "chorus",
                "label": "Ref",
                "chordLines": [
                    "G - Bm - C",
                    "Eb? - Cm - G",
                    "Bm - C (eller F - Em)",
                    "Am7 - Bm - Em"
                ]
            },
            { "id": "bridge", "label": "Bru", "chordLines": ["C - Cm - Em - Asus"] },
            { "id": "verse2", "label": "Vers 2", "chordLines": ["(samme som Vers)"] }
        ],
        "arrangement": ["verse", "chorus", "verse2", "chorus", "bridge", "chorus"]
    },
    {
        "id": "ide-em",
        "title": "Idé Em",
        "key": "Em",
        "sections": [
            { "id": "atmos", "label": "Atmos-rytme", "chordLines": ["Em"] },
            { "id": "verse1_atmos", "label": "Vers del 1 (atmos)", "chordLines": ["Em (x4)"] },
            {
                "id": "chorus",
                "label": "Ref",
                "chordLines": [
                    "5/4 Cmaj7 - G/B - 6/4 B/D# - Em",
                    "5/4 Cmaj7 - G/B - 6/4 B/D# - Em"
                ]
            },
            { "id": "riff", "label": "Riff (groove)", "chordLines": ["4/4 Em (x4)"] },
            {
                "id": "verse1_short",
                "label": "Vers del 1 (korte toner)",
                "chordLines": [
                    "Em (x4)",
                    "Eb - Cm - G (x2)"
                ]
            },
            {
                "id": "verse2_long",
                "label": "Vers del 2 (lange toner)",
                "chordLines": [
                    "Am - F",
                    "Dm - Gsus4 - G",
                    "Am - F",
                    "Dm - G(no3) - B/D# (riff)"
                ]
            },
            {
                "id": "verse1_short_variant",
                "label": "Vers del 1 (korte toner) – variant",
                "chordLines": [
                    "Em (x4)",
                    "Eb - Cm - Gsus4 - G (4 over 3)"
                ]
            },
            { "id": "unknown", "label": "Uavklart", "chordLines": ["??"] }
        ],
        "arrangement": ["atmos", "verse1_atmos", "chorus", "riff", "verse1_short", "verse2_long", "chorus", "riff"]
    },
    {
        "id": "det-e-di-tid",
        "title": "Det e di tid",
        "key": "Em",
        "sections": [
            { "id": "intro", "label": "Introriff", "chordLines": ["Em - C - Am"] },
            { "id": "verse", "label": "Vers", "chordLines": ["Em - G - C - Am (riff)"] },
            {
                "id": "prechorus",
                "label": "Pre-ref",
                "chordLines": [
                    "C - Am - D - C - Em - Am - D",
                    "C - Am - D - C - Bm - A - Bm"
                ]
            },
            {
                "id": "chorus",
                "label": "Ref",
                "chordLines": [
                    "Em - D - Am - C - Am",
                    "Em - D - Am - C - D",
                    "Em - D - Am - D - B/D# (no3)"
                ]
            },
            { "id": "riff", "label": "Riff", "chordLines": ["(som Introriff)"] },
            {
                "id": "bridge",
                "label": "Bro (forslag)",
                "chordLines": [
                    "C - B/D# (no3) - Em - A/C#",
                    "C - B/D# (no3) - Em - A/C#"
                ]
            },
            { "id": "outro", "label": "Outro", "chordLines": ["(som Introriff)"] }
        ],
        "arrangement": ["intro", "verse", "prechorus", "chorus", "verse", "prechorus", "chorus", "bridge", "prechorus", "chorus", "outro"]
    }
];
