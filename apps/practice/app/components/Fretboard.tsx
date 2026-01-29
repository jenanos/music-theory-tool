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
        <div className={cn("relative w-full overflow-x-auto select-none p-4", className)}>
            <div className="min-w-[800px] flex flex-col bg-[#2a2a2a] rounded-lg shadow-2xl border-2 border-[#1a1a1a] relative">
                {/* Nut */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#1a1a1a] border-r-4 border-neutral-600 z-10" />

                {/* Frets */}
                <div className="flex flex-1 pl-8">
                    {Array.from({ length: FRETS }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 border-r border-neutral-500 relative h-full flex items-center justify-center group"
                        >
                            {DOTS.includes(i + 1) && (
                                <div className="absolute w-4 h-4 rounded-full bg-neutral-600/50 backdrop-blur-sm" />
                            )}
                            {/* Fret number */}
                            <div className="absolute -bottom-6 text-xs text-neutral-500 font-mono">
                                {i + 1}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Strings */}
                <div className="absolute inset-0 pl-8 flex flex-col justify-between py-4 pointer-events-none">
                    {STRINGS.map((note, idx) => {
                        const stringNum = idx + 1; // 1-based, 1=High E
                        const isVisible = showStrings.includes(stringNum);

                        // Strings thickness variation
                        const thickness = 1 + idx * 0.5;

                        return (
                            <div
                                key={stringNum}
                                className={cn(
                                    "relative w-full flex items-center transition-opacity duration-300",
                                    isVisible ? "opacity-100" : "opacity-10"
                                )}
                                style={{ height: '40px' }}
                            >
                                {/* The actual string line */}
                                <div
                                    className="w-full bg-gradient-to-r from-neutral-300 to-neutral-500 shadow-sm"
                                    style={{ height: `${thickness}px` }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Clickable Area Overlay */}
                <div className="absolute inset-0 pl-8 flex flex-col justify-between py-4 z-20">
                    {STRINGS.map((_, sIdx) => {
                        const stringNum = sIdx + 1;
                        const isVisible = showStrings.includes(stringNum);
                        if (!isVisible) return <div key={sIdx} className="h-[40px] pointer-events-none" />;

                        return (
                            <div key={sIdx} className="flex h-[40px] w-full items-center">
                                {/* Open String (Fret 0) - technically handled by the nut, but let's handle "0" if we want open strings? 
                          For now, let's map frets 1-12 strictly.
                         */}

                                {Array.from({ length: FRETS }).map((_, fIdx) => {
                                    const fretNum = fIdx + 1;
                                    const highlight = highlightedPositions.find(
                                        p => p.stringIndex === stringNum && p.fret === fretNum
                                    );

                                    return (
                                        <div
                                            key={fretNum}
                                            className="flex-1 h-full cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center relative"
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
