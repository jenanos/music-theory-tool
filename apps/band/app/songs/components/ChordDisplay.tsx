import { useMemo } from "react";

interface ChordDisplayProps {
    chordLine: string;
    degreeLine?: string;
    className?: string;
    onClick?: () => void;
    onChordClick?: (chord: string, lineIndex: number, chordIndex: number, degree?: string) => void;
    hideRepeats?: boolean;
    showAsPercent?: boolean;
}

export function ChordDisplay({ chordLine, degreeLine, className, onClick, onChordClick, hideRepeats, showAsPercent }: ChordDisplayProps) {
    const rows = useMemo(() => {
        if (!chordLine) return [];
        const cLines = chordLine.split('\n');
        const dLines = degreeLine ? degreeLine.split('\n') : [];

        let lastChord: string | undefined;

        return cLines.map((line, lineIndex) => {
            const chords = line.split(/[\s|-]+/).filter(Boolean);
            const degrees = dLines[lineIndex]
                ? dLines[lineIndex].split(/[\s|-]+/).filter(Boolean)
                : [];

            // Resolve "%" to the previous chord and mark repeated chords
            const resolvedChords: string[] = [];
            const isRepeated: boolean[] = [];
            chords.forEach((chord, i) => {
                const prev = i > 0 ? resolvedChords[i - 1] : lastChord;
                if (chord === "%") {
                    resolvedChords.push(prev ?? chord);
                    isRepeated.push(true);
                } else if (prev !== undefined && chord === prev) {
                    resolvedChords.push(chord);
                    isRepeated.push(true);
                } else {
                    resolvedChords.push(chord);
                    isRepeated.push(false);
                }
            });

            if (resolvedChords.length > 0) {
                lastChord = resolvedChords[resolvedChords.length - 1];
            }

            return { chords: resolvedChords, degrees, isRepeated };
        });
    }, [chordLine, degreeLine]);

    if (!chordLine.trim()) {
        return (
            <div
                onClick={onClick}
                className={`min-h-[80px] w-full rounded-md border-2 border-dashed border-border bg-muted p-4 text-center text-sm text-muted-foreground hover:border-primary/60 hover:bg-muted/80 ${className}`}
            >
                Klikk for å legge til akkorder...
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`flex flex-col gap-2 rounded-md bg-muted p-3 min-h-[60px] cursor-pointer hover:bg-muted/80 ring-1 ring-border/60 w-max min-w-full ${className}`}
        >
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex min-w-max flex-nowrap items-center gap-2 min-h-[56px]">
                    {row.chords.length > 0 ? (
                        row.chords.map((chord, chordIndex) => {
                            const repeated = row.isRepeated[chordIndex];

                            if (repeated && hideRepeats) return null;

                            const displayChord = repeated && showAsPercent ? "%" : chord;

                            return (
                                <div
                                    key={`${chord}-${rowIndex}-${chordIndex}`}
                                    onClick={(e) => {
                                        if (onChordClick) {
                                            e.stopPropagation();
                                            onChordClick(chord, rowIndex, chordIndex, row.degrees[chordIndex]);
                                        }
                                    }}
                                    className={`flex flex-col gap-1 items-center justify-center p-2 rounded-lg bg-card shadow-sm ring-1 ring-border/60 transition-transform hover:-translate-y-0.5 hover:shadow-md ${onChordClick ? 'cursor-pointer hover:ring-primary/60' : ''} ${repeated ? 'opacity-40' : ''}`}
                                >
                                    <span className="font-bold text-foreground">
                                        {displayChord}
                                    </span>
                                    {row.degrees[chordIndex] && !repeated && (
                                        <span className="text-xs font-medium text-primary">
                                            {row.degrees[chordIndex]}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-14 border border-transparent" />
                    )}
                </div>
            ))}
        </div>
    );
}
