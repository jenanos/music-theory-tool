"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lickDataToAlphaTex, type LickData } from "@repo/theory";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { AlphaTabPreview } from "./AlphaTabPreview";
import { alphaTexToLickData } from "./alphaTexConversion";
import {
  formatApiError,
  type GroupOption,
  type LickCreateData,
  type LickResponse,
  type LickVisibility,
} from "./types";

interface LickEditorPageProps {
  lickId?: string;
}

type EditorMode = "create" | "edit";

const BLANK_LICK_DATA: LickData = {
  version: 1,
  meter: "4/4",
  feel: "straight",
  events: [
    { bar: 1, beat: 1, duration: "8", string: 1, fret: 5 },
    { bar: 1, beat: 1.5, duration: "8", string: 1, fret: 8 },
    { bar: 1, beat: 2, duration: "8", string: 2, fret: 8 },
    { bar: 1, beat: 2.5, duration: "8", string: 2, fret: 5 },
  ],
};

const LLM_PROMPT = `Du er en presis transkribent for gitar-licks. Returner kun ett gyldig JSON-objekt, uten markdown, som matcher:

{
  "title": "Kort navn",
  "key": "A minor",
  "description": "Valgfri kommentar",
  "tags": ["blues", "pentatonic"],
  "tuning": "EADGBE",
  "data": {
    "version": 1,
    "meter": "4/4",
    "feel": "straight",
    "events": [
      {
        "bar": 1,
        "beat": 1,
        "duration": "8",
        "string": 1,
        "fret": 3,
        "technique": "slide",
        "toFret": 5,
        "ghost": false
      }
    ]
  }
}

Regler:
- string er 1-6 der 1 er lys E-streng og 6 er mørk E-streng.
- data.feel må være "straight", "swing" eller "triplets".
- duration bruker "1", "2", "4", "8", "16" osv. Bruk "8t" for åttedels-trioler.
- technique kan være "slide", "hammer", "pull", "bend", "vibrato", "tie" eller "ghost".`;

function createInitialDraft(): LickCreateData {
  return {
    title: "Nytt lick",
    key: "A aeolian",
    description: "",
    tags: [],
    tuning: "EADGBE",
    visibility: "private",
    groupId: null,
    data: BLANK_LICK_DATA,
  };
}

function normalizeLickFeel(feel: unknown): LickData["feel"] {
  if (feel === "triplet") return "triplets";
  if (feel === "straight" || feel === "swing" || feel === "triplets") {
    return feel;
  }
  return "straight";
}

function normalizeLoadedLick(lick: LickResponse): LickCreateData {
  return {
    title: lick.title,
    key: lick.key ?? "",
    description: lick.description ?? "",
    tags: lick.tags ?? [],
    tuning: lick.tuning ?? "EADGBE",
    visibility: lick.visibility,
    groupId: lick.groupId,
    data: {
      version: 1,
      meter: lick.data.meter || "4/4",
      feel: normalizeLickFeel(lick.data.feel),
      events: lick.data.events ?? [],
    },
  };
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function draftToAlphaTex(draft: LickCreateData): string {
  return lickDataToAlphaTex(draft.data, {
    title: draft.title || "Lick",
    subtitle: draft.key ?? undefined,
  });
}

function parseLlmDraft(jsonText: string): LickCreateData {
  const parsed = JSON.parse(jsonText) as Partial<LickCreateData>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON må være et objekt.");
  }
  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("JSON mangler title.");
  }
  if (!parsed.data || !Array.isArray(parsed.data.events)) {
    throw new Error("JSON mangler data.events.");
  }

  return {
    title: parsed.title,
    key: typeof parsed.key === "string" ? parsed.key : "",
    description:
      typeof parsed.description === "string" ? parsed.description : "",
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    tuning: typeof parsed.tuning === "string" ? parsed.tuning : "EADGBE",
    visibility: parsed.visibility ?? "private",
    groupId: parsed.groupId ?? null,
    data: {
      version: 1,
      meter: parsed.data.meter || "4/4",
      feel: normalizeLickFeel(parsed.data.feel),
      events: parsed.data.events,
    },
  };
}

export function LickEditorPage({ lickId }: LickEditorPageProps) {
  const router = useRouter();
  const mode: EditorMode = lickId ? "edit" : "create";
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [draft, setDraft] = useState<LickCreateData>(() =>
    createInitialDraft(),
  );
  const [alphaTex, setAlphaTex] = useState(() =>
    draftToAlphaTex(createInitialDraft()),
  );
  const [llmJson, setLlmJson] = useState("");
  const [visibility, setVisibility] = useState<LickVisibility>("private");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(lickId));
  const [isSaving, setIsSaving] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEditorData() {
      setIsLoading(Boolean(lickId));
      setError(null);
      try {
        const [groupsRes, lickRes] = await Promise.all([
          fetch("/api/groups"),
          lickId ? fetch(`/api/licks/${lickId}`) : Promise.resolve(null),
        ]);

        if (groupsRes.ok) {
          const groupData = (await groupsRes.json()) as GroupOption[];
          setGroups(
            groupData.map((group) => ({ id: group.id, name: group.name })),
          );
        }

        if (lickRes) {
          if (!lickRes.ok) {
            throw new Error("Kunne ikke hente lick.");
          }
          const loaded = (await lickRes.json()) as LickResponse;
          const nextDraft = normalizeLoadedLick(loaded);
          setDraft(nextDraft);
          setAlphaTex(draftToAlphaTex(nextDraft));
          setVisibility(nextDraft.visibility ?? "private");
          setSelectedGroupId(nextDraft.groupId ?? "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ukjent feil.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEditorData();
  }, [lickId]);

  const previewAlphaTex = useMemo(
    () => alphaTex.trim() || draftToAlphaTex(draft),
    [alphaTex, draft],
  );

  const updateDraft = (nextDraft: LickCreateData) => {
    setDraft(nextDraft);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(LLM_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      setError("Kunne ikke kopiere prompt automatisk.");
    }
  };

  const applyLlmJson = () => {
    setError(null);
    try {
      const nextDraft = parseLlmDraft(llmJson);
      setDraft(nextDraft);
      setAlphaTex(draftToAlphaTex(nextDraft));
      setVisibility(nextDraft.visibility ?? "private");
      setSelectedGroupId(nextDraft.groupId ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke tolke JSON.");
    }
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setError("Gi licket en tittel før du lagrer.");
      return;
    }
    if (visibility === "group" && !selectedGroupId) {
      setError("Velg en gruppe for gruppesynlighet.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const data = await alphaTexToLickData(previewAlphaTex);
      const payload: LickCreateData = {
        ...draft,
        title: draft.title.trim(),
        key: draft.key?.trim() || null,
        description: draft.description?.trim() || null,
        tags: draft.tags ?? [],
        tuning: draft.tuning?.trim() || null,
        visibility,
        groupId: visibility === "group" ? selectedGroupId : null,
        data,
      };

      const response = await fetch(
        lickId ? `/api/licks/${lickId}` : "/api/licks",
        {
          method: lickId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(formatApiError(body, "Kunne ikke lagre lick."));
      }

      const saved = (await response.json()) as LickResponse;
      router.push(`/licks?selected=${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lagre lick.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <main className="h-full overflow-y-auto bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {mode === "edit" ? "Rediger lick" : "Legg til lick"}
            </h1>
            <p className="text-sm text-muted-foreground">
              AlphaTex med live alphaTab-preview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/licks">Tilbake</Link>
            </Button>
            <Button type="button" onClick={save} disabled={isSaving}>
              {isSaving ? "Lagrer..." : "Lagre"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(420px,1.2fr)]">
          <section className="space-y-4 rounded-md border border-border bg-card/50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Tittel</span>
                <Input
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft({ ...draft, title: event.target.value })
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Toneart</span>
                <Input
                  value={draft.key ?? ""}
                  onChange={(event) =>
                    updateDraft({ ...draft, key: event.target.value })
                  }
                  placeholder="A aeolian"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Tags</span>
                <Input
                  value={(draft.tags ?? []).join(", ")}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      tags: parseTags(event.target.value),
                    })
                  }
                  placeholder="blues, pentatonic"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Tuning</span>
                <Input
                  value={draft.tuning ?? ""}
                  onChange={(event) =>
                    updateDraft({ ...draft, tuning: event.target.value })
                  }
                  placeholder="EADGBE"
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Beskrivelse</span>
              <Textarea
                value={draft.description ?? ""}
                onChange={(event) =>
                  updateDraft({ ...draft, description: event.target.value })
                }
                className="min-h-24"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Synlighet</span>
                <select
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as LickVisibility)
                  }
                  className="h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="private">Privat</option>
                  <option value="group">Gruppe</option>
                  <option value="shared">Delt</option>
                </select>
              </label>
              {visibility === "group" && (
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Gruppe</span>
                  <select
                    value={selectedGroupId}
                    onChange={(event) => setSelectedGroupId(event.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Velg gruppe</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <Label>LLM-import</Label>
                <Button type="button" variant="outline" onClick={copyPrompt}>
                  {promptCopied ? "Kopiert!" : "Kopier prompt"}
                </Button>
              </div>
              <Textarea
                value={llmJson}
                onChange={(event) => setLlmJson(event.target.value)}
                className="min-h-32 font-mono text-xs"
                placeholder='{ "title": "...", "data": { "version": 1, "events": [] } }'
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyLlmJson}
                disabled={!llmJson.trim()}
              >
                Bruk JSON
              </Button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="alphatex">AlphaTex</Label>
              <Textarea
                id="alphatex"
                value={alphaTex}
                onChange={(event) => setAlphaTex(event.target.value)}
                className="min-h-[620px] font-mono text-xs"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Preview
                </h2>
                <p className="text-xs text-muted-foreground">
                  Samme renderer som bibliotekvisningen.
                </p>
              </div>
              <AlphaTabPreview alphaTex={previewAlphaTex} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
