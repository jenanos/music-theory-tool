"use client";

import { useMemo, useState } from "react";
import {
  lickDataToAlphaTex,
  validateLickData,
  type LickData,
} from "@repo/theory";
import { Button } from "@repo/ui/button";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { Input } from "@repo/ui/input";
import { AlphaTabPreview } from "./AlphaTabPreview";

export type LickVisibility = "private" | "group" | "shared";

export interface GroupOption {
  id: string;
  name: string;
}

export interface LickCreateData {
  title: string;
  key?: string | null;
  description?: string | null;
  tags?: string[];
  tuning?: string | null;
  data: LickData;
  visibility?: LickVisibility;
  groupId?: string | null;
}

interface LickImportModalProps {
  isOpen: boolean;
  groups: GroupOption[];
  onClose: () => void;
  onSave: (data: LickCreateData) => Promise<void>;
}

const DEFAULT_LICK_DATA: LickData = {
  version: 1,
  meter: "4/4",
  feel: "straight",
  events: [],
};

const LLM_PROMPT = `Du er en presis transkribent for gitar-licks. Se på vedlagt bilde, PDF eller tekst med gitartabulatur og returner ett JSON-objekt som matcher denne strukturen:

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
- Returner kun gyldig JSON, uten markdown.
- string er 1-6 der 1 er lys E-streng og 6 er mørk E-streng.
- duration bruker "1", "2", "4", "8", "16" osv. Bruk "8t" for åttedels-trioler.
- Ikke bruk punktede rytmer som "4." eller "8.". Bruk nærmeste grunnverdi ("4" eller "8") og beskriv punktéringen i description hvis den er viktig.
- technique kan være "slide", "hammer", "pull", "bend", "vibrato", "tie" eller "ghost".
- Hvis noe er usikkert, legg en kort forklaring i description, men gjett beste tab-data.`;

export function LickImportModal({
  isOpen,
  groups,
  onClose,
  onSave,
}: LickImportModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [draft, setDraft] = useState<LickCreateData | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [visibility, setVisibility] = useState<LickVisibility>("private");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const warnings = useMemo(
    () => (draft ? validateLickData(draft.data) : []),
    [draft],
  );

  const alphaTex = useMemo(
    () =>
      draft
        ? lickDataToAlphaTex(draft.data, { title: draft.title })
        : lickDataToAlphaTex(DEFAULT_LICK_DATA, { title: "Preview" }),
    [draft],
  );

  if (!isOpen) return null;

  const resetAndClose = () => {
    setJsonText("");
    setDraft(null);
    setError("");
    setPromptCopied(false);
    setVisibility("private");
    setSelectedGroupId("");
    onClose();
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

  const parseDraft = () => {
    setError("");
    try {
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

      setDraft({
        title: parsed.title,
        key: typeof parsed.key === "string" ? parsed.key : null,
        description:
          typeof parsed.description === "string" ? parsed.description : null,
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        tuning: typeof parsed.tuning === "string" ? parsed.tuning : "EADGBE",
        data: {
          version: 1,
          meter: parsed.data.meter || "4/4",
          feel: parsed.data.feel || "straight",
          events: parsed.data.events,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke tolke JSON.");
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    if (visibility === "group" && !selectedGroupId) {
      setError("Velg en gruppe for gruppesynlighet.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave({
        ...draft,
        visibility,
        groupId: visibility === "group" ? selectedGroupId : null,
      });
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lagre lick.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Importer lick
            </h2>
            <p className="text-sm text-muted-foreground">
              Kopier prompten, lim inn LLM-JSON, reviewer og lagre.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={resetAndClose}>
            Lukk
          </Button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>1. Prompt</Label>
              <Textarea
                value={LLM_PROMPT}
                readOnly
                className="min-h-36 font-mono text-xs"
              />
              <Button type="button" variant="outline" onClick={copyPrompt}>
                {promptCopied ? "Kopiert!" : "Kopier prompt"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lick-json">2. JSON fra LLM</Label>
              <Textarea
                id="lick-json"
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                className="min-h-52 font-mono text-xs"
                placeholder='{ "title": "...", "key": "A minor", "data": { "version": 1, "events": [] } }'
              />
              <Button
                type="button"
                onClick={parseDraft}
                disabled={!jsonText.trim()}
              >
                Tolk som utkast
              </Button>
            </div>

            {draft && (
              <div className="grid gap-3 rounded-md border border-border bg-background/60 p-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Tittel</span>
                  <Input
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Toneart</span>
                  <Input
                    value={draft.key ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, key: event.target.value })
                    }
                  />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Review-preview
              </h3>
              <p className="text-xs text-muted-foreground">
                Utkastet lagres først når du godkjenner det.
              </p>
            </div>
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                {warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            )}
            <AlphaTabPreview alphaTex={alphaTex} />

            <div className="grid gap-3 rounded-md border border-border bg-background/60 p-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Synlighet</span>
                <select
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as LickVisibility)
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
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
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
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
          </div>
        </div>

        {error && (
          <div className="mx-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border bg-muted/40 p-4">
          <Button type="button" variant="ghost" onClick={resetAndClose}>
            Avbryt
          </Button>
          <Button
            type="button"
            onClick={saveDraft}
            disabled={!draft || isSaving}
          >
            {isSaving ? "Lagrer..." : "Lagre lick"}
          </Button>
        </div>
      </div>
    </div>
  );
}
