"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Fretboard } from "./Fretboard";
import { PracticeSettings, PracticeMode } from "./PracticeSettings";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const STRING_OPEN_NOTES = [4, 11, 7, 2, 9, 4];

const getNoteAt = (stringIndex: number, fret: number) => {
    const openNoteIndex = STRING_OPEN_NOTES[stringIndex - 1];
    if (openNoteIndex === undefined) return "?";
    const noteIndex = (openNoteIndex + fret) % 12;
    return NOTES[noteIndex] || "?";
};

interface Question {
    targetNote: string;
    targetString?: number;
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

        const stringToAsk = selectedStrings[Math.floor(Math.random() * selectedStrings.length)]!;
        const fretToAsk = Math.floor(Math.random() * 12) + 1;
        const note = getNoteAt(stringToAsk, fretToAsk);

        const specifyString = mode === "single" || Math.random() > 0.5;

        setCurrentQuestion({
            targetNote: note,
            targetString: specifyString ? stringToAsk : undefined
        });
        setFeedback(null);
    }, [selectedStrings, mode]);

    useEffect(() => {
        if (!currentQuestion) generateQuestion();
    }, [generateQuestion, currentQuestion]);

    const handleFretClick = (stringIndex: number, fretIndex: number) => {
        if (!currentQuestion || feedback) return;

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
            setTimeout(() => {
                setFeedback(null);
            }, 500);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-2 md:gap-8 py-1 md:py-4 relative">

            {/* Mobile Settings Toggle Overlay */}
            {showSettings && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:hidden" onClick={() => setShowSettings(false)}>
                    <div className="bg-card absolute inset-x-0 bottom-0 top-20 rounded-t-2xl p-6 overflow-y-auto border-t border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">Innstillinger</h2>
                            <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-muted rounded-full text-sm text-foreground">Lukk</button>
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
                <div className="w-full md:flex-1 bg-card rounded-xl border border-border py-2 px-3 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center text-center shadow-lg min-h-[60px] md:min-h-[200px]">

                    {/* Mobile Only: Settings Button */}
                    <button className="md:hidden p-2 bg-muted rounded-lg text-muted-foreground" onClick={() => setShowSettings(true)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>

                    <div className="flex flex-col md:mb-2">
                        <div className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-widest hidden md:block">Mål</div>
                        {currentQuestion ? (
                            <div className="flex flex-row md:flex-col items-baseline md:items-center gap-1.5 md:gap-0">
                                <div className="text-3xl md:text-6xl font-black text-foreground md:mb-2 tracking-tighter">
                                    {currentQuestion.targetNote}
                                </div>
                                <div className="text-sm md:text-xl text-primary font-medium whitespace-nowrap">
                                    {currentQuestion.targetString
                                        ? <span className="md:hidden">på {["", "High E", "B", "G", "D", "A", "Low E"][currentQuestion.targetString]}</span>
                                        : <span className="md:hidden">hvilken som helst streng</span>
                                    }
                                    <span className="hidden md:inline">{currentQuestion.targetString
                                        ? `på ${(currentQuestion.targetString === 1 || currentQuestion.targetString === 6) ? 'E' :
                                            currentQuestion.targetString === 2 ? 'B' :
                                                currentQuestion.targetString === 3 ? 'G' :
                                                    currentQuestion.targetString === 4 ? 'D' : 'A'}-strengen`
                                        : "hvor som helst på gripebrettet"
                                    }</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Trykk innstillinger...</p>
                        )}
                    </div>

                    <div className="flex md:mt-8 items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-4 md:py-2 bg-muted rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono font-bold text-foreground text-xs md:text-base">Poeng: {score}</span>
                    </div>
                </div>
            </div>

            {/* The Fretboard */}
            <Fretboard
                showStrings={selectedStrings}
                onFretClick={handleFretClick}
                highlightedPositions={feedback ? [feedback] : []}
            />

            <p className="hidden md:block text-muted-foreground text-sm mt-4 text-center">
                Klikk på riktig bånd for å få poeng.
            </p>
        </div>
    );
};
