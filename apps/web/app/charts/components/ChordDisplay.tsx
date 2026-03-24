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

// Matches time signatures like 3/4, 4/4, 5/4, 6/4, 6/8, 7/8, 12/8 etc.
function isTimeSignature(token: string): boolean {
    return /^\d+\/\d+$/.test(token);
}

type Token = { type: "chord"; chord: string; degree?: string; isRepeated: boolean; chordIndex: number } | { type: "timesig"; value: string };

export function ChordDisplay({ chordLine, degreeLine, className, onClick, onChordClick, hideRepeats, showAsPercent }: ChordDisplayProps) {
    const rows = useMemo(() => {
        if (!chordLine) return [];
        const cLines = chordLine.split('\n');
        const dLines = degreeLine ? degreeLine.split('\n') : [];

        let lastChord: string | undefined;

        return cLines.map((line, lineIndex) => {
            const rawTokens = line.split(/[\s|-]+/).filter(Boolean);
            const degrees = dLines[lineIndex]
                ? dLines[lineIndex].split(/[\s|-]+/).filter(Boolean)
                : [];

            const tokens: Token[] = [];
            let chordCount = 0;

            rawTokens.forEach((token) => {
                if (isTimeSignature(token)) {
                    tokens.push({ type: "timesig", value: token });
                } else {
                    const chordIdx = chordCount;
                    const prev = chordCount > 0
                        ? (tokens.filter(t => t.type === "chord").pop() as Extract<Token, { type: "chord" }>).chord
                        : lastChord;

                    let isRepeated = false;
                    let resolvedChord = token;

                    if (token === "%") {
                        resolvedChord = prev ?? token;
                        isRepeated = true;
                    } else if (prev !== undefined && token === prev) {
                        isRepeated = true;
                    }

                    tokens.push({
                        type: "chord",
                        chord: resolvedChord,
                        degree: degrees[chordIdx],
                        isRepeated,
                        chordIndex: chordIdx,
                    });

                    chordCount++;
                    lastChord = resolvedChord;
                }
            });

            return tokens;
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
            className={`flex flex-col gap-1.5 md:gap-2 md:rounded-md md:bg-muted md:p-3 min-h-[40px] md:min-h-[60px] cursor-pointer md:hover:bg-muted/80 md:ring-1 md:ring-border/60 w-max min-w-full ${className}`}
        >
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex min-w-max flex-nowrap items-center gap-2 min-h-[56px]">
                    {row.length > 0 ? (
                        row.map((token, tokenIndex) => {
                            if (token.type === "timesig") {
                                const [num, den] = token.value.split("/");
                                return (
                                    <div
                                        key={`ts-${rowIndex}-${tokenIndex}`}
                                        className="flex flex-col items-center justify-center px-1.5 py-1 rounded bg-muted-foreground/10 ring-1 ring-border/40 select-none"
                                        title={`Taktart: ${token.value}`}
                                    >
                                        <span className="text-[10px] font-bold leading-tight text-muted-foreground">{num}</span>
                                        <div className="w-3 border-t border-muted-foreground/50" />
                                        <span className="text-[10px] font-bold leading-tight text-muted-foreground">{den}</span>
                                    </div>
                                );
                            }

                            const { chord, degree, isRepeated, chordIndex } = token;

                            if (isRepeated && hideRepeats) return null;

                            const displayChord = isRepeated && showAsPercent ? "%" : chord;

                            return (
                                <div
                                    key={`${chord}-${rowIndex}-${tokenIndex}`}
                                    onClick={(e) => {
                                        if (onChordClick) {
                                            e.stopPropagation();
                                            onChordClick(chord, rowIndex, chordIndex, degree);
                                        }
                                    }}
                                    className={`flex flex-col gap-1 items-center justify-center p-2 rounded-lg bg-card shadow-sm ring-1 ring-border/60 transition-transform hover:-translate-y-0.5 hover:shadow-md ${onChordClick ? 'cursor-pointer hover:ring-primary/60' : ''} ${isRepeated ? 'opacity-40' : ''}`}
                                >
                                    <span className="font-bold text-foreground">
                                        {displayChord}
                                    </span>
                                    {degree && !isRepeated && (
                                        <span className="text-xs font-medium text-primary">
                                            {degree}
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
