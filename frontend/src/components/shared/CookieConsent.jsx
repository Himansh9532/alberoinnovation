import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "skillai-cookie-consent";
const COOKIE_CONSENT_EVENT = "skillai:open-cookie-settings";
const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

function getCookieConsent() {
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_KEY}=`));
  const value = cookie?.slice(COOKIE_CONSENT_KEY.length + 1);
  return value === "all" || value === "essential" ? value : null;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export default function CookieConsent() {
  const [choice, setChoice] = useState(() => getCookieConsent());
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const showSettings = () => {
      setSaveError("");
      setChoice(null);
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, showSettings);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, showSettings);
  }, []);

  const saveChoice = (value) => {
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${COOKIE_CONSENT_KEY}=${value}; Max-Age=${COOKIE_CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
      if (getCookieConsent() !== value) {
        throw new Error("The browser did not save the cookie preference.");
      }
      setChoice(value);
      setSaveError("");
    } catch (error) {
      console.error("Cookie preference could not be saved.", error);
      setSaveError("Your choice could not be saved. Please check your browser's cookie settings and try again.");
    }
  };

  if (choice) return null;

  return (
    <aside className="cookie-consent" aria-label="Cookie preferences">
      <div className="cookie-consent-copy">
        <strong>Cookie preferences</strong>
        <p>We use essential cookies for core site functionality. Choose whether to allow optional cookies.</p>
        {saveError && <p className="cookie-consent-error" role="alert">{saveError}</p>}
      </div>
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-consent-essential" onClick={() => saveChoice("essential")}>
          Essential only
        </button>
        <button type="button" className="cookie-consent-accept" onClick={() => saveChoice("all")}>
          Accept all
        </button>
      </div>
    </aside>
  );
}
