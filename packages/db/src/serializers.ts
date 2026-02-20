import type {
    OriginalSection,
    OriginalSong,
    Section,
    Song,
} from "@prisma/client";

export type SongSectionResponse = {
    id: string;
    label: string;
    chordLines: string[];
    degreeLines: string[];
    notes: string | null;
};

export type SongResponse = {
    id: string;
    title: string;
    artist: string | null;
    key: string | null;
    notes: string | null;
    arrangement: string[];
    sections: SongSectionResponse[];
};

type SongWithSections = Song & { sections: Section[] };
type OriginalSongWithSections = OriginalSong & { sections: OriginalSection[] };

function toSectionResponse(songId: string, section: Section | OriginalSection): SongSectionResponse {
    return {
        id: section.id.replace(`${songId}-`, ""),
        label: section.label,
        chordLines: section.chordLines ?? [],
        degreeLines: section.degreeLines ?? [],
        notes: section.notes,
    };
}

export function toSongResponse(song: SongWithSections): SongResponse {
    return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        notes: song.notes,
        arrangement: song.arrangement ?? [],
        sections: song.sections.map((section) => toSectionResponse(song.id, section)),
    };
}

export function toOriginalSongResponse(song: OriginalSongWithSections): SongResponse {
    return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        notes: song.notes,
        arrangement: song.arrangement ?? [],
        sections: song.sections.map((section) => toSectionResponse(song.id, section)),
    };
}
