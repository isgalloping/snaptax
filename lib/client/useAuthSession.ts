"use client";

import { useCallback, useEffect, useState } from "react";
import type { Industry } from "@/lib/types";
import {
  type GoogleUser,
  loadGoogleUser,
  saveGoogleUser,
  setSeasonPaid,
} from "@/lib/client/authStorage";
import {
  fetchAuthMe,
  fetchSeasonEntitlement,
  signInWithGoogleApi,
  type GoogleAuthResponse,
} from "@/lib/client/authApi";
import { signOutAndResetSession } from "@/lib/client/signOutFlow";
import { clearSeasonExportDone } from "@/lib/settings/seasonExportState";
import { currentTaxSeason } from "@/lib/tax/season";

function seasonKey(): string {
  return currentTaxSeason();
}

export function useAuthSession() {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [seasonPaid, setSeasonPaidState] = useState(false);
  const [entitlementStatus, setEntitlementStatus] = useState<string | null>(
    null,
  );
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
            if (me.user.industry) {
              setIndustry(me.user.industry as Industry);
            }
            const ent = await fetchSeasonEntitlement(seasonKey());
            if (!cancelled) {
              setSeasonPaidState(ent.paid);
              setEntitlementStatus(ent.status);
              if (!ent.paid) setSeasonPaid(seasonKey(), false);
            }
          } else {
            setGoogleUser(null);
            saveGoogleUser(null);
            setIndustry(null);
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

  const applyGoogleSignIn = useCallback((result: GoogleAuthResponse) => {
    const user: GoogleUser = {
      email: result.user.email,
      name: result.user.name ?? result.user.email.split("@")[0] ?? "User",
    };
    setGoogleUser(user);
    saveGoogleUser(user);
    if (result.user.industry) {
      setIndustry(result.user.industry as Industry);
    }
    return user;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithGoogleApi();
    const user = applyGoogleSignIn(result);
    return { user, taxRecalcQueued: result.taxRecalcQueued };
  }, [applyGoogleSignIn]);

  const signOut = useCallback(async () => {
    await signOutAndResetSession();
    setGoogleUser(null);
    setSeasonPaidState(false);
    setEntitlementStatus(null);
    const season = seasonKey();
    setSeasonPaid(season, false);
    clearSeasonExportDone(season);
  }, []);

  const markSeasonPaid = useCallback(() => {
    const season = seasonKey();
    setSeasonPaid(season, true);
    setSeasonPaidState(true);
    setEntitlementStatus("active");
  }, []);

  const refreshSeasonPaid = useCallback(async () => {
    if (!navigator.onLine || !googleUser) return;
    const season = seasonKey();
    const ent = await fetchSeasonEntitlement(season);
    setSeasonPaidState(ent.paid);
    setEntitlementStatus(ent.status);
    setSeasonPaid(season, ent.paid);
  }, [googleUser]);

  const resetAfterAccountDelete = useCallback(() => {
    saveGoogleUser(null);
    setGoogleUser(null);
    setIndustry(null);
    setSeasonPaidState(false);
    setEntitlementStatus(null);
    clearSeasonExportDone(seasonKey());
  }, []);

  return {
    hydrated,
    googleUser,
    industry,
    isSignedIn: googleUser !== null,
    seasonPaid,
    entitlementStatus,
    currentSeason: seasonKey(),
    signInWithGoogle,
    applyGoogleSignIn,
    signOut,
    markSeasonPaid,
    refreshSeasonPaid,
    resetAfterAccountDelete,
  };
}
