/**
 * AuthContext.jsx — Supabase auth state + role lookup (AuthProvider/useAuth).
 *
 * Tracks the Supabase auth session and resolves the signed-in user's role
 * from the `user_roles` table (email → "admin" | "researcher"), exposing
 * convenience flags isAdmin / isResearcher used to gate the researcher and
 * admin pages. Participants never sign in, so for them everything is null.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext) ?? {
  session: null,
  user: null,
  role: null,
  isAdmin: false,
  isResearcher: false,
  loading: false,
  signOut: async () => {},
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.email) {
      setRole(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("email", session.user.email.toLowerCase())
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setRole(data?.role ?? null);
      });
    return () => { cancelled = true; };
  }, [session?.user?.email]);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const value = {
    session,
    user: session?.user ?? null,
    role,
    isAdmin: role === "admin",
    isResearcher: role === "researcher",
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
