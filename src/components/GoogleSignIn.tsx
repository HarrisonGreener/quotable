import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// "Continue with Google" that signs in on quotable.uk itself (Google Identity Services),
// so Google's window says Quotable / quotable.uk rather than the database address.
// Falls back to the redirect sign-in if Google's script can't load.

const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "1005292993998-e3ju1k6410tabdunp9jhiebi1dg60ueq.apps.googleusercontent.com";

type Gsi = {
  accounts: {
    id: {
      initialize: (o: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

let scriptPromise: Promise<Gsi> | null = null;
const loadGsi = () => {
  const w = window as unknown as { google?: Gsi };
  if (w.google?.accounts?.id) return Promise.resolve(w.google);
  scriptPromise ??= new Promise<Gsi>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error("no gsi")));
    s.onerror = () => { scriptPromise = null; reject(new Error("gsi failed")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
};

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const GoogleSignIn = ({ onSignedIn, disabled }: { onSignedIn: () => void; disabled?: boolean }) => {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const gsi = await loadGsi();
        const nonce = crypto.randomUUID() + crypto.randomUUID();
        const hashed = await sha256(nonce);
        if (!live || !box.current) return;
        gsi.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          callback: async ({ credential }: { credential: string }) => {
            const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential, nonce });
            if (error) toast.error(error.message);
            else onSignedIn();
          },
        });
        gsi.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.min(400, box.current.offsetWidth || 320),
        });
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => { live = false; };
  }, [onSignedIn]);

  const redirectSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  if (failed) {
    return (
      <button
        type="button"
        onClick={redirectSignIn}
        disabled={disabled}
        className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-background text-sm font-medium hover:bg-muted"
      >
        Continue with Google
      </button>
    );
  }
  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <div ref={box} className="flex min-h-[44px] w-full justify-center" />
    </div>
  );
};
