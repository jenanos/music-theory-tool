
export interface Section {
    id: string;
    label: string;
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
}

export const initialSongs: Song[] = []; // Empty, as we fetch from API/DB
