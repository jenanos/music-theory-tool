import { useMemo } from "react";

interface ChordDisplayProps {
    chordLine: string;
    className?: string;
    onClick?: () => void;
}

export function ChordDisplay({ chordLine, className, onClick }: ChordDisplayProps) {
    const rows = useMemo(() => {
        if (!chordLine) return [];
        return chordLine.split('\n').map(line =>
            line.split(/[\s|-]+/).filter(Boolean)
        );
    }, [chordLine]);

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
                <div key={rowIndex} className="flex flex-wrap items-center gap-2 min-h-[40px]">
                    {row.length > 0 ? (
                        row.map((chord, chordIndex) => (
                            <div
                                key={`${chord}-${rowIndex}-${chordIndex}`}
                                className="flex h-10 min-w-[3rem] items-center justify-center rounded-lg bg-white px-3 shadow-sm ring-1 ring-slate-900/10 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <span className="font-bold text-slate-700">
                                    {chord}
                                </span>
                            </div>
                        ))
                    ) : (
                        // Placeholder for empty line if needed, or just min-height
                        <div className="h-10 border border-transparent" />
                    )}
                </div>
            ))}
        </div>
    );
}
