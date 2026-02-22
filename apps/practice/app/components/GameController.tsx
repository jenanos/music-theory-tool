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
    if (openNoteIndex === undefined) return "?";
    const noteIndex = (openNoteIndex + fret) % 12;
    return NOTES[noteIndex] || "?";
};

interface Question {
    targetNote: string;
    targetString?: number; // If undefined, find anywhere on active strings
}

export const GameController = () => {
    const [mode, setMode] = useState<PracticeMode>("all");
    const [selectedStrings, setSelectedStrings] = useState<number[]>([1, 2, 3, 4, 5, 6]);
    const [showSettings, setShowSettings] = useState(false);

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [feedback, setFeedback] = useState<{ stringIndex: number; fret: number; status: "correct" | "incorrect" } | null>(null);
    const [score, setScore] = useState(0);

    const generateQuestion = useCallback(() => {
        if (selectedStrings.length === 0) return;

        // Pick a random string from selected
        const stringToAsk = selectedStrings[Math.floor(Math.random() * selectedStrings.length)]!;
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
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-4 md:gap-8 py-2 md:py-8 relative">

            {/* Mobile Settings Toggle Overlay */}
            {showSettings && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:hidden" onClick={() => setShowSettings(false)}>
                    <div className="bg-neutral-900 absolute inset-x-0 bottom-0 top-20 rounded-t-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-neutral-800 rounded-full text-sm">Close</button>
                        </div>
                        <div className="w-full" onClick={e => e.stopPropagation()}>
                            <PracticeSettings
                                mode={mode}
                                selectedStrings={selectedStrings}
                                onModeChange={setMode}
                                onStringsChange={(strs) => {
                                    setSelectedStrings(strs);
                                    setTimeout(() => generateQuestion(), 0);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Settings & Mobile Top Bar */}
            <div className="w-full flex md:flex-row flex-col-reverse gap-6 items-start justify-center">

                {/* Desktop Settings Panel - Hidden on Mobile unless distinct layout wanted? 
                    Actually, let's keep it visible on Desktop, hide on mobile replacing with toggle 
                */}
                <div className="hidden md:block">
                    <PracticeSettings
                        mode={mode}
                        selectedStrings={selectedStrings}
                        onModeChange={setMode}
                        onStringsChange={(strs) => {
                            setSelectedStrings(strs);
                            setTimeout(() => generateQuestion(), 0);
                        }}
                    />
                </div>

                {/* Game Status Board / Mobile Header */}
                <div className="w-full md:flex-1 bg-neutral-900 rounded-xl border border-neutral-800 p-4 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center text-center shadow-2xl min-h-[80px] md:min-h-[200px]">

                    {/* Mobile Only: Settings Button */}
                    <button className="md:hidden p-2 bg-neutral-800 rounded-lg text-neutral-400" onClick={() => setShowSettings(true)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>

                    <div className="flex flex-col md:mb-2">
                        <div className="text-[10px] md:text-sm text-neutral-500 uppercase tracking-widest hidden md:block">Current Objective</div>
                        {currentQuestion ? (
                            <div className="flex flex-row md:flex-col items-baseline md:items-center gap-2 md:gap-0">
                                <div className="text-4xl md:text-6xl font-black text-white md:mb-2 tracking-tighter">
                                    {currentQuestion.targetNote}
                                </div>
                                <div className="text-sm md:text-xl text-indigo-400 font-medium whitespace-nowrap">
                                    {currentQuestion.targetString
                                        ? <span className="md:hidden">on {["", "High E", "B", "G", "D", "A", "Low E"][currentQuestion.targetString]}</span>
                                        : <span className="md:hidden">any string</span>
                                    }
                                    <span className="hidden md:inline">{currentQuestion.targetString
                                        ? `on the ${(currentQuestion.targetString === 1 || currentQuestion.targetString === 6) ? 'E' :
                                            currentQuestion.targetString === 2 ? 'B' :
                                                currentQuestion.targetString === 3 ? 'G' :
                                                    currentQuestion.targetString === 4 ? 'D' : 'A'} string`
                                        : "anywhere on the fretboard"
                                    }</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-neutral-400 text-sm">Tap settings...</p>
                        )}
                    </div>

                    <div className="flex md:mt-8 items-center gap-2 px-3 py-1 md:px-4 md:py-2 bg-neutral-800 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono font-bold text-neutral-300 text-sm md:text-base">Score: {score}</span>
                    </div>
                </div>
            </div>

            {/* The Fretboard */}
            <Fretboard
                showStrings={selectedStrings}
                onFretClick={handleFretClick}
                highlightedPositions={feedback ? [feedback] : []}
            />

            <p className="text-neutral-600 text-xs md:text-sm mt-0 md:mt-4 text-center">
                {/* Mobile hint */}
                <span className="md:hidden">Tap the correct fret.</span>
                <span className="hidden md:inline">Click the correct fret to score points.</span>
            </p>
        </div>
    );
};
