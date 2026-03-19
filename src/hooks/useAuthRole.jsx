import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

export default function useAuthRole() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSessionAndRole(currentSession = undefined) {
      const requestId = ++requestIdRef.current;

      try {
        if (!isMounted) return;
        setIsLoading(true);

        let resolvedSession = currentSession;

        if (typeof resolvedSession === "undefined") {
          const {
            data,
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          resolvedSession = data?.session ?? null;
        }

        if (!isMounted || requestId !== requestIdRef.current) return;

        setSession(resolvedSession ?? null);

        const userId = resolvedSession?.user?.id;

        if (!userId) {
          setUserRole("");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!isMounted || requestId !== requestIdRef.current) return;

        setUserRole(normalizeRole(profile?.role));
      } catch (error) {
        console.error("Erro ao carregar sessão e role:", error);

        if (!isMounted || requestId !== requestIdRef.current) return;

        setSession(null);
        setUserRole("");
      } finally {
        if (isMounted && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadSessionAndRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      loadSessionAndRole(newSession ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isLoading,
    session,
    isAuthenticated: !!session?.user,
    userRole,
  };
}