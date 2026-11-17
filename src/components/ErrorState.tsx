import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Inline "couldn't load this" box, in Quotable's style. */
export const ErrorState = ({
  title = "Couldn't load this",
  message = "Check your signal or Wi-Fi, then try again. Nothing you've saved has been lost.",
  onRetry,
}: ErrorStateProps) => {
  return (
    <div role="alert" className="my-6 rounded-lg border border-border bg-card p-6 text-center sm:p-8">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent">
        <WifiOff className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-primary">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="accent" className="mt-5 h-11 gap-2 px-5">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
};
