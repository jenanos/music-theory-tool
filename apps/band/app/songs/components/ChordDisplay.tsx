import { useMemo } from "react";

interface ChordDisplayProps {
    chordLine: string;
    degreeLine?: string;
    className?: string;
    onClick?: () => void;
    onChordClick?: (chord: string, lineIndex: number, chordIndex: number, degree?: string) => void;
}

export function ChordDisplay({ chordLine, degreeLine, className, onClick, onChordClick }: ChordDisplayProps) {
    const rows = useMemo(() => {
        if (!chordLine) return [];
        const cLines = chordLine.split('\n');
        const dLines = degreeLine ? degreeLine.split('\n') : [];

        return cLines.map((line, lineIndex) => {
            const chords = line.split(/[\s|-]+/).filter(Boolean);
            const degrees = dLines[lineIndex]
                ? dLines[lineIndex].split(/[\s|-]+/).filter(Boolean)
                : [];

            return { chords, degrees };
        });
    }, [chordLine, degreeLine]);

    if (!chordLine.trim()) {
        return (
            <div
                onClick={onClick}
                className={`min-h-[80px] w-full rounded-md border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400 hover:border-indigo-300 hover:bg-slate-100 ${className}`}
            >
                Klikk for å legge til akkorder...
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`flex flex-col gap-2 rounded-md bg-slate-50 p-3 min-h-[60px] cursor-pointer hover:bg-slate-100 ring-1 ring-slate-900/5 ${className}`}
        >
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-center gap-2 min-h-[56px]">
                    {row.chords.length > 0 ? (
                        row.chords.map((chord, chordIndex) => (
                            <div
                                key={`${chord}-${rowIndex}-${chordIndex}`}
                                onClick={(e) => {
                                    if (onChordClick) {
                                        e.stopPropagation();
                                        onChordClick(chord, rowIndex, chordIndex, row.degrees[chordIndex]);
                                    }
                                }}
                                className={`flex flex-col gap-1 items-center justify-center p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-900/10 transition-transform hover:-translate-y-0.5 hover:shadow-md ${onChordClick ? 'cursor-pointer hover:ring-indigo-300' : ''}`}
                            >
                                <span className="font-bold text-slate-700">
                                    {chord}
                                </span>
                                {row.degrees[chordIndex] && (
                                    <span className="text-xs font-medium text-indigo-500">
                                        {row.degrees[chordIndex]}
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="h-14 border border-transparent" />
                    )}
                </div>
            ))}
        </div>
    );
}
