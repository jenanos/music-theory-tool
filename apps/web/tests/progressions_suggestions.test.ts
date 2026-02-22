import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("progressions page suggestion flow", () => {
    it("uses unified sequence-based suggestion engine with profile", () => {
        const source = readFileSync(resolve(process.cwd(), "app/progressions/page.tsx"), "utf8");

        expect(source).toMatch(/getNextChordSuggestionsFromSequence\(/);
        expect(source).toMatch(/profile/);
        expect(source).not.toMatch(/suggestNextChords\(\s*sequenceRomans,/);
        expect(source).not.toMatch(/getStartingChords\(/);
    });
});
