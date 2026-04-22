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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refresh: async () => {},
  enabledPages: [],
  isPageEnabled: () => false,
});

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [enabledPages, setEnabledPages] = useState<PageId[]>([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);

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

  useEffect(() => {
    if (!user || pagesLoaded) return;

    if (isAdmin) {
      setEnabledPages(ALL_PAGES.map((p) => p.id));
      setPagesLoaded(true);
      return;
    }

    async function fetchEnabledPages() {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          const data = await response.json();
          setEnabledPages(data.enabledPages ?? []);
        }
      } catch (error) {
        console.error("Failed to fetch enabled pages:", error);
      } finally {
        setPagesLoaded(true);
      }
    }

    fetchEnabledPages();
  }, [user, isAdmin, pagesLoaded]);

  const isPageEnabled = useCallback(
    (pageId: PageId) => {
      if (isAdmin) return true;
      return enabledPages.includes(pageId);
    },
    [isAdmin, enabledPages]
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const refresh = useCallback(async () => {
    await update();
    setPagesLoaded(false);
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
