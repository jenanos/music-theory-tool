
"use client";

import React, { useState } from "react";
import { TONIC_OPTIONS, SCALES, type ModeId } from "@repo/theory";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "./utils";

const HARMONY_SCALES = SCALES.filter(s => s.isHarmony);

interface CreateSongData {
    title: string;
    artist: string;
    key: string;
}

interface CreateSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateSongData) => Promise<void>;
}

export function CreateSongModal({ isOpen, onClose, onSave }: CreateSongModalProps) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [tonic, setTonic] = useState("C");
    const [modeId, setModeId] = useState<ModeId>("ionian");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Tittel er påkrevd");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await onSave({ title, artist, key: `${tonic} ${modeId}` });
            onClose();
            // Reset form
            setTitle("");
            setArtist("");
            setTonic("C");
            setModeId("ionian");
        } catch (err) {
            setError("Kunne ikke lagre låt. Prøv igjen.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={cn(
                "bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden relative z-10",
                "animate-in fade-in zoom-in-95 duration-200"
            )}>
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-card-foreground">Ny låt</h3>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="size-8"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Lukk</span>
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="song-title">
                                Tittel <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="song-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="f.eks. Kjærlighed"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="song-artist">Artist</Label>
                            <Input
                                id="song-artist"
                                type="text"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                                placeholder="f.eks. Gete"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Toneart (Key)</Label>
                            <div className="flex gap-2">
                                <div className="flex flex-col flex-1">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Grunntone</label>
                                    <select
                                        id="song-key-tonic"
                                        className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary"
                                        value={tonic}
                                        onChange={(e) => setTonic(e.target.value)}
                                    >
                                        {TONIC_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Modalitet</label>
                                    <select
                                        id="song-key-mode"
                                        className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary"
                                        value={modeId}
                                        onChange={(e) => setModeId(e.target.value as ModeId)}
                                    >
                                        {HARMONY_SCALES.map((scale) => (
                                            <option key={scale.id} value={scale.id}>{scale.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-muted/50 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Avbryt
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Lagrer...
                                </>
                            ) : (
                                "Opprett låt"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
