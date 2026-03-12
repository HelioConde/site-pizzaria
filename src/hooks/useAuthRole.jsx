import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function useAuthRole() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSessionAndRole(currentSession = null) {
      try {
        setIsLoading(true);

        let resolvedSession = currentSession;

        if (!resolvedSession) {
          const {
            data: { session: sessionData },
          } = await supabase.auth.getSession();

          resolvedSession = sessionData;
        }

        if (!active) return;

        setSession(resolvedSession);

        if (!resolvedSession?.user?.id) {
          setUserRole("");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", resolvedSession.user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!active) return;

        setUserRole(String(data?.role || "").trim().toLowerCase());
      } catch (error) {
        console.error("Erro ao carregar sessão e role:", error);

        if (!active) return;

        setSession(null);
        setUserRole("");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSessionAndRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      loadSessionAndRole(newSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isLoading,
    session,
    isAuthenticated: !!session,
    userRole,
  };
}