import { parseNoteName } from "./utils";
import type {
    ChordBaseQuality,
    ChordExtensionToken,
    ChordRichnessProfile,
    ChordSeventhType,
    ChordVariantOption,
} from "./types";

export const DEFAULT_CHORD_RICHNESS_PROFILE: ChordRichnessProfile = "seventh";

const EXTENSION_ORDER: ChordExtensionToken[] = [
    "6",
    "add9",
    "9",
    "11",
    "13",
    "sus2",
    "sus4",
    "b9",
    "#9",
    "#11",
    "b13",
];

const ALTERATIONS = ["b9", "#9", "#11", "b13"] as const;

export interface ParsedChordSymbol {
    original: string;
    normalized: string;
    root: string;
    rootPc: number;
    letter: string;
    body: string;
    baseQuality: ChordBaseQuality;
    seventhType: ChordSeventhType;
    extensions: ChordExtensionToken[];
    slashBass?: string;
    slashBassPc?: number;
}

export interface GenerateChordVariantsOptions {
    baseSymbol: string;
    profile: ChordRichnessProfile;
    roman?: string;
    useSpice?: boolean;
    maxVariants?: number;
}

function sortExtensions(values: Set<ChordExtensionToken>): ChordExtensionToken[] {
    return Array.from(values).sort(
        (a, b) => EXTENSION_ORDER.indexOf(a) - EXTENSION_ORDER.indexOf(b),
    );
}

function parseRootToken(token: string): { root: string; rootPc: number; letter: string; rest: string } | null {
    const match = token.match(/^([A-Ga-g])([b#]?)(.*)$/);
    if (!match) return null;

    const letter = match[1]!.toUpperCase();
    const accidental = match[2] ?? "";
    const root = `${letter}${accidental}`;

    try {
        return {
            root,
            rootPc: parseNoteName(root),
            letter,
            rest: match[3] ?? "",
        };
    } catch {
        return null;
    }
}

function extractExtensions(lowerBody: string): Set<ChordExtensionToken> {
    const extensions = new Set<ChordExtensionToken>();

    if (lowerBody.includes("add9")) extensions.add("add9");
    if (/(^|[^0-9])13(?![0-9])/.test(lowerBody)) extensions.add("13");
    if (/(^|[^0-9])11(?![0-9])/.test(lowerBody)) extensions.add("11");
    if (/(^|[^0-9])9(?![0-9])/.test(lowerBody) && !extensions.has("add9")) extensions.add("9");
    if (/(^|[^0-9])6(?![0-9])/.test(lowerBody)) extensions.add("6");

    if (lowerBody.includes("sus2")) extensions.add("sus2");
    if (lowerBody.includes("sus4") || (lowerBody.includes("sus") && !lowerBody.includes("sus2"))) {
        extensions.add("sus4");
    }

    for (const alteration of ALTERATIONS) {
        if (lowerBody.includes(alteration)) {
            extensions.add(alteration);
        }
    }

    return extensions;
}

function detectBaseQuality(lowerBody: string, extensions: Set<ChordExtensionToken>): ChordBaseQuality {
    if (lowerBody.includes("m7b5") || lowerBody.includes("ø")) return "half-diminished";
    if (lowerBody.includes("dim") || lowerBody.includes("°")) return "diminished";
    if (extensions.has("sus2") || extensions.has("sus4") || lowerBody.startsWith("sus")) return "suspended";
    if (lowerBody.startsWith("m") && !lowerBody.startsWith("maj")) return "minor";
    return "major";
}

function detectSeventhType(lowerBody: string, quality: ChordBaseQuality): ChordSeventhType {
    if (quality === "half-diminished") return "ø7";
    if (lowerBody.includes("dim7") || lowerBody.includes("°7")) return "°7";
    if (/maj(7|9|11|13)/.test(lowerBody)) return "maj7";

    const hasExtendedDegree = (/(^|[^0-9])(9|11|13)(?![0-9])/.test(lowerBody) && !lowerBody.includes("add9"));
    if (
        lowerBody.includes("m7")
        || /(^|[^0-9])7(?![0-9])/.test(lowerBody)
        || hasExtendedDegree
        || lowerBody.includes("(b9")
        || lowerBody.includes("(#9")
        || lowerBody.includes("(#11")
        || lowerBody.includes("(b13")
    ) {
        return "7";
    }

    return "none";
}

function withSlash(symbol: string, parsed: ParsedChordSymbol): string {
    if (!parsed.slashBass) return symbol;
    return `${symbol}/${parsed.slashBass}`;
}

function variantFamily(quality: ChordBaseQuality, seventh: ChordSeventhType): string {
    if (quality === "major" && seventh === "maj7") return "major-seventh";
    if (quality === "major" && seventh === "7") return "dominant";
    if (quality === "minor" && seventh !== "none") return "minor-seventh";
    if (quality === "suspended") return "suspended";
    if (quality === "diminished" || quality === "half-diminished") return "diminished";
    return "triad-color";
}

function isDominantLike(parsed: ParsedChordSymbol, roman?: string): boolean {
    if (isDominantRoman(roman)) return true;
    if (parsed.seventhType !== "7") return false;
    return parsed.baseQuality === "major"
        || parsed.baseQuality === "suspended";
}

function pushVariant(
    list: ChordVariantOption[],
    seen: Set<string>,
    baseSymbol: string,
    symbol: string,
    score: number,
    family: string,
): void {
    const normalized = normalizeChordSymbol(symbol);
    if (!normalized || normalized === baseSymbol || seen.has(normalized)) return;

    seen.add(normalized);
    list.push({ symbol: normalized, score, family });
}

export function normalizeChordSymbol(symbol: string): string {
    return symbol
        .trim()
        .replace(/\s+/g, "")
        .replace(/♭/g, "b")
        .replace(/♯/g, "#");
}

export function parseChordSymbol(symbol: string): ParsedChordSymbol | null {
    const normalized = normalizeChordSymbol(symbol);
    if (!normalized) return null;

    const slashIndex = normalized.indexOf("/");
    const upperStructure = slashIndex >= 0 ? normalized.slice(0, slashIndex) : normalized;
    const bassPart = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : undefined;

    const rootInfo = parseRootToken(upperStructure);
    if (!rootInfo) return null;

    const lowerBody = rootInfo.rest.toLowerCase();
    const extensionSet = extractExtensions(lowerBody);
    const baseQuality = detectBaseQuality(lowerBody, extensionSet);
    const seventhType = detectSeventhType(lowerBody, baseQuality);

    const result: ParsedChordSymbol = {
        original: symbol,
        normalized,
        root: rootInfo.root,
        rootPc: rootInfo.rootPc,
        letter: rootInfo.letter,
        body: rootInfo.rest,
        baseQuality,
        seventhType,
        extensions: sortExtensions(extensionSet),
    };

    if (bassPart) {
        const bassInfo = parseRootToken(bassPart);
        if (bassInfo) {
            result.slashBass = bassInfo.root;
            result.slashBassPc = bassInfo.rootPc;
        }
    }

    return result;
}

export function getChordCoreIntervals(parsed: ParsedChordSymbol): number[] {
    let intervals: number[] = [0, 4, 7];

    if (parsed.baseQuality === "half-diminished") {
        intervals = [0, 3, 6];
    } else if (parsed.baseQuality === "diminished") {
        intervals = [0, 3, 6];
    } else if (parsed.baseQuality === "minor") {
        intervals = [0, 3, 7];
    } else if (parsed.baseQuality === "suspended") {
        const hasSus2 = parsed.extensions.includes("sus2") && !parsed.extensions.includes("sus4");
        intervals = hasSus2 ? [0, 2, 7] : [0, 5, 7];
    }

    if (parsed.seventhType === "7" || parsed.seventhType === "ø7") {
        intervals.push(10);
    } else if (parsed.seventhType === "maj7") {
        intervals.push(11);
    } else if (parsed.seventhType === "°7") {
        intervals.push(9);
    }

    return Array.from(new Set(intervals));
}

export function getChordCorePitchClasses(parsed: ParsedChordSymbol): number[] {
    return getChordCoreIntervals(parsed).map((interval) => (parsed.rootPc + interval) % 12);
}

export function isDominantRoman(roman?: string): boolean {
    if (!roman) return false;

    const primary = (roman.split("/")[0] ?? roman).trim();
    if (!primary) return false;

    const withoutInversion = primary.replace(/(65|64|43|42)$/i, "");
    const withoutExtension = withoutInversion
        .replace(/ø7$/i, "ø")
        .replace(/°7$/i, "°")
        .replace(/maj(?:13|11|9|7)$/i, "")
        .replace(/(?:13|11|9|7|6)$/i, "");

    const withoutAccidental = withoutExtension.replace(/^[b#]+/, "");
    const withoutQuality = withoutAccidental.replace(/[°ø+]/g, "");

    return withoutQuality === "V";
}

export function inferProfileFromSequence(
    sequence: string[],
    fallback: ChordRichnessProfile = DEFAULT_CHORD_RICHNESS_PROFILE,
): ChordRichnessProfile {
    for (const symbol of sequence) {
        const parsed = parseChordSymbol(symbol);
        if (!parsed) continue;

        const startsRich = parsed.seventhType !== "none"
            || parsed.extensions.includes("9")
            || parsed.extensions.includes("11")
            || parsed.extensions.includes("13")
            || parsed.extensions.includes("b9")
            || parsed.extensions.includes("#9")
            || parsed.extensions.includes("#11")
            || parsed.extensions.includes("b13");

        return startsRich ? "seventh" : "triad";
    }

    return fallback;
}

export function toProfileBaseChordSymbol(
    chordSymbol: string,
    profile: ChordRichnessProfile,
    options: { roman?: string } = {},
): string {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return normalizeChordSymbol(chordSymbol);

    const dominant = isDominantLike(parsed, options.roman);
    const root = parsed.root;

    if (profile === "triad") {
        if (parsed.baseQuality === "half-diminished" || parsed.baseQuality === "diminished") {
            return withSlash(`${root}dim`, parsed);
        }
        if (parsed.baseQuality === "minor") {
            return withSlash(`${root}m`, parsed);
        }
        if (parsed.baseQuality === "suspended") {
            const suffix = parsed.extensions.includes("sus2") && !parsed.extensions.includes("sus4")
                ? "sus2"
                : "sus4";
            return withSlash(`${root}${suffix}`, parsed);
        }
        return withSlash(root, parsed);
    }

    if (parsed.baseQuality === "half-diminished") {
        return withSlash(`${root}m7b5`, parsed);
    }

    if (parsed.baseQuality === "diminished") {
        return withSlash(`${root}dim7`, parsed);
    }

    if (parsed.baseQuality === "minor") {
        if (parsed.seventhType === "maj7") {
            return withSlash(`${root}m(maj7)`, parsed);
        }
        return withSlash(`${root}m7`, parsed);
    }

    if (parsed.baseQuality === "suspended") {
        if (profile === "jazz" || dominant) {
            return withSlash(`${root}9sus`, parsed);
        }
        return withSlash(`${root}7sus4`, parsed);
    }

    if (dominant) {
        return withSlash(`${root}7`, parsed);
    }

    return withSlash(`${root}maj7`, parsed);
}

export function generateChordVariants(options: GenerateChordVariantsOptions): ChordVariantOption[] {
    const {
        baseSymbol,
        profile,
        roman,
        useSpice = false,
        maxVariants = 6,
    } = options;

    const parsed = parseChordSymbol(baseSymbol);
    if (!parsed) return [];

    const variants: ChordVariantOption[] = [];
    const seen = new Set<string>();
    const normalizedBase = normalizeChordSymbol(baseSymbol);
    const family = variantFamily(parsed.baseQuality, parsed.seventhType);
    const withSameBass = (symbol: string) => withSlash(symbol, parsed);

    if (parsed.baseQuality === "major" && parsed.seventhType === "maj7") {
        pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}maj9`), 100, family);
        if (profile === "jazz" && useSpice) {
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}maj7(#11)`), 82, family);
        }
    } else if (parsed.baseQuality === "minor" && parsed.seventhType !== "none") {
        pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}m9`), 98, family);
        if (profile === "jazz") {
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}m11`), 88, family);
        }
    } else if (isDominantLike(parsed, roman)) {
        pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}9`), 99, family);
        pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}13`), 94, family);

        // Prefer suspended 11-color instead of plain 11 with natural third.
        if (profile !== "triad") {
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}9sus`), 80, family);
        }

        if (profile === "jazz" && useSpice) {
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}7(b9)`), 89, family);
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}7(#9)`), 87, family);
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}7(#11)`), 84, family);
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}7(b13)`), 82, family);
        }
    } else if (parsed.seventhType === "none") {
        if (parsed.baseQuality === "major") {
            if (profile === "triad") {
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}add9`), 90, family);
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}6`), 84, family);
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}sus2`), 78, family);
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}sus4`), 76, family);
            } else {
                const dominantFromRoman = isDominantRoman(roman);
                if (dominantFromRoman) {
                    pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}7`), 92, family);
                    if (profile === "jazz") {
                        pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}9`), 86, family);
                    }
                } else {
                    pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}maj7`), 92, family);
                    if (profile === "jazz") {
                        pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}maj9`), 86, family);
                    }
                }
            }
        } else if (parsed.baseQuality === "minor") {
            if (profile === "triad") {
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}madd9`), 88, family);
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}m6`), 82, family);
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}sus2`), 72, family);
            } else {
                pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}m7`), 92, family);
                if (profile === "jazz") {
                    pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}m9`), 86, family);
                }
            }
        } else if (parsed.baseQuality === "diminished" && profile !== "triad") {
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}dim7`), 74, family);
        } else if (parsed.baseQuality === "suspended" && profile !== "triad") {
            pushVariant(variants, seen, normalizedBase, withSameBass(`${parsed.root}9sus`), 85, family);
        }
    }

    return variants
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.symbol.localeCompare(b.symbol);
        })
        .slice(0, maxVariants);
}
