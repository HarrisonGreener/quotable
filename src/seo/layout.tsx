// Shared page frame for the public SEO pages: navbar, breadcrumbs, call to action.
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { OFFER } from "@/config/offer";

export const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="px-4 pt-28 sm:pt-32 pb-24">{children}</main>
    <Footer />
  </div>
);

export const Crumbs = ({ items }: { items: [string, string?][] }) => (
  <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
    <ol className="flex flex-wrap gap-x-2">
      {items.map(([label, to], i) => (
        <li key={label} className="flex gap-2">
          {to ? <Link to={to} className="hover:text-primary underline-offset-4 hover:underline">{label}</Link> : <span aria-current="page">{label}</span>}
          {i < items.length - 1 && <span aria-hidden>/</span>}
        </li>
      ))}
    </ol>
  </nav>
);

export const Cta = ({ title, text }: { title: string; text: string }) => (
  <section className="mt-16 rounded-md bg-primary text-white p-8 sm:p-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
    <div>
      <h2 className="text-2xl sm:text-3xl text-white">{title}</h2>
      <p className="mt-3 text-white/75 max-w-xl leading-relaxed">{text}</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
      <Button asChild variant="accent" size="lg" className="h-12 px-6"><Link to="/auth">{OFFER.button}</Link></Button>
      <Button asChild variant="ghost" size="lg" className="h-12 px-5 text-white hover:bg-white/10 hover:text-white"><Link to="/auth?demo=true">Try the sample account</Link></Button>
    </div>
  </section>
);

