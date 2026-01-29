
"use client";

import { Section } from "../data";
import { SectionItem } from "./SectionItem";

interface SectionListProps {
    sections: Section[];
    onUpdate?: (id: string, updates: Partial<Section>) => void;
    onAdd?: () => void;
    onDelete?: (id: string) => void;
    onChordClick?: (chord: string, degree?: string) => void;
}

export function SectionList({ sections, onUpdate, onAdd, onDelete, onChordClick }: SectionListProps) {

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Seksjoner (Akkorder)</h2>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onChordClick={onChordClick}
                    />
                ))}
            </div>
        </div>
    );
}
