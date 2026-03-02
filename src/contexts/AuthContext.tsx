import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
  });

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  }, []);

  const resolveSession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setState({ user: null, session: null, isAdmin: false, loading: false });
        return;
      }
      const admin = await checkAdminRole(session.user.id);
      setState({ user: session.user, session, isAdmin: admin, loading: false });
    },
    [checkAdminRole],
  );

  useEffect(() => {
    // Bootstrap from existing session
    supabase.auth.getSession().then(({ data: { session } }) => resolveSession(session));

    // Subscribe to future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes fire every time the browser tab regains focus.
      // The Supabase client already updated the token internally — our
      // app state (user, isAdmin) hasn't changed, so skip entirely to
      // avoid unnecessary re-renders / page flicker.
      if (event === "TOKEN_REFRESHED") return;

      setState((prev) => ({ ...prev, loading: true }));
      resolveSession(session);
    });

    return () => subscription.unsubscribe();
  }, [resolveSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: "global" });
    setState({ user: null, session: null, isAdmin: false, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
