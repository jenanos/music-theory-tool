"use client";

import { Section } from "../data";
import { SectionItem } from "./SectionItem";

interface SectionListProps {
  sections: Section[];
  songKey?: string;
  layoutMode?: "multi" | "single";
  hideRepeats?: boolean;
  showAsPercent?: boolean;
  onUpdate?: (id: string, updates: Partial<Section>) => void;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  onChordClick?: (
    chord: string,
    sectionId: string,
    lineIndex: number,
    chordIndex: number,
    degree?: string,
  ) => void;
}

export function SectionList({
  sections,
  songKey,
  layoutMode = "multi",
  hideRepeats,
  showAsPercent,
  onUpdate,
  onAdd,
  onDelete,
  onChordClick,
}: SectionListProps) {
  const isSingleSectionPerRow = layoutMode === "single";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Seksjoner (Akkorder)
        </h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            + Ny seksjon
          </button>
        )}
      </div>

      <div
        className={
          isSingleSectionPerRow
            ? "mx-auto flex w-full max-w-3xl flex-col items-center gap-2 md:gap-4 px-0 md:px-4"
            : "flex flex-wrap items-start gap-2 md:gap-4"
        }
      >
        {sections.map((section) => (
          <div
            key={section.id}
            className={
              isSingleSectionPerRow ? "flex w-full justify-center" : undefined
            }
          >
            <SectionItem
              section={section}
              songKey={songKey}
              hideRepeats={hideRepeats}
              showAsPercent={showAsPercent}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onChordClick={onChordClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
