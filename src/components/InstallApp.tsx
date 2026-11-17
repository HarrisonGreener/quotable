import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Share, MoreVertical, PlusSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// "Add Quotable to your home screen": the steps for the phone you're on, plus a
// one-tap Install button where the browser offers it (Chrome on Android and desktop).

type Platform = "ios" | "android" | "desktop";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    window.dispatchEvent(new Event("quotable:installable"));
  });
}

export const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};

export const isInstalled = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);

const useInstallPrompt = () => {
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  useEffect(() => {
    const on = () => setCanPrompt(true);
    window.addEventListener("quotable:installable", on);
    return () => window.removeEventListener("quotable:installable", on);
  }, []);
  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    setCanPrompt(false);
    return outcome === "accepted";
  };
  return { canPrompt, install };
};

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{n}</span>
    <span className="leading-relaxed">{children}</span>
  </li>
);

const Key = ({ children }: { children: React.ReactNode }) => (
  <strong className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-primary">{children}</strong>
);

export const InstallSteps = ({ platform }: { platform: Platform }) => {
  if (platform === "ios") {
    return (
      <ol className="space-y-3">
        <Step n={1}>Open <Key>quotable.uk</Key> in <Key>Safari</Key> (Chrome on iPhone works the same way).</Step>
        <Step n={2}>Tap the <Key><Share className="h-4 w-4" aria-hidden /> Share</Key> button at the bottom of the screen (at the top on iPad).</Step>
        <Step n={3}>Scroll down and tap <Key><PlusSquare className="h-4 w-4" aria-hidden /> Add to Home Screen</Key>.</Step>
        <Step n={4}>Tap <Key>Add</Key>. Quotable now opens from your home screen like any other app.</Step>
      </ol>
    );
  }
  if (platform === "android") {
    return (
      <ol className="space-y-3">
        <Step n={1}>Open <Key>quotable.uk</Key> in <Key>Chrome</Key>.</Step>
        <Step n={2}>Tap the <Key><MoreVertical className="h-4 w-4" aria-hidden /> menu</Key> at the top right.</Step>
        <Step n={3}>Tap <Key>Install app</Key> or <Key>Add to Home screen</Key>.</Step>
        <Step n={4}>Tap <Key>Install</Key>. Quotable now opens from your home screen like any other app.</Step>
      </ol>
    );
  }
  return (
    <ol className="space-y-3">
      <Step n={1}>On your phone, open <Key>quotable.uk</Key> and follow the steps for iPhone or Android below.</Step>
      <Step n={2}>On a computer in Chrome or Edge, click the <Key><Download className="h-4 w-4" aria-hidden /> install</Key> icon at the right of the address bar.</Step>
    </ol>
  );
};

/** The full guide, used on the /app page. */
export const InstallGuide = () => {
  const [platform, setPlatform] = useState<Platform>("ios");
  const [installed, setInstalled] = useState(false);
  const { canPrompt, install } = useInstallPrompt();

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isInstalled());
  }, []);

  return (
    <div className="space-y-8">
      {installed && (
        <p className="rounded-md border border-border bg-card p-4">You're already using Quotable from your home screen.</p>
      )}
      {canPrompt && !installed && (
        <Button size="lg" variant="accent" className="h-12 px-6" onClick={install}>
          <Download className="mr-2 h-4 w-4" /> Install Quotable
        </Button>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Your device">
        {(["ios", "android", "desktop"] as Platform[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={platform === p}
            onClick={() => setPlatform(p)}
            className={`min-h-[2.75rem] rounded-md border px-4 text-sm font-semibold ${platform === p ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            {p === "ios" ? "iPhone or iPad" : p === "android" ? "Android" : "Computer"}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="rounded-md border border-border bg-card p-5 sm:p-6">
        <InstallSteps platform={platform} />
      </div>
    </div>
  );
};

/** A small dismissable prompt for phones, shown inside the app until installed or closed. */
export const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const { canPrompt, install } = useInstallPrompt();

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    let dismissed = false;
    try { dismissed = localStorage.getItem("quotable_install_dismissed") === "1"; } catch { /* storage blocked */ }
    setShow(p !== "desktop" && !isInstalled() && !dismissed);
  }, []);

  if (!show) return null;
  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem("quotable_install_dismissed", "1"); } catch { /* ignore */ }
  };

  return (
    <div className="relative rounded-md border border-border bg-card p-4 pr-10">
      <button onClick={dismiss} aria-label="Close" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <p className="font-semibold text-primary">Put Quotable on your home screen</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Open it with one tap, full screen, like any other app.{" "}
        {platform === "ios" ? (
          <>In Safari, tap <Share className="inline h-3.5 w-3.5 align-[-2px]" aria-label="Share" />, then <strong>Add to Home Screen</strong>.</>
        ) : canPrompt ? null : (
          <>In Chrome, tap <MoreVertical className="inline h-3.5 w-3.5 align-[-2px]" aria-label="menu" />, then <strong>Install app</strong>.</>
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {canPrompt && (
          <Button size="sm" variant="accent" onClick={async () => { if (await install()) setShow(false); }}>
            <Download className="mr-1.5 h-4 w-4" /> Install
          </Button>
        )}
        <Button size="sm" variant="outline" asChild><Link to="/app">Show me how</Link></Button>
      </div>
    </div>
  );
};
