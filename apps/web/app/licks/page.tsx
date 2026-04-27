"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SCALES,
  TONIC_OPTIONS,
  lickDataToAlphaTex,
  parseKey,
  transposeLickData,
  validateLickData,
  type LickData,
  type ModeId,
} from "@repo/theory";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { useAuth } from "../lib/auth-context";
import { AlphaTabPreview } from "./components/AlphaTabPreview";
import {
  LickImportModal,
  type GroupOption,
  type LickCreateData,
  type LickVisibility,
} from "./components/LickImportModal";

interface Lick {
  id: string;
  title: string;
  key: string | null;
  description: string | null;
  tags: string[];
  tuning: string | null;
  data: LickData;
  visibility: LickVisibility;
  userId: string | null;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

const HARMONY_SCALES = SCALES.filter((scale) => scale.isHarmony);

function createExampleLick(): LickCreateData {
  return {
    title: "A minor pentatonic idea",
    key: "A aeolian",
    description: "Eksempel-lick som kan erstattes etter import.",
    tags: ["pentatonic"],
    tuning: "EADGBE",
    visibility: "private",
    data: {
      version: 1,
      meter: "4/4",
      feel: "straight",
      events: [
        { bar: 1, beat: 1, duration: "8", string: 1, fret: 5 },
        {
          bar: 1,
          beat: 1.5,
          duration: "8",
          string: 1,
          fret: 8,
          technique: "pull",
          toFret: 5,
        },
        { bar: 1, beat: 2, duration: "8", string: 2, fret: 8 },
        { bar: 1, beat: 2.5, duration: "8", string: 2, fret: 5 },
      ],
    },
  };
}

export default function LicksPage() {
  const { user } = useAuth();
  const [licks, setLicks] = useState<Lick[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [targetTonic, setTargetTonic] = useState("A");
  const [targetMode, setTargetMode] = useState<ModeId>("aeolian");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [licksRes, groupsRes] = await Promise.all([
          fetch("/api/licks"),
          fetch("/api/groups"),
        ]);
        if (!licksRes.ok) throw new Error("Kunne ikke hente licks.");

        const licksData = (await licksRes.json()) as Lick[];
        setLicks(licksData);
        setSelectedId((current) => current ?? licksData[0]?.id ?? null);

        if (groupsRes.ok) {
          const groupsData = (await groupsRes.json()) as GroupOption[];
          setGroups(
            groupsData.map((group) => ({ id: group.id, name: group.name })),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ukjent feil.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredLicks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return licks;

    return licks.filter((lick) =>
      [lick.title, lick.key ?? "", lick.description ?? "", ...lick.tags]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [licks, search]);

  const selectedLick =
    licks.find((lick) => lick.id === selectedId) ?? filteredLicks[0] ?? null;

  useEffect(() => {
    if (!selectedLick?.key) return;
    const parsed = parseKey(selectedLick.key);
    if (!parsed) return;
    setTargetTonic(parsed.tonic);
    setTargetMode(parsed.mode);
  }, [selectedLick?.id, selectedLick?.key]);

  const targetKey = `${targetTonic} ${targetMode}`;
  const sourceKey = selectedLick?.key || targetKey;

  const transposed = useMemo(() => {
    if (!selectedLick) return null;
    return transposeLickData(selectedLick.data, sourceKey, targetKey);
  }, [selectedLick, sourceKey, targetKey]);

  const validationWarnings = useMemo(
    () => (selectedLick ? validateLickData(selectedLick.data) : []),
    [selectedLick],
  );

  const alphaTex = useMemo(() => {
    if (!selectedLick || !transposed) return "";
    return lickDataToAlphaTex(transposed.data, {
      title: selectedLick.title,
      subtitle: targetKey,
    });
  }, [selectedLick, targetKey, transposed]);

  const handleCreateLick = async (data: LickCreateData) => {
    const response = await fetch("/api/licks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Kunne ikke lagre lick.");
    }

    const created = (await response.json()) as Lick;
    setLicks((current) => [created, ...current]);
    setSelectedId(created.id);
  };

  const handleCreateExample = async () => {
    try {
      await handleCreateLick(createExampleLick());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke opprette eksempel.",
      );
    }
  };

  const handleDelete = async (lick: Lick) => {
    if (!window.confirm(`Slett "${lick.title}"?`)) return;

    const response = await fetch(`/api/licks/${lick.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Kunne ikke slette lick.");
      return;
    }

    setLicks((current) => {
      const next = current.filter((item) => item.id !== lick.id);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const canDelete =
    selectedLick &&
    (user?.role === "admin" || selectedLick.userId === user?.id);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background md:flex-row">
      <LickImportModal
        isOpen={isImportOpen}
        groups={groups}
        onClose={() => setIsImportOpen(false)}
        onSave={handleCreateLick}
      />

      <aside className="flex max-h-[45vh] w-full flex-col border-b border-border bg-card/50 md:max-h-none md:w-80 md:border-b-0 md:border-r">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Licks</h1>
              <p className="text-xs text-muted-foreground">
                Favoritter som kan transponeres.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsImportOpen(true)}
            >
              Importer
            </Button>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Søk..."
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredLicks.map((lick) => (
            <button
              key={lick.id}
              type="button"
              onClick={() => setSelectedId(lick.id)}
              className={`w-full rounded-md p-3 text-left transition-colors ${
                lick.id === selectedLick?.id
                  ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {lick.title}
                </span>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px]">
                  {lick.visibility}
                </span>
              </div>
              <div className="mt-1 text-xs">{lick.key ?? "Ukjent toneart"}</div>
              {lick.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {lick.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}

          {filteredLicks.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <p>Ingen licks funnet.</p>
              {licks.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={handleCreateExample}
                >
                  Lag eksempel
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!selectedLick ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Importer et lick for å bygge biblioteket ditt.
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {selectedLick.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Original: {selectedLick.key ?? "ukjent"} · Viser: {targetKey}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDelete(selectedLick)}
                  >
                    Slett
                  </Button>
                )}
                <Button type="button" onClick={() => setIsImportOpen(true)}>
                  Importer nytt
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-md border border-border bg-card/50 p-4 sm:grid-cols-[160px_220px_1fr]">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Tonic</span>
                <select
                  value={targetTonic}
                  onChange={(event) => setTargetTonic(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {TONIC_OPTIONS.map((tonic) => (
                    <option key={tonic} value={tonic}>
                      {tonic}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Modus</span>
                <select
                  value={targetMode}
                  onChange={(event) =>
                    setTargetMode(event.target.value as ModeId)
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {HARMONY_SCALES.map((scale) => (
                    <option key={scale.id} value={scale.id}>
                      {scale.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="min-w-0 text-sm text-muted-foreground">
                <p className="mb-2 text-xs text-muted-foreground/80">
                  Transponering bruker samme tonesett: C ionisk og D dorisk
                  regnes som samme parent scale.
                </p>
                {selectedLick.description || "Ingen beskrivelse."}
              </div>
            </div>

            {[...validationWarnings, ...(transposed?.warnings ?? [])].length >
              0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                {[...validationWarnings, ...(transposed?.warnings ?? [])].map(
                  (warning) => (
                    <div key={warning}>{warning}</div>
                  ),
                )}
              </div>
            )}

            <AlphaTabPreview alphaTex={alphaTex} />
          </div>
        )}
      </main>
    </div>
  );
}
