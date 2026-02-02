import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CookiePreferences = {
  necessary: boolean; // Immer true
  analytics: boolean;
  marketing: boolean;
};

type CookieConsentContextType = {
  preferences: CookiePreferences;
  hasConsented: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  acceptNecessary: () => void;
  savePreferences: (prefs: Partial<CookiePreferences>) => void;
  openSettings: () => void;
  closeBanner: () => void;
};

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const STORAGE_KEY = "ki2go_cookie_consent";

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Lade gespeicherte Präferenzen beim Start
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({
          necessary: true, // Immer true
          analytics: parsed.analytics ?? false,
          marketing: parsed.marketing ?? false,
        });
        setHasConsented(true);
        setShowBanner(false);
      } catch {
        setShowBanner(true);
      }
    } else {
      // Zeige Banner nach kurzer Verzögerung für bessere UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveToStorage = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      timestamp: new Date().toISOString(),
    }));
  };

  const acceptAll = () => {
    const newPrefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(newPrefs);
    setHasConsented(true);
    setShowBanner(false);
    saveToStorage(newPrefs);
  };

  const acceptNecessary = () => {
    const newPrefs: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(newPrefs);
    setHasConsented(true);
    setShowBanner(false);
    saveToStorage(newPrefs);
  };

  const savePreferences = (prefs: Partial<CookiePreferences>) => {
    const newPrefs: CookiePreferences = {
      necessary: true, // Immer true
      analytics: prefs.analytics ?? preferences.analytics,
      marketing: prefs.marketing ?? preferences.marketing,
    };
    setPreferences(newPrefs);
    setHasConsented(true);
    setShowBanner(false);
    saveToStorage(newPrefs);
  };

  const openSettings = () => {
    setShowBanner(true);
  };

  const closeBanner = () => {
    if (hasConsented) {
      setShowBanner(false);
    }
  };

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        hasConsented,
        showBanner,
        acceptAll,
        acceptNecessary,
        savePreferences,
        openSettings,
        closeBanner,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}
