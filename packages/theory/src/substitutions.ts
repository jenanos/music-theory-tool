import { FUNCTION_GROUPS } from "./data";
import { DiatonicChord, ModeId, SubstitutionSuggestion } from "./types";
import { noteName, parseNoteName, prefersFlatsForKey } from "./utils";

type SubstitutionCategory = SubstitutionSuggestion["category"];

type SlashInfo = {
    type: "none" | "inversion" | "non_chord_bass";
    upperStructure: string;
    bassSymbol?: string;
    bassPc?: number;
};

type ParsedChord = {
    symbol: string;
    root: string;
    rootPc: number;
    body: string;
    tones: number[];
    isSeventhChord: boolean;
};

type SuggestionDraft = {
    symbol: string;
    roman?: string;
    category: SubstitutionCategory;
    tags: Set<string>;
    score: number;
    sharedTones: number;
    requiresContext: boolean;
};

const CATEGORY_BASE_SCORE: Record<SubstitutionCategory, number> = {
    basic: 100,
    spice: 60,
    approach: 40,
};

const CATEGORY_ORDER: Record<SubstitutionCategory, number> = {
    basic: 0,
    spice: 1,
    approach: 2,
};

function normalizeSymbol(symbol: string): string {
    return symbol.trim().replace(/\s+/g, "");
}

function parseRoot(symbol: string): { root: string; rootPc: number } | null {
    const match = symbol.trim().match(/^([A-Ga-g])([b#]?)/);
    if (!match) return null;

    const root = `${match[1]!.toUpperCase()}${match[2] ?? ""}`;
    try {
        return { root, rootPc: parseNoteName(root) };
    } catch {
        return null;
    }
}

function parseChord(symbol: string): ParsedChord | null {
    const normalized = normalizeSymbol(symbol);
    const upper = normalized.split("/")[0] ?? normalized;
    const rootInfo = parseRoot(upper);
    if (!rootInfo) return null;

    const body = upper.replace(/^([A-Ga-g][b#]?)/, "");
    const lower = body.toLowerCase();

    let intervals = [0, 4, 7];
    let isSeventhChord = false;

    if (lower.includes("m7b5") || lower.includes("ø")) {
        intervals = [0, 3, 6, 10];
        isSeventhChord = true;
    } else if (lower.includes("dim7") || lower.includes("°7")) {
        intervals = [0, 3, 6, 9];
        isSeventhChord = true;
    } else if (lower.includes("dim") || lower.includes("°")) {
        intervals = [0, 3, 6];
    } else if (lower.startsWith("m") && !lower.startsWith("maj")) {
        intervals = [0, 3, 7];
        if (lower.includes("7") || lower.includes("9") || lower.includes("11") || lower.includes("13")) {
            intervals = [0, 3, 7, 10];
            isSeventhChord = true;
        }
    } else if (lower.includes("maj7")) {
        intervals = [0, 4, 7, 11];
        isSeventhChord = true;
    } else if (lower.includes("7") || lower.includes("9") || lower.includes("11") || lower.includes("13")) {
        intervals = [0, 4, 7, 10];
        isSeventhChord = true;
    }

    return {
        symbol: normalized,
        root: rootInfo.root,
        rootPc: rootInfo.rootPc,
        body,
        tones: intervals.map((i) => (rootInfo.rootPc + i) % 12),
        isSeventhChord,
    };
}

function countSharedTones(a: number[], b: number[]): number {
    const setB = new Set(b.map((t) => ((t % 12) + 12) % 12));
    return a.filter((t) => setB.has(((t % 12) + 12) % 12)).length;
}

function splitSlash(symbol: string): { upperStructure: string; bass?: string } {
    const normalized = normalizeSymbol(symbol);
    const slashIndex = normalized.indexOf("/");
    if (slashIndex < 0) return { upperStructure: normalized };

    const upperStructure = normalized.slice(0, slashIndex).trim();
    const bass = normalized.slice(slashIndex + 1).trim();
    return { upperStructure, bass: bass || undefined };
}

function analyzeSlash(symbol: string): SlashInfo {
    const { upperStructure, bass } = splitSlash(symbol);
    if (!bass) {
        return { type: "none", upperStructure };
    }

    const upper = parseChord(upperStructure);
    const bassInfo = parseRoot(bass);

    if (!upper || !bassInfo) {
        return { type: "none", upperStructure };
    }

    if (upper.tones.includes(bassInfo.rootPc)) {
        return {
            type: "inversion",
            upperStructure,
            bassSymbol: bassInfo.root,
            bassPc: bassInfo.rootPc,
        };
    }

    return {
        type: "non_chord_bass",
        upperStructure,
        bassSymbol: bassInfo.root,
        bassPc: bassInfo.rootPc,
    };
}

function makeSymbol(rootPc: number, quality: string, useFlats: boolean, forceFlats = false): string {
    const root = noteName(rootPc, forceFlats ? true : useFlats);
    return `${root}${quality}`;
}

function isMajorContext(mode: ModeId): boolean {
    return mode === "ionian" || mode === "lydian" || mode === "mixolydian";
}

function getFunctionGroup(
    mode: ModeId,
    degree: number,
): "tonic" | "predominant" | "dominant" | undefined {
    const groups = FUNCTION_GROUPS[mode] ?? FUNCTION_GROUPS.ionian ?? { tonic: [], predominant: [], dominant: [] };

    if (groups.tonic.includes(degree)) return "tonic";
    if (groups.predominant.includes(degree)) return "predominant";
    if (groups.dominant.includes(degree)) return "dominant";

    return undefined;
}

function buildReason(tags: string[]): string {
    if (tags.length === 0) return "Foreslått substitusjon.";
    if (tags.length === 1) return tags[0]!;
    if (tags.length === 2) return `${tags[0]}, ${tags[1]}.`;
    return `${tags[0]}, ${tags[1]}, ${tags[2]}.`;
}

function inferSharedTones(symbol: string, sourceTones: number[]): number {
    const parsed = parseChord(symbol);
    if (!parsed) return 0;
    return countSharedTones(sourceTones, parsed.tones);
}

function withPreservedBass(
    symbol: string,
    slash: SlashInfo,
    preserveBass: boolean,
): { symbol: string; boost: number; extraTags: string[] } {
    if (!preserveBass || slash.type !== "inversion" || slash.bassPc === undefined || !slash.bassSymbol) {
        return { symbol, boost: 0, extraTags: [] };
    }

    const parsed = parseChord(symbol);
    if (!parsed) {
        return { symbol, boost: 0, extraTags: [] };
    }

    if (parsed.tones.includes(slash.bassPc)) {
        if (parsed.rootPc === slash.bassPc || symbol.includes("/")) {
            return {
                symbol,
                boost: 9,
                extraTags: ["inversion preserved"],
            };
        }

        return {
            symbol: `${symbol}/${slash.bassSymbol}`,
            boost: 11,
            extraTags: ["inversion preserved"],
        };
    }

    const clockwise = (parsed.rootPc - slash.bassPc + 12) % 12;
    const counter = (slash.bassPc - parsed.rootPc + 12) % 12;
    const distance = Math.min(clockwise, counter);

    if (distance <= 2) {
        return {
            symbol,
            boost: 4,
            extraTags: ["stepwise bass"],
        };
    }

    return { symbol, boost: 0, extraTags: [] };
}

function addSuggestion(
    map: Map<string, SuggestionDraft>,
    params: {
        symbol: string;
        roman?: string;
        category: SubstitutionCategory;
        tags: string[];
        sourceTones: number[];
        scoreOffset?: number;
        requiresContext?: boolean;
        sameFunction?: boolean;
        crossFunction?: boolean;
        resolvesToTarget?: boolean;
        slash: SlashInfo;
        preserveBass: boolean;
    },
): void {
    const normalizedSymbol = normalizeSymbol(params.symbol);
    if (!normalizedSymbol) return;

    const bassAdjusted = withPreservedBass(normalizedSymbol, params.slash, params.preserveBass);
    const finalSymbol = bassAdjusted.symbol;
    const sharedTones = inferSharedTones(finalSymbol, params.sourceTones);

    let score = CATEGORY_BASE_SCORE[params.category];
    score += params.scoreOffset ?? 0;
    score += sharedTones * 6;
    score += bassAdjusted.boost;

    if (params.sameFunction) score += 14;
    if (params.crossFunction) score -= 8;
    if (params.resolvesToTarget) score += 16;

    const tags = [...params.tags, ...bassAdjusted.extraTags];

    const key = `${params.category}:${finalSymbol}`;
    const existing = map.get(key);

    if (!existing) {
        map.set(key, {
            symbol: finalSymbol,
            roman: params.roman,
            category: params.category,
            tags: new Set(tags),
            score,
            sharedTones,
            requiresContext: params.requiresContext ?? false,
        });
        return;
    }

    for (const tag of tags) {
        existing.tags.add(tag);
    }

    if (params.roman && !existing.roman) {
        existing.roman = params.roman;
    }

    existing.score = Math.max(existing.score, score);
    existing.sharedTones = Math.max(existing.sharedTones, sharedTones);
    existing.requiresContext = existing.requiresContext || Boolean(params.requiresContext);
}

export function suggestSubstitutions(
    context: {
        tonic: string;
        mode: ModeId;
        chord: DiatonicChord;
        allChords: DiatonicChord[];
        nextChord?: DiatonicChord;
        sourceSymbol?: string;
        preserveBass?: boolean;
        includeSpice?: boolean;
        includeApproach?: boolean;
    },
): SubstitutionSuggestion[] {
    const {
        tonic,
        mode,
        chord,
        allChords,
        nextChord,
        sourceSymbol,
        preserveBass = false,
        includeSpice = true,
    } = context;

    const includeApproach = context.includeApproach ?? Boolean(nextChord);
    const useFlats = prefersFlatsForKey(tonic, mode);
    const tonicPc = parseNoteName(tonic);
    const rootPc = chord.tones[0] ?? tonicPc;

    const sourceParsed = parseChord(sourceSymbol ?? chord.symbol);
    const sourceTones = sourceParsed?.tones ?? chord.tones;
    const sourceDisplaySymbol = normalizeSymbol(sourceSymbol ?? chord.symbol);
    const slash = analyzeSlash(sourceDisplaySymbol);

    const functionGroup = getFunctionGroup(mode, chord.degree);
    const groups = FUNCTION_GROUPS[mode] ?? FUNCTION_GROUPS.ionian ?? { tonic: [], predominant: [], dominant: [] };

    const drafts = new Map<string, SuggestionDraft>();

    // === BASIC: Functional families ===
    if (functionGroup) {
        const family = groups[functionGroup] ?? [];
        for (const degree of family) {
            if (degree === chord.degree) continue;
            const candidate = allChords.find((entry) => entry.degree === degree);
            if (!candidate) continue;

            addSuggestion(drafts, {
                symbol: candidate.symbol,
                roman: candidate.roman,
                category: "basic",
                tags: ["common tones", `${functionGroup} family`],
                sourceTones,
                scoreOffset: 8,
                sameFunction: true,
                slash,
                preserveBass,
            });
        }
    }

    // === BASIC: common-tone within diatonic set ===
    for (const candidate of allChords) {
        if (candidate.degree === chord.degree) continue;

        const shared = countSharedTones(sourceTones, candidate.tones);
        if (shared < 2) continue;

        const candidateGroup = getFunctionGroup(mode, candidate.degree);
        const sameFunction = candidateGroup !== undefined && candidateGroup === functionGroup;

        addSuggestion(drafts, {
            symbol: candidate.symbol,
            roman: candidate.roman,
            category: "basic",
            tags: sameFunction
                ? ["common tones", `${candidateGroup} family`]
                : ["common tones", "cross-function voice-leading"],
            sourceTones,
            scoreOffset: sameFunction ? 10 : 1,
            sameFunction,
            crossFunction: !sameFunction,
            slash,
            preserveBass,
        });
    }

    // === BASIC: richer versions of same harmony ===
    const rootName = noteName(rootPc, useFlats);
    const sourceLower = (sourceSymbol ?? chord.symbol).toLowerCase();
    const sameChordVariants = new Set<string>();

    if (sourceLower.includes("m") && !sourceLower.includes("maj")) {
        sameChordVariants.add(`${rootName}m7`);
        sameChordVariants.add(`${rootName}m9`);
    } else if (sourceLower.includes("7") || functionGroup === "dominant") {
        sameChordVariants.add(`${rootName}7`);
        sameChordVariants.add(`${rootName}9`);
        sameChordVariants.add(`${rootName}13`);
    } else {
        sameChordVariants.add(`${rootName}maj7`);
        sameChordVariants.add(`${rootName}6`);
        sameChordVariants.add(`${rootName}add9`);
    }

    const thirdPc = chord.tones[1];
    if (thirdPc !== undefined) {
        sameChordVariants.add(`${rootName}/${noteName(thirdPc, useFlats)}`);
    }

    for (const variant of sameChordVariants) {
        if (normalizeSymbol(variant) === sourceDisplaySymbol) continue;

        addSuggestion(drafts, {
            symbol: variant,
            roman: chord.roman,
            category: "basic",
            tags: ["same harmony richer voicing"],
            sourceTones,
            scoreOffset: 7,
            sameFunction: true,
            slash,
            preserveBass,
        });
    }

    // === SPICE: modal interchange / color ===
    if (includeSpice) {
        if (isMajorContext(mode)) {
            addSuggestion(drafts, {
                symbol: makeSymbol((tonicPc + 5) % 12, "m7", useFlats),
                roman: "iv7",
                category: "spice",
                tags: ["modal borrow", "predominant color"],
                sourceTones,
                scoreOffset: 2,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol((tonicPc + 10) % 12, "", useFlats, true),
                roman: "bVII",
                category: "spice",
                tags: ["modal borrow", "backdoor color"],
                sourceTones,
                scoreOffset: 1,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol((tonicPc + 8) % 12, "", useFlats, true),
                roman: "bVI",
                category: "spice",
                tags: ["modal borrow"],
                sourceTones,
                scoreOffset: 0,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol((tonicPc + 3) % 12, "", useFlats, true),
                roman: "bIII",
                category: "spice",
                tags: ["modal borrow"],
                sourceTones,
                scoreOffset: -1,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol((tonicPc + 1) % 12, "", useFlats, true),
                roman: "bII",
                category: "spice",
                tags: ["neapolitan color"],
                sourceTones,
                scoreOffset: -2,
                slash,
                preserveBass,
            });
        } else {
            addSuggestion(drafts, {
                symbol: makeSymbol((tonicPc + 5) % 12, "", useFlats),
                roman: "IV",
                category: "spice",
                tags: ["borrowed from parallel major"],
                sourceTones,
                scoreOffset: 1,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol((tonicPc + 1) % 12, "", useFlats, true),
                roman: "bII",
                category: "spice",
                tags: ["neapolitan color"],
                sourceTones,
                scoreOffset: -1,
                slash,
                preserveBass,
            });

            if (mode === "aeolian" && chord.degree === 5) {
                addSuggestion(drafts, {
                    symbol: makeSymbol(rootPc, "7", useFlats),
                    roman: "V7",
                    category: "spice",
                    tags: ["harmonic minor dominant"],
                    sourceTones,
                    scoreOffset: 4,
                    slash,
                    preserveBass,
                });
            }
        }

        if (functionGroup === "dominant") {
            addSuggestion(drafts, {
                symbol: makeSymbol((rootPc + 4) % 12, "dim", useFlats),
                roman: undefined,
                category: "spice",
                tags: ["leading-tone diminished", "dominant substitute"],
                sourceTones,
                scoreOffset: 8,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol((rootPc + 6) % 12, "7", useFlats, true),
                roman: "bII7",
                category: "spice",
                tags: ["tritone sub"],
                sourceTones,
                scoreOffset: 7,
                slash,
                preserveBass,
            });
        }
    }

    // Non-chord slash bass interpretation
    if (slash.type === "non_chord_bass" && slash.bassPc !== undefined && slash.bassSymbol) {
        addSuggestion(drafts, {
            symbol: `${slash.bassSymbol}9sus`,
            roman: undefined,
            category: "spice",
            tags: ["non-chord bass", "upper structure", "sus dominant interpretation"],
            sourceTones,
            scoreOffset: 6,
            slash,
            preserveBass,
        });
    }

    // === APPROACH: target-aware substitutions ===
    if (includeApproach && nextChord) {
        const targetRoot = nextChord.tones[0];
        const targetRoman = nextChord.roman;

        if (targetRoot !== undefined) {
            const dominantRoot = (targetRoot + 7) % 12;
            const leadingToneRoot = (targetRoot + 11) % 12;
            const tritoneRoot = (dominantRoot + 6) % 12;

            addSuggestion(drafts, {
                symbol: makeSymbol(dominantRoot, "7", useFlats),
                roman: `V/${targetRoman}`,
                category: "approach",
                tags: ["secondary dominant", "resolves to target"],
                sourceTones,
                scoreOffset: 12,
                requiresContext: true,
                resolvesToTarget: true,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol(leadingToneRoot, "dim7", useFlats),
                roman: `vii°7/${targetRoman}`,
                category: "approach",
                tags: ["diminished approach", "resolves to target"],
                sourceTones,
                scoreOffset: 8,
                requiresContext: true,
                resolvesToTarget: true,
                slash,
                preserveBass,
            });

            addSuggestion(drafts, {
                symbol: makeSymbol(tritoneRoot, "7", useFlats, true),
                roman: `bII7/${targetRoman}`,
                category: "approach",
                tags: ["tritone sub", "resolves to target"],
                sourceTones,
                scoreOffset: 7,
                requiresContext: true,
                resolvesToTarget: true,
                slash,
                preserveBass,
            });

            if (nextChord.degree === 1) {
                addSuggestion(drafts, {
                    symbol: makeSymbol((targetRoot + 10) % 12, "7", useFlats, true),
                    roman: "bVII7",
                    category: "approach",
                    tags: ["backdoor dominant", "resolves to target"],
                    sourceTones,
                    scoreOffset: 10,
                    requiresContext: true,
                    resolvesToTarget: true,
                    slash,
                    preserveBass,
                });
            }
        }
    }

    const suggestions: SubstitutionSuggestion[] = Array.from(drafts.values())
        .map((draft) => {
            const tags = Array.from(draft.tags);
            tags.sort((a, b) => a.localeCompare(b));

            const requiresContext = draft.category === "approach" || draft.requiresContext;

            return {
                targetSymbol: sourceDisplaySymbol,
                substituteSymbol: draft.symbol,
                symbol: draft.symbol,
                roman: draft.roman,
                category: draft.category,
                tags,
                requiresContext,
                reason: buildReason(tags),
                score: draft.score,
                sharedTones: draft.sharedTones,
                requirements: requiresContext ? ["next chord context"] : [],
            };
        })
        .sort((a, b) => {
            const categoryDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
            if (categoryDiff !== 0) return categoryDiff;
            if (b.score !== a.score) return b.score - a.score;
            return a.substituteSymbol.localeCompare(b.substituteSymbol);
        });

    return suggestions;
}
