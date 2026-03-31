"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { createContext, useContext, useCallback } from "react";
import type { ReactNode } from "react";

export type UserRole = "admin" | "member";

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refresh: async () => {},
});

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  const user: SessionUser | null =
    session?.user
      ? {
          id: session.user.id ?? "",
          email: session.user.email ?? "",
          name: session.user.name ?? null,
          role:
            ((session.user as SessionUser).role as UserRole) ?? "member",
        }
      : null;

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const refresh = useCallback(async () => {
    await update();
  }, [update]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading: status === "loading", logout, refresh }}
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
