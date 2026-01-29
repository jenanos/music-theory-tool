"use client";

import React from "react";
import { cn } from "@repo/ui/utils";

export type PracticeMode = "all" | "single" | "custom";
export const STRING_NAMES = ["High E", "B", "G", "D", "A", "Low E"]; // 1-6

interface PracticeSettingsProps {
    mode: PracticeMode;
    selectedStrings: number[]; // [1, 2, 3...]
    onModeChange: (mode: PracticeMode) => void;
    onStringsChange: (strings: number[]) => void;
}

export const PracticeSettings: React.FC<PracticeSettingsProps> = ({
    mode,
    selectedStrings,
    onModeChange,
    onStringsChange,
}) => {
    return (
        <div className="flex flex-col gap-6 p-6 bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl max-w-md w-full">
            <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">Practice Configuration</h3>

                {/* Mode Selection */}
                <div className="flex gap-2 p-1 bg-neutral-800 rounded-lg mb-6">
                    {(["all", "single", "custom"] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => {
                                onModeChange(m);
                                if (m === "all") onStringsChange([1, 2, 3, 4, 5, 6]);
                                if (m === "single" && selectedStrings.length !== 1) onStringsChange([1]); // Default to first string
                                if (m === "custom" && selectedStrings.length === 0) onStringsChange([1]); // Ensure at least one
                            }}
                            className={cn(
                                "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all capitalize",
                                mode === m
                                    ? "bg-neutral-700 text-white shadow-sm"
                                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* String Selection Controls */}
                <div className="space-y-3">
                    <label className="text-xs text-neutral-500 uppercase font-bold tracking-wider">
                        Strings
                    </label>

                    <div className="grid grid-cols-6 gap-2">
                        {STRING_NAMES.map((name, idx) => {
                            const stringNum = idx + 1;
                            const isSelected = selectedStrings.includes(stringNum);
                            const isDisabled = mode === "all";

                            return (
                                <button
                                    key={stringNum}
                                    disabled={isDisabled}
                                    onClick={() => {
                                        if (mode === "single") {
                                            onStringsChange([stringNum]);
                                        } else {
                                            // Custom mode logic
                                            if (isSelected && selectedStrings.length > 1) {
                                                onStringsChange(selectedStrings.filter(s => s !== stringNum));
                                            } else if (!isSelected) {
                                                onStringsChange([...selectedStrings, stringNum].sort());
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-20",
                                        isDisabled ? "opacity-50 cursor-not-allowed border-transparent bg-neutral-800/50" :
                                            isSelected
                                                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                                                : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-750"
                                    )}
                                >
                                    <span className="text-lg font-bold">{name.split(" ")[0]}</span>
                                    <span className="text-[9px] opacity-70 mt-1">{name.includes("High") ? "High" : name.includes("Low") ? "Low" : "Str " + stringNum}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
