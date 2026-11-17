import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Logo";
import { TapeMeasure } from "@/components/TapeLoader";
import { COMPANY } from "@/config/company";

// The "something went wrong" screen, in Quotable's style. The usual cause is a tab
// left open across an update asking for files that no longer exist; that case
// reloads the page by itself once, so most people never see this.

const STALE = /dynamically imported module|Importing a module script failed|Loading chunk/i;
const RELOAD_KEY = "quotable_auto_reload";

/** Reload once (not in a loop) when the page is out of date. Returns true if it reloaded. */
export const reloadIfStale = (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (!STALE.test(msg)) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 20000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
};

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  reloading: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, reloading: false };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlobalErrorBoundary caught:", error, errorInfo);
    if (reloadIfStale(error)) this.setState({ reloading: true });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.reloading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <TapeMeasure size={44} />
        </div>
      );
    }

    const home = import.meta.env.BASE_URL || "/";
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="px-5 py-5 sm:px-8">
          <a href={home} aria-label="Quotable home">
            <Wordmark size="md" />
          </a>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm sm:p-10">
            <div className="flex justify-center opacity-90">
              <TapeMeasure size={52} />
            </div>
            <h1 className="mt-6 font-heading text-2xl font-semibold text-primary">That didn't load properly</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A quick refresh usually sorts it. Anything you've already saved is safe.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="accent" size="lg" className="h-12 gap-2" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
                Refresh the page
              </Button>
              <Button variant="outline" size="lg" className="h-12" asChild>
                <a href={`${home.replace(/\/$/, "")}/dashboard`}>Go to dashboard</a>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Still stuck? Email{" "}
              <a className="font-medium text-primary underline underline-offset-2" href={`mailto:${COMPANY.supportEmail}`}>
                {COMPANY.supportEmail}
              </a>
            </p>
          </div>
        </main>
      </div>
    );
  }
}
