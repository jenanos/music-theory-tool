
export interface Section {
    id: string;
    label: string;
    chordLines: string[];
    degreeLines: string[];
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
        id: "kjaerlighed",
        title: "Kjærlighed",
        artist: "Gete",
        key: "Fm",
        notes: "Akkorder er renset til kun akkordnavn. Trinn er analysert relativt til Fm (med lånte/hevete trinn der akkordkvalitet tilsier det).",
        sections: [
            {
                id: "intro",
                label: "Intro",
                chordLines: ["B♭ - Fm"],
                degreeLines: ["IV - i"]
            },
            {
                id: "verse",
                label: "Vers",
                chordLines: ["Fm - B♭", "B♭"],
                degreeLines: ["i - IV", "IV"]
            },
            {
                id: "prechorus",
                label: "Pre-chorus",
                chordLines: ["C7 - Gm", "B♭ - E♭"],
                degreeLines: ["V7 - ii", "IV - ♭VII"]
            },
            {
                id: "chorus",
                label: "Refreng",
                chordLines: ["D♭", "E♭ - D♭ - Fm"],
                degreeLines: ["VI", "♭VII - VI - i"]
            },
            {
                id: "outro",
                label: "Outro",
                chordLines: ["B♭ - Fm"],
                degreeLines: ["IV - i"]
            }
        ],
        arrangement: ["intro", "verse", "prechorus", "chorus", "verse", "prechorus", "chorus", "outro"]
    },

    {
        id: "strekke-armane-ud",
        title: "Strekke armane ud",
        artist: "Gete",
        key: "E dorisk",
        notes: "Analysert som E dorisk. E♭ (♭II) og Cm (♭VI minor) tolkes som lånte akkorder. 'Asus' er standardisert til 'Asus4'.",
        sections: [
            {
                id: "verse",
                label: "Vers",
                chordLines: ["Em - A", "Em - Csus2add6"],
                degreeLines: ["i - IV", "i - ♭VI"]
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "G - Bm - C",
                    "E♭ - Cm - G",
                    "Bm - C",
                    "Am7 - Bm - Em"
                ],
                degreeLines: [
                    "♭III - v - ♭VI",
                    "♭II - ♭VI(m) - ♭III",
                    "v - ♭VI",
                    "iv7 - v - i"
                ]
            },
            {
                id: "bridge",
                label: "Bru",
                chordLines: ["C - Cm - Em - Asus4"],
                degreeLines: ["♭VI - ♭VI(m) - i - IVsus4"]
            },
            {
                id: "verse2",
                label: "Vers 2",
                chordLines: ["Em - A", "Em - Csus2add6"],
                degreeLines: ["i - IV", "i - ♭VI"]
            }
        ],
        arrangement: ["verse", "chorus", "verse2", "chorus", "bridge", "chorus"]
    },

    {
        id: "ide-em",
        title: "Idé Em",
        artist: "Gete",
        key: "Em",
        notes: "Renset bort taktinfo (5/4, 6/4), '%', 'xN', '(riff)', '(4 over 3)' og '??'. 'G(no3)' er skrevet som 'G5'.",
        sections: [
            {
                id: "atmos",
                label: "Atmos-rytme",
                chordLines: ["Em - Em"],
                degreeLines: ["i - i"]
            },
            {
                id: "verse1_atmos",
                label: "Vers del 1 (atmos)",
                chordLines: ["Em - Em - Em - Em"],
                degreeLines: ["i - i - i - i"]
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "Cmaj7 - G/B - B/D♯ - Em",
                    "Cmaj7 - G/B - B/D♯ - Em"
                ],
                degreeLines: [
                    "VImaj7 - III6 - V6 - i",
                    "VImaj7 - III6 - V6 - i"
                ]
            },
            {
                id: "riff",
                label: "Riff (groove)",
                chordLines: ["Em - Em - Em - Em"],
                degreeLines: ["i - i - i - i"]
            },
            {
                id: "verse1_short",
                label: "Vers del 1 (korte toner)",
                chordLines: [
                    "Em - Em - Em - Em",
                    "E♭ - Cm - G",
                    "E♭ - Cm - G"
                ],
                degreeLines: [
                    "i - i - i - i",
                    "♭I - vi - III",
                    "♭I - vi - III"
                ]
            },
            {
                id: "verse2_long",
                label: "Vers del 2 (lange toner)",
                chordLines: [
                    "Am - Am - F - F",
                    "Dm - Dm - Gsus4 - G",
                    "Am - Am - F - F",
                    "Dm - Dm - G5 - B/D♯"
                ],
                degreeLines: [
                    "iv - iv - ♭II - ♭II",
                    "♭vii - ♭vii - III - III",
                    "iv - iv - ♭II - ♭II",
                    "♭vii - ♭vii - III - V6"
                ]
            },
            {
                id: "verse1_short_variant",
                label: "Vers del 1 (korte toner) – variant",
                chordLines: [
                    "Em - Em - Em - Em",
                    "E♭ - Cm - Gsus4 - G"
                ],
                degreeLines: [
                    "i - i - i - i",
                    "♭I - vi - III - III"
                ]
            }
        ],
        arrangement: ["atmos", "verse1_atmos", "chorus", "riff", "verse1_short", "verse2_long", "chorus", "riff"]
    },

    {
        id: "det-e-di-tid",
        title: "Det e di tid",
        artist: "Gete",
        key: "Em",
        notes: "Renset bort '(riff)', '(som ...)' og '%'. 'B/D# (no3)' er skrevet som 'B/D♯'.",
        sections: [
            {
                id: "intro",
                label: "Introriff",
                chordLines: ["Em - C - Am"],
                degreeLines: ["i - VI - iv"]
            },
            {
                id: "verse",
                label: "Vers",
                chordLines: ["Em - G - C - Am"],
                degreeLines: ["i - III - VI - iv"]
            },
            {
                id: "prechorus",
                label: "Pre-ref",
                chordLines: [
                    "C - C - Am - D - C - C - Em - Am - D",
                    "C - C - Am - D - C - C - Bm - A - Bm"
                ],
                degreeLines: [
                    "VI - VI - iv - ♭VII - VI - VI - i - iv - ♭VII",
                    "VI - VI - iv - ♭VII - VI - VI - v - IV - v"
                ]
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "Em - D - Am - C - Am",
                    "Em - D - Am - C - D",
                    "Em - D - Am - D - B/D♯"
                ],
                degreeLines: [
                    "i - ♭VII - iv - VI - iv",
                    "i - ♭VII - iv - VI - ♭VII",
                    "i - ♭VII - iv - ♭VII - V6"
                ]
            },
            {
                id: "riff",
                label: "Riff",
                chordLines: ["Em - C - Am"],
                degreeLines: ["i - VI - iv"]
            },
            {
                id: "bridge",
                label: "Bro",
                chordLines: [
                    "C - B/D♯ - Em - A/C♯",
                    "C - B/D♯ - Em - A/C♯"
                ],
                degreeLines: [
                    "VI - V6 - i - IV6",
                    "VI - V6 - i - IV6"
                ]
            },
            {
                id: "outro",
                label: "Outro",
                chordLines: ["Em - C - Am"],
                degreeLines: ["i - VI - iv"]
            }
        ],
        arrangement: ["intro", "verse", "prechorus", "chorus", "verse", "prechorus", "chorus", "bridge", "prechorus", "chorus", "outro"]
    },

    {
        id: "slow-rock",
        title: "Slow rock",
        artist: "Gete",
        key: "G",
        notes: "Bygget fra arket: '%' er utvidet til faktisk akkord, og 'x2' er representert ved at linjen står to ganger. :contentReference[oaicite:4]{index=4}",
        sections: [
            {
                id: "intro",
                label: "Introriff",
                chordLines: ["G - G - D - D - Am - C - G - D"],
                degreeLines: ["I - I - V - V - ii - IV - I - V"]
            },
            {
                id: "verse",
                label: "Vers",
                chordLines: ["G - G - D - D - Am - C - G - D"],
                degreeLines: ["I - I - V - V - ii - IV - I - V"]
            },
            {
                id: "prechorus",
                label: "Pre-ref",
                chordLines: ["C - C - G - D", "C - C - Em - D"],
                degreeLines: ["IV - IV - I - V", "IV - IV - vi - V"]
            },
            {
                id: "chorus",
                label: "Ref",
                chordLines: [
                    "G - G - D - D - Am - Am - Em - D",
                    "G - G - D - D - Am - Am - Em - D"
                ],
                degreeLines: [
                    "I - I - V - V - ii - ii - vi - V",
                    "I - I - V - V - ii - ii - vi - V"
                ]
            },
            {
                id: "interlude",
                label: "Kort mellomspill",
                chordLines: ["G"],
                degreeLines: ["I"]
            },
            {
                id: "bridge",
                label: "Bro",
                chordLines: [
                    "Am - C - Em - D",
                    "Am - C - Em - D",
                    "Am - C/A - Em/A - D/A",
                    "Am - C - Em - D",
                    "Am - C - Em - D"
                ],
                degreeLines: [
                    "ii - IV - vi - V",
                    "ii - IV - vi - V",
                    "ii - IV - vi - V6/4",
                    "ii - IV - vi - V",
                    "ii - IV - vi - V"
                ]
            },
            {
                id: "outro",
                label: "Outro",
                chordLines: ["Am - C - Em - D", "Am - C - Em - D"],
                degreeLines: ["ii - IV - vi - V", "ii - IV - vi - V"]
            }
        ],
        arrangement: ["intro", "verse", "prechorus", "chorus", "interlude", "verse", "prechorus", "chorus", "bridge", "chorus", "outro"]
    }
];
