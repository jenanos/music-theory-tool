
"use client";

import { Section } from "../data";
import { SectionItem } from "./SectionItem";

interface SectionListProps {
    sections: Section[];
    songKey?: string;
    onUpdate?: (id: string, updates: Partial<Section>) => void;
    onAdd?: () => void;
    onDelete?: (id: string) => void;
    onChordClick?: (chord: string, sectionId: string, lineIndex: number, chordIndex: number, degree?: string) => void;
}

export function SectionList({ sections, songKey, onUpdate, onAdd, onDelete, onChordClick }: SectionListProps) {

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Seksjoner (Akkorder)</h2>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        + Ny seksjon
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {sections.map((section) => (
                    <SectionItem
                        key={section.id}
                        section={section}
                        songKey={songKey}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onChordClick={onChordClick}
                    />
                ))}
            </div>
        </div>
    );
}
