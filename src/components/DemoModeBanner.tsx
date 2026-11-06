import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** One slim strip on every page in demo mode. */
export const DemoModeBanner = () => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-accent/40 bg-accent/[0.06] px-4 py-3">
    <p className="text-sm text-foreground">
      You're looking at a sample account. Nothing you change here is saved.
    </p>
    <Button asChild size="sm" variant="accent" className="h-9 shrink-0">
      <Link to="/auth">Start your free month</Link>
    </Button>
  </div>
);
