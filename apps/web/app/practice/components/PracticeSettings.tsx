"use client";

import React from "react";
import { cn } from "@repo/ui/utils";

export type PracticeMode = "all" | "single" | "custom";
export const STRING_NAMES = ["High E", "B", "G", "D", "A", "Low E"];

interface PracticeSettingsProps {
    mode: PracticeMode;
    selectedStrings: number[];
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
        <div className="flex flex-col gap-6 p-6 bg-card rounded-xl border border-border shadow-xl max-w-md w-full">
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Øvelsesinnstillinger</h3>

                {/* Mode Selection */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
                    {(["all", "single", "custom"] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => {
                                onModeChange(m);
                                if (m === "all") onStringsChange([1, 2, 3, 4, 5, 6]);
                                if (m === "single" && selectedStrings.length !== 1) onStringsChange([1]);
                                if (m === "custom" && selectedStrings.length === 0) onStringsChange([1]);
                            }}
                            className={cn(
                                "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all capitalize",
                                mode === m
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            {m === "all" ? "Alle" : m === "single" ? "Enkel" : "Egendefinert"}
                        </button>
                    ))}
                </div>

                {/* String Selection Controls */}
                <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Strenger
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
                                            if (isSelected && selectedStrings.length > 1) {
                                                onStringsChange(selectedStrings.filter(s => s !== stringNum));
                                            } else if (!isSelected) {
                                                onStringsChange([...selectedStrings, stringNum].sort());
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-20",
                                        isDisabled ? "opacity-50 cursor-not-allowed border-transparent bg-muted/50" :
                                            isSelected
                                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-muted"
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
