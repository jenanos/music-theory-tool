import type {
    OriginalSection,
    OriginalSong,
    Section,
    Song,
} from "@prisma/client";

export type SongSectionResponse = {
    id: string;
    label: string;
    description: string | null;
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
    visibility: string;
    userId: string | null;
    groupId: string | null;
};

type SongWithSections = Song & { sections: Section[] };
type OriginalSongWithSections = OriginalSong & { sections: OriginalSection[] };

function toSectionResponse(songId: string, section: Section | OriginalSection): SongSectionResponse {
    return {
        id: section.id.replace(`${songId}-`, ""),
        label: section.label,
        description: section.description ?? null,
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
        visibility: song.visibility ?? "private",
        userId: song.userId ?? null,
        groupId: song.groupId ?? null,
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
        visibility: "shared",
        userId: null,
        groupId: null,
    };
}
