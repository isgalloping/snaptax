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
import { currentTaxSeason } from "@/lib/tax/season";

function seasonKey(): string {
  return currentTaxSeason();
}

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
            const paid = await fetchSeasonPaid(seasonKey());
            if (!cancelled) {
              setSeasonPaidState(paid);
              if (!paid) setSeasonPaid(seasonKey(), false);
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
    const season = seasonKey();
    setSeasonPaid(season, true);
    setSeasonPaidState(true);
  }, []);

  const refreshSeasonPaid = useCallback(async () => {
    if (!navigator.onLine || !googleUser) return;
    const season = seasonKey();
    const paid = await fetchSeasonPaid(season);
    setSeasonPaidState(paid);
    if (paid) setSeasonPaid(season, true);
  }, [googleUser]);

  return {
    hydrated,
    googleUser,
    isSignedIn: googleUser !== null,
    seasonPaid,
    currentSeason: seasonKey(),
    signInWithGoogle,
    signOut,
    markSeasonPaid,
    refreshSeasonPaid,
  };
}
