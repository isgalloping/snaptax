"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type GoogleUser,
  loadGoogleUser,
  saveGoogleUser,
  setSeasonPaid,
} from "@/lib/client/authStorage";
import {
  fetchAuthMe,
  fetchSeasonPaid,
  signInWithGoogleApi,
  signOutApi,
} from "@/lib/client/authApi";

const CURRENT_SEASON = "2026";

export function useAuthSession() {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [seasonPaid, setSeasonPaidState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const localUser = loadGoogleUser();
      if (localUser) setGoogleUser(localUser);

      if (navigator.onLine) {
        try {
          const me = await fetchAuthMe();
          if (cancelled) return;
          if (me.user) {
            const user: GoogleUser = {
              email: me.user.email,
              name: me.user.name ?? me.user.email.split("@")[0] ?? "User",
            };
            setGoogleUser(user);
            saveGoogleUser(user);
            const paid = await fetchSeasonPaid(CURRENT_SEASON);
            if (!cancelled) {
              setSeasonPaidState(paid);
              if (!paid) setSeasonPaid(CURRENT_SEASON, false);
            }
          } else {
            setGoogleUser(null);
            saveGoogleUser(null);
          }
        } catch {
          // offline or API unavailable — keep local cache
        }
      }

      if (!cancelled) {
        setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithGoogleApi();
    const user: GoogleUser = {
      email: result.user.email,
      name: result.user.name ?? result.user.email.split("@")[0] ?? "User",
    };
    setGoogleUser(user);
    return { user, taxRecalcQueued: result.taxRecalcQueued };
  }, []);

  const signOut = useCallback(async () => {
    await signOutApi();
    setGoogleUser(null);
  }, []);

  const markSeasonPaid = useCallback(() => {
    setSeasonPaid(CURRENT_SEASON, true);
    setSeasonPaidState(true);
  }, []);

  const refreshSeasonPaid = useCallback(async () => {
    if (!navigator.onLine || !googleUser) return;
    const paid = await fetchSeasonPaid(CURRENT_SEASON);
    setSeasonPaidState(paid);
    if (paid) setSeasonPaid(CURRENT_SEASON, true);
  }, [googleUser]);

  return {
    hydrated,
    googleUser,
    isSignedIn: googleUser !== null,
    seasonPaid,
    currentSeason: CURRENT_SEASON,
    signInWithGoogle,
    signOut,
    markSeasonPaid,
    refreshSeasonPaid,
  };
}
