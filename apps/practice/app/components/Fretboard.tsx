"use client";

import React from "react";
import { cn } from "@repo/ui/utils";

interface FretboardProps {
    showStrings?: number[]; // 1-indexed, 1=high E, 6=low E. Standard tuning EBGDAE
    onFretClick?: (stringIndex: number, fretIndex: number) => void;
    highlightedPositions?: { stringIndex: number; fret: number; status: "correct" | "incorrect" | "default" }[];
    className?: string;
}

const STRINGS = ["E", "B", "G", "D", "A", "E"]; // High E to Low E
const FRETS = 12; // Standard practice range
const DOTS = [3, 5, 7, 9, 12];

export const Fretboard: React.FC<FretboardProps> = ({
    showStrings = [1, 2, 3, 4, 5, 6],
    onFretClick,
    highlightedPositions = [],
    className,
}) => {
    return (
        <div className={cn("relative w-full overflow-hidden select-none p-4 flex justify-center", className)}>
            <div className="w-full max-w-[400px] h-[75svh] min-h-[400px] md:max-w-none md:min-h-0 md:h-[300px] md:w-[800px] flex md:flex-row flex-col bg-[#2a2a2a] rounded-lg shadow-2xl border-2 border-[#1a1a1a] relative">
                {/* Nut */}
                <div className="
                    absolute z-20 bg-[#1a1a1a] border-neutral-600
                    w-full h-8 top-0 border-b-4 
                    md:w-8 md:h-full md:left-0 md:top-0 md:border-r-4 md:border-b-0
                " />

                {/* Frets */}
                <div className="flex flex-1 flex-col md:flex-row pt-8 pl-0 md:pt-0 md:pl-8 relative z-0">
                    {Array.from({ length: FRETS }).map((_, i) => (
                        <div
                            key={i}
                            className="
                                flex-1 border-neutral-500 relative flex items-center justify-center group
                                border-b md:border-r md:border-b-0
                                w-full md:h-full
                            "
                        >
                            {DOTS.includes(i + 1) && (
                                <div className="absolute w-4 h-4 rounded-full bg-neutral-600/50 backdrop-blur-sm" />
                            )}
                            {/* Fret number */}
                            <div className="
                                absolute text-xs text-neutral-500 font-mono
                                right-2 md:bottom-2 md:right-auto
                            ">
                                {i + 1}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Strings */}
                <div className="absolute inset-0 pt-8 pl-0 md:pt-0 md:pl-8 flex justify-between pointer-events-none z-25
                    flex-row-reverse px-6 md:flex-col md:py-4 md:px-0
                ">
                    {STRINGS.map((note, idx) => {
                        const stringNum = idx + 1; // 1-based, 1=High E
                        const isVisible = showStrings.includes(stringNum);

                        // Strings thickness variation
                        const thickness = [1, 1.5, 2.5, 3.5, 4.5, 6][idx] || 1;

                        return (
                            <div
                                key={stringNum}
                                className={cn(
                                    "relative flex items-center transition-opacity duration-300",
                                    isVisible ? "opacity-100" : "opacity-10",
                                    "h-full w-4 md:w-full md:h-10 justify-center"
                                )}
                            >
                                {/* Mobile: Vertical string */}
                                <div
                                    className="md:hidden h-full bg-gradient-to-b from-neutral-300 to-neutral-500 shadow-sm"
                                    style={{ width: `${Math.max(2, thickness)}px` }}
                                />

                                {/* Desktop: Horizontal string */}
                                <div
                                    className="hidden md:block w-full bg-gradient-to-r from-neutral-300 to-neutral-500 shadow-sm"
                                    style={{ height: `${thickness}px` }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Clickable Area Overlay */}
                <div className="absolute inset-0 pt-8 pl-0 md:pt-0 md:pl-8 flex justify-between z-30
                    flex-row-reverse px-6 md:flex-col md:py-4 md:px-0
                ">
                    {STRINGS.map((_, sIdx) => {
                        const stringNum = sIdx + 1;
                        const isVisible = showStrings.includes(stringNum);

                        if (!isVisible) return <div key={sIdx} className="flex-1 pointer-events-none" />;

                        return (
                            <div key={sIdx} className="flex flex-col md:flex-row flex-1 relative">
                                {Array.from({ length: FRETS }).map((_, fIdx) => {
                                    const fretNum = fIdx + 1;
                                    const highlight = highlightedPositions.find(
                                        p => p.stringIndex === stringNum && p.fret === fretNum
                                    );

                                    return (
                                        <div
                                            key={fretNum}
                                            className="flex-1 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center relative"
                                            onClick={() => onFretClick?.(stringNum, fretNum)}
                                        >
                                            {highlight && (
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg animate-in zoom-in duration-200",
                                                    highlight.status === "correct" ? "bg-green-500 text-white shadow-green-500/50" :
                                                        highlight.status === "incorrect" ? "bg-red-500 text-white shadow-red-500/50" :
                                                            "bg-blue-500 text-white shadow-blue-500/50"
                                                )}>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
