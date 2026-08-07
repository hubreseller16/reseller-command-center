/**
 * Cookie consent for UI-preference cookies (currently: sidebar collapsed state).
 *
 * Rules:
 * - Nothing is written to `document.cookie` until the user explicitly accepts.
 * - The consent decision itself is kept in localStorage (not a cookie), so
 *   declining never results in a cookie being set.
 * - Declining clears any previously written preference cookies.
 */
import { useCallback, useEffect, useState } from "react";

export const CONSENT_KEY = "sv:cookie-consent";
export const SIDEBAR_COOKIE = "sv_sidebar_collapsed";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ConsentValue = "accepted" | "declined" | null;

export function readConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* cookies blocked — state stays in-memory for this session */
  }
}

export function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/** Consent state + setters. `decided` is false until the user chooses. */
export function useCookieConsent() {
  const [consent, setConsentState] = useState<ConsentValue>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsentState(readConsent());
    setHydrated(true);
  }, []);

  const setConsent = useCallback((value: Exclude<ConsentValue, null>) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* ignore */
    }
    if (value === "declined") clearCookie(SIDEBAR_COOKIE);
    setConsentState(value);
    window.dispatchEvent(new CustomEvent("sv:consent", { detail: value }));
  }, []);

  return { consent, setConsent, hydrated, accepted: consent === "accepted" };
}
