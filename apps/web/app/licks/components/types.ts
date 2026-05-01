import type { LickData } from "@repo/theory";

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

export type LickEditableData = LickCreateData & {
  id?: string;
};

export interface LickResponse {
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

export function formatApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const error =
    "error" in body && typeof body.error === "string" ? body.error : fallback;
  const issues =
    "issues" in body && Array.isArray(body.issues) ? body.issues : [];

  if (issues.length === 0) return error;

  const details = issues
    .map((issue) => {
      if (!issue || typeof issue !== "object") return null;
      const message =
        "message" in issue && typeof issue.message === "string"
          ? issue.message
          : null;
      const path =
        "path" in issue && Array.isArray(issue.path)
          ? issue.path.join(".")
          : "";

      if (!message) return null;
      return path ? `${path}: ${message}` : message;
    })
    .filter((detail): detail is string => Boolean(detail));

  return details.length > 0 ? `${error}: ${details.join("; ")}` : error;
}
