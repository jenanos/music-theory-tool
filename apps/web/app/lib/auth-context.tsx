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
import {
  DEFAULT_USER_THEME,
  applyThemeToDocument,
  isUserTheme,
  type UserTheme,
} from "./theme";

export type UserRole = "admin" | "member";

export type PageId =
  | "chords"
  | "progressions"
  | "charts"
  | "practice"
  | "licks";

export const ALL_PAGES: { id: PageId; label: string; path: string }[] = [
  { id: "chords", label: "Akkorder", path: "/" },
  { id: "progressions", label: "Progresjoner", path: "/progressions" },
  { id: "charts", label: "Blekker", path: "/charts" },
  { id: "licks", label: "Licks", path: "/licks" },
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
  theme: UserTheme;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateTheme: (theme: UserTheme) => Promise<void>;
  enabledPages: PageId[];
  isPageEnabled: (pageId: PageId) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  theme: DEFAULT_USER_THEME,
  isLoading: true,
  logout: async () => {},
  refresh: async () => {},
  updateTheme: async () => {},
  enabledPages: [],
  isPageEnabled: () => false,
});

function AuthContextProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: UserTheme;
}) {
  const { data: session, status, update } = useSession();
  const [enabledPages, setEnabledPages] = useState<PageId[]>([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [theme, setTheme] = useState<UserTheme>(initialTheme);

  const user: SessionUser | null = useMemo(
    () =>
      session?.user
        ? {
            id: session.user.id ?? "",
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            role: ((session.user as SessionUser).role as UserRole) ?? "member",
          }
        : null,
    [session?.user],
  );

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

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
          if (isUserTheme(data.user?.theme)) {
            setTheme(data.user.theme);
          }
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
    [isAdmin, enabledPages],
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const refresh = useCallback(async () => {
    await update();
    setPagesLoaded(false);
  }, [update]);

  const updateTheme = useCallback(async (nextTheme: UserTheme) => {
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(data?.error ?? "Kunne ikke lagre tema.");
    }

    const data = (await response.json()) as {
      user?: { theme?: UserTheme };
    };

    if (isUserTheme(data.user?.theme)) {
      setTheme(data.user.theme);
      return;
    }

    setTheme(nextTheme);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        theme,
        isLoading: status === "loading",
        logout,
        refresh,
        updateTheme,
        enabledPages,
        isPageEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({
  children,
  initialTheme = DEFAULT_USER_THEME,
}: {
  children: ReactNode;
  initialTheme?: UserTheme;
}) {
  return (
    <SessionProvider>
      <AuthContextProvider initialTheme={initialTheme}>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
