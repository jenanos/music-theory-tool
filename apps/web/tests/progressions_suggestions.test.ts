import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("progressions page suggestion flow", () => {
    it("uses sequence-based suggestions and start fallback", () => {
        const source = readFileSync(resolve(process.cwd(), "app/progressions/page.tsx"), "utf8");

        expect(source).toMatch(/if\s*\(sequenceRomans\.length === 0\)\s*{\s*return getStartingChords/);
        expect(source).toMatch(/suggestNextChords\(\s*sequenceRomans,/);
        expect(source).not.toMatch(/buildDiatonicChords\(/);
    });
});
