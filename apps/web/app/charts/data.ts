
export type SongVisibility = "private" | "group" | "shared";

export interface Section {
    id: string;
    label: string;
    description?: string; // Tilleggsbeskrivelse ved siden av label-dropdown
    chordLines: string[];
    degreeLines: string[];
    notes?: string; // NY: seksjonsnotater
}

export interface Song {
    id: string;
    title: string;
    artist?: string;
    key?: string;
    sections: Section[];
    arrangement: string[];
    notes?: string; // sang-notater (som før)
    visibility: SongVisibility;
    userId?: string | null;
    groupId?: string | null;
}

export interface GroupInfo {
    id: string;
    name: string;
    members: {
        id: string;
        userId: string;
        role: string;
        name: string | null;
        email: string;
    }[];
    songCount: number;
}

export const initialSongs: Song[] = []; // Empty, as we fetch from API/DB
