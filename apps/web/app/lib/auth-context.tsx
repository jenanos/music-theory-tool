"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import type { ReactNode } from "react";

export type UserRole = "admin" | "member";

export type PageId = "chords" | "progressions" | "charts" | "practice";

export const ALL_PAGES: { id: PageId; label: string; path: string }[] = [
  { id: "chords", label: "Akkorder", path: "/" },
  { id: "progressions", label: "Progresjoner", path: "/progressions" },
  { id: "charts", label: "Blekker", path: "/charts" },
  { id: "practice", label: "Øvelse", path: "/practice" },
];

const DEFAULT_ENABLED_PAGES: PageId[] = ["charts", "progressions"];

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  enabledPages: PageId[];
  isPageEnabled: (pageId: PageId) => boolean;
  updateEnabledPages: (pages: PageId[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refresh: async () => {},
  enabledPages: DEFAULT_ENABLED_PAGES,
  isPageEnabled: () => false,
  updateEnabledPages: async () => {},
});

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [enabledPages, setEnabledPages] =
    useState<PageId[]>(DEFAULT_ENABLED_PAGES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const user: SessionUser | null = useMemo(
    () =>
      session?.user
        ? {
            id: session.user.id ?? "",
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            role:
              ((session.user as SessionUser).role as UserRole) ?? "member",
          }
        : null,
    [session?.user]
  );

  const isAdmin = user?.role === "admin";

  // Fetch preferences once the user session is available
  useEffect(() => {
    if (!user || prefsLoaded) return;

    // Admins see all pages by default
    if (isAdmin) {
      setEnabledPages(ALL_PAGES.map((p) => p.id));
      setPrefsLoaded(true);
      return;
    }

    async function fetchPreferences() {
      try {
        const response = await fetch("/api/preferences");
        if (response.ok) {
          const data = await response.json();
          setEnabledPages(data.enabledPages ?? DEFAULT_ENABLED_PAGES);
        }
      } catch {
        // Use defaults on error
      } finally {
        setPrefsLoaded(true);
      }
    }

    fetchPreferences();
  }, [user, isAdmin, prefsLoaded]);

  const isPageEnabled = useCallback(
    (pageId: PageId) => {
      if (isAdmin) return true;
      return enabledPages.includes(pageId);
    },
    [isAdmin, enabledPages]
  );

  const updateEnabledPages = useCallback(
    async (pages: PageId[]) => {
      try {
        const response = await fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabledPages: pages }),
        });
        if (response.ok) {
          const data = await response.json();
          setEnabledPages(data.enabledPages);
        }
      } catch (error) {
        console.error("Failed to update preferences:", error);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const refresh = useCallback(async () => {
    await update();
  }, [update]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === "loading",
        logout,
        refresh,
        enabledPages,
        isPageEnabled,
        updateEnabledPages,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
