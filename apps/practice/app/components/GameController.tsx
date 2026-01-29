"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Fretboard } from "./Fretboard";
import { PracticeSettings, PracticeMode } from "./PracticeSettings";

// Simple note data for MVP. In a real app, import from @repo/theory
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// String open notes: E, B, G, D, A, E (1 to 6)
const STRING_OPEN_NOTES = [4, 11, 7, 2, 9, 4]; // Indices in NOTES array for High E, B, G, D, A, Low E

// Helper to get note name at a specific string/fret
const getNoteAt = (stringIndex: number, fret: number) => {
    // stringIndex 1-based.
    const openNoteIndex = STRING_OPEN_NOTES[stringIndex - 1];
    const noteIndex = (openNoteIndex + fret) % 12;
    return NOTES[noteIndex];
};

interface Question {
    targetNote: string;
    targetString?: number; // If undefined, find anywhere on active strings
}

export const GameController = () => {
    const [mode, setMode] = useState<PracticeMode>("all");
    const [selectedStrings, setSelectedStrings] = useState<number[]>([1, 2, 3, 4, 5, 6]);

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [feedback, setFeedback] = useState<{ stringIndex: number; fret: number; status: "correct" | "incorrect" } | null>(null);
    const [score, setScore] = useState(0);

    const generateQuestion = useCallback(() => {
        if (selectedStrings.length === 0) return;

        // Pick a random string from selected
        const stringToAsk = selectedStrings[Math.floor(Math.random() * selectedStrings.length)];
        // Pick a random fret 1-12
        const fretToAsk = Math.floor(Math.random() * 12) + 1;
        const note = getNoteAt(stringToAsk, fretToAsk);

        // 50% chance to specify string, 50% chance to just ask for note (if multiple strings selected)
        // If single string mode, always specified logic (implicit)
        const specifyString = mode === "single" || Math.random() > 0.5;

        setCurrentQuestion({
            targetNote: note,
            targetString: specifyString ? stringToAsk : undefined
        });
        setFeedback(null);
    }, [selectedStrings, mode]);

    // Initial load
    useEffect(() => {
        if (!currentQuestion) generateQuestion();
    }, [generateQuestion, currentQuestion]);

    const handleFretClick = (stringIndex: number, fretIndex: number) => {
        if (!currentQuestion || feedback) return; // Wait if showing feedback

        const clickedNote = getNoteAt(stringIndex, fretIndex);
        const correctNote = clickedNote === currentQuestion.targetNote;
        const correctString = currentQuestion.targetString ? currentQuestion.targetString === stringIndex : true;

        if (correctNote && correctString) {
            setFeedback({ stringIndex, fret: fretIndex, status: "correct" });
            setScore(s => s + 1);
            setTimeout(() => {
                generateQuestion();
            }, 1000);
        } else {
            setFeedback({ stringIndex, fret: fretIndex, status: "incorrect" });
            // Don't advance question, just show error briefly
            setTimeout(() => {
                setFeedback(null);
            }, 500);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-8 py-8">
            {/* Header / Config */}
            <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-center">
                <PracticeSettings
                    mode={mode}
                    selectedStrings={selectedStrings}
                    onModeChange={setMode}
                    onStringsChange={(strs) => {
                        setSelectedStrings(strs);
                        // Reset question when config changes significantly to avoid invalid state
                        setTimeout(() => generateQuestion(), 0);
                    }}
                />

                {/* Game Status Board */}
                <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 p-8 flex flex-col items-center justify-center text-center shadow-2xl min-h-[200px]">
                    <div className="text-sm text-neutral-500 uppercase tracking-widest mb-2">Current Objective</div>
                    {currentQuestion ? (
                        <>
                            <div className="text-6xl font-black text-white mb-2 tracking-tighter">
                                {currentQuestion.targetNote}
                            </div>
                            <div className="text-xl text-indigo-400 font-medium">
                                {currentQuestion.targetString
                                    ? `on the ${(currentQuestion.targetString === 1 || currentQuestion.targetString === 6) ? 'E' :
                                        currentQuestion.targetString === 2 ? 'B' :
                                            currentQuestion.targetString === 3 ? 'G' :
                                                currentQuestion.targetString === 4 ? 'D' : 'A'} string`
                                    : "anywhere on the fretboard"
                                }
                            </div>
                        </>
                    ) : (
                        <p className="text-neutral-400">Configure settings to start...</p>
                    )}

                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-neutral-800 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono font-bold text-neutral-300">Score: {score}</span>
                    </div>
                </div>
            </div>

            {/* The Fretboard */}
            <Fretboard
                showStrings={selectedStrings}
                onFretClick={handleFretClick}
                highlightedPositions={feedback ? [feedback] : []}
            />

            <p className="text-neutral-600 text-sm mt-4">
                Click the correct fret to score points.
            </p>
        </div>
    );
};
