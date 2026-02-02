
import {
    SUBSTITUTION_RULES,
    SCORING_WEIGHTS,
    CHORD_QUALITIES,
    FUNCTION_GROUPS,
    MODES,
    type SubstitutionRule
} from "./data.js";
import { DiatonicChord, SubstitutionSuggestion, ModeId } from "./types.js";
import { parseNoteName, noteName, prefersFlats } from "./utils.js";

// Helper to determine chord intervals from quality string
function getQualityIntervals(quality: string): number[] {
    // Check exact match
    if (quality in CHORD_QUALITIES) return [...CHORD_QUALITIES[quality as keyof typeof CHORD_QUALITIES]];

    // Fallbacks
    if (quality === "maj" || quality === "") return [0, 4, 7];
    if (quality === "m") return [0, 3, 7];
    if (quality === "dim") return [0, 3, 6];
    if (quality === "aug") return [0, 4, 8];

    // Default to major triad
    return [0, 4, 7];
}

function getChordTones(rootPc: number, quality: string): number[] {
    const intervals = getQualityIntervals(quality);
    return intervals.map((i: number) => (rootPc + i) % 12);
}

function countSharedTones(tones1: number[], tones2: number[]): number {
    const set2 = new Set(tones2.map(t => t % 12));
    return tones1.filter(t => set2.has(t % 12)).length;
}

// Global helper to create candidate
function createCandidate(
    rootPc: number,
    quality: string,
    useFlats: boolean,
    rule: SubstitutionRule,
    originalChordTones: number[],
    baseScore: number,
    details: { targetChord?: string }
): SubstitutionSuggestion {
    const rootNote = noteName(rootPc, useFlats);
    let symbol = rootNote;

    // Formatting logic
    if (quality === "maj7") symbol += "maj7";
    else if (quality === "m7") symbol += "m7";
    else if (quality === "7") symbol += "7";
    else if (quality === "m7b5") symbol += "m7b5";
    else if (quality === "dim7") symbol += "dim7";
    else if (quality === "m" || quality === "minor") symbol += "m";
    else if (quality === "dim") symbol += "dim";
    else if (quality === "aug") symbol += "aug";
    else if (quality !== "maj" && quality !== "") symbol += quality;

    const candidateTones = getChordTones(rootPc, quality);
    const shared = countSharedTones(originalChordTones, candidateTones);

    let score = baseScore;
    score += shared * SCORING_WEIGHTS.shared_tones;

    const explanation = rule.explain_template
        .replace("{shared}", shared.toString())
        .replace("{targetRoman}", details.targetChord || "target")
        .replace("{targetChord}", details.targetChord || "");

    return {
        targetSymbol: "",
        substituteSymbol: symbol,
        category: rule.category,
        reason: explanation,
        score,
        sharedTones: shared,
        requirements: []
    };
}

export function suggestSubstitutions(
    context: {
        tonic: string;
        mode: ModeId;
        chord: DiatonicChord;
        allChords: DiatonicChord[];
        nextChord?: DiatonicChord;
    }
): SubstitutionSuggestion[] {
    const { tonic, mode, chord, allChords, nextChord } = context;
    const tonicPc = parseNoteName(tonic);
    const useFlats = prefersFlats(tonic);
    const suggestions: SubstitutionSuggestion[] = [];

    for (const rule of SUBSTITUTION_RULES) {
        const when = rule.when;

        // if (when.scope === "diatonic") { }

        if (when.mode_is && when.mode_is !== mode) continue;
        if (when.degree_is && when.degree_is !== chord.degree) continue;
        if (when.function_is && when.function_is !== chord.function) continue;

        if (when.quality_in) {
            let matchesQuality = false;
            for (const q of when.quality_in) {
                if (chord.symbol.endsWith(q) || chord.quality === q) matchesQuality = true;
                if (q === "7" && (chord.symbol.includes("maj7") || chord.symbol.includes("m7"))) matchesQuality = false;
                if (q === "7" && chord.quality === "dominant") matchesQuality = true;
            }
            if (!matchesQuality) continue;
        }

        if (when.target_degree_not_in) {
            if (when.target_degree_not_in.includes(chord.degree)) continue;
        }

        if (when.has_next_chord && !nextChord) continue;

        if (when.resolves_to_degree && nextChord) {
            if (nextChord.degree !== when.resolves_to_degree) continue;
        } else if (when.resolves_to_degree) {
            // Requirement but no next chord known -> assume we can't apply
            continue;
        }

        // === Generate Suggestions (OP) ===
        const op = rule.generate.op;

        if (op === "swap_degree_within_same_function_group") {
            // Find chords in same function group
            const groupMap = FUNCTION_GROUPS[mode] || FUNCTION_GROUPS.ionian;
            if (!groupMap) continue;

            let functionType: "tonic" | "predominant" | "dominant" | undefined;

            if (groupMap.tonic.includes(chord.degree)) functionType = "tonic";
            else if (groupMap.predominant.includes(chord.degree)) functionType = "predominant";
            else if (groupMap.dominant.includes(chord.degree)) functionType = "dominant";

            if (functionType) {
                const candidates = groupMap[functionType];
                for (const deg of candidates) {
                    if (deg === chord.degree) continue;

                    const candidateChord = allChords.find(c => c.degree === deg);
                    if (!candidateChord) continue;

                    // Use the candidate chord's known symbol/tones
                    const shared = countSharedTones(chord.tones, candidateChord.tones);
                    if (when.min_shared_tones && shared < when.min_shared_tones) continue;

                    // Calculate score
                    let score = SCORING_WEIGHTS.diatonic_bonus;
                    score += shared * SCORING_WEIGHTS.shared_tones;

                    suggestions.push({
                        targetSymbol: chord.symbol,
                        substituteSymbol: candidateChord.symbol,
                        category: rule.category,
                        reason: rule.explain_template.replace("{shared}", shared.toString()),
                        score,
                        sharedTones: shared,
                        requirements: []
                    });
                }
            }
        }

        else if (op === "make_V7_of_target_degree") {
            if (nextChord) {
                const nextRoot = nextChord.tones[0];
                if (nextRoot !== undefined && chord.tones[0] !== undefined) {
                    // Calc V7 of Next
                    // const domRoot = (nextRoot + 7) % 12;

                    // Check if current chord root is same as dom root? 
                    if ((chord.tones[0] - nextRoot + 12) % 12 === 7) {
                        // Current is V of next.
                        const sub = createCandidate(chord.tones[0], "7", useFlats, rule, chord.tones, 2.0, {
                            targetChord: nextChord.symbol
                        });
                        suggestions.push(sub);
                    }
                }
            }
        }

        else if (op === "make_vii_dim7_of_target_degree") {
            if (nextChord) {
                const nextRoot = nextChord.tones[0];
                if (nextRoot !== undefined) {
                    const dimRoot = (nextRoot - 1 + 12) % 12;
                    const sub = createCandidate(dimRoot, "dim7", useFlats, rule, chord.tones, 1.0, {
                        targetChord: nextChord.symbol
                    });
                    suggestions.push(sub);
                }
            }
        }

        else if (op === "tritone_substitute_dominant7") {
            const root = chord.tones[0];
            if (root !== undefined) {
                const subRoot = (root + 6) % 12;
                const sub = createCandidate(subRoot, "7", useFlats, rule, chord.tones, 2.0, {});
                suggestions.push(sub);
            }
        }

        else if (op === "make_bVII7_to_I") {
            if (nextChord && nextChord.degree === 1) {
                const nextRoot = nextChord.tones[0];
                if (nextRoot !== undefined) {
                    const subRoot = (nextRoot + 10) % 12;
                    const sub = createCandidate(subRoot, "7", useFlats, rule, chord.tones, 2.0, {
                        targetChord: nextChord.symbol
                    });
                    suggestions.push(sub);
                }
            } else if (chord.function === "dominant") {
                const tonicRoot = parseNoteName(tonic);
                const subRoot = (tonicRoot + 10) % 12;
                const sub = createCandidate(subRoot, "7", useFlats, rule, chord.tones, 1.5, {
                    targetChord: "I"
                });
                suggestions.push(sub);
            }
        }

        else if (op === "borrow_from_parallel_aeolian") {
            if (rule.generate.borrow_degree) {
                const aeolianMode = MODES["aeolian"];
                if (aeolianMode) {
                    const aeolianIntervals = aeolianMode.intervals;
                    const degIndex = rule.generate.borrow_degree - 1;
                    const interval = aeolianIntervals[degIndex];
                    if (interval !== undefined) {
                        const subRoot = (tonicPc + interval) % 12;
                        const quality = rule.generate.borrow_quality || "m7";

                        const sub = createCandidate(subRoot, quality, useFlats, rule, chord.tones, SCORING_WEIGHTS.borrowed_penalty, {});
                        suggestions.push(sub);
                    }
                }
            }
        }

        else if (op === "replace_with_V7_harmonic_minor") {
            const root = chord.tones[0];
            if (root !== undefined) {
                const sub = createCandidate(root, "7", useFlats, rule, chord.tones, 1.0, {});
                suggestions.push(sub);
            }
        }

        else if (op === "dim7_approach_to_next_root" || op === "diminished_approach_up_semitone") {
            if (nextChord) {
                const nextRoot = nextChord.tones[0];
                if (nextRoot !== undefined) {
                    const subRoot = (nextRoot - 1 + 12) % 12;
                    const sub = createCandidate(subRoot, "dim7", useFlats, rule, chord.tones, 0, { targetChord: nextChord.symbol });
                    suggestions.push(sub);
                }
            }
        }
    }

    // Deduplicate
    const unique = new Map<string, SubstitutionSuggestion>();
    for (const s of suggestions) {
        if (!unique.has(s.substituteSymbol)) {
            unique.set(s.substituteSymbol, s);
        } else {
            if (s.score > unique.get(s.substituteSymbol)!.score) {
                unique.set(s.substituteSymbol, s);
            }
        }
    }

    return Array.from(unique.values()).sort((a, b) => b.score - a.score);
}
