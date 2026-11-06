import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { COMPANY } from "@/config/company";

// Shared layout for the terms and privacy policy: readable type, numbered sections,
// a contents list, and the company's legal details at the top.

export const LegalPage = ({ title, version, updated, intro, sections }: {
  title: string;
  version: string;
  updated: string;
  intro: ReactNode;
  sections: { id: string; title: string; body: ReactNode }[];
}) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="px-4 pt-24 sm:pt-32 pb-20">
      <article className="container mx-auto max-w-3xl">
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight text-primary">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Version {version} · last updated {updated}
        </p>
        <div className="legal mt-8">{intro}</div>

        <nav aria-label="Contents" className="mt-10 rounded-md border border-border bg-card px-5 py-4">
          <p className="text-sm font-semibold text-primary">Contents</p>
          <ol className="mt-2 grid gap-x-8 gap-y-0.5 sm:grid-cols-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-[2.25rem] sm:min-h-0 items-center text-foreground/80 hover:text-primary">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="legal mt-12 scroll-mt-24">
            <h2 className="text-2xl text-primary">{i + 1}. {s.title}</h2>
            {s.body}
          </section>
        ))}

        <p className="mt-14 border-t border-border pt-6 text-sm text-muted-foreground">
          {COMPANY.legalName}, a company registered in England and Wales, number {COMPANY.companyNumber}.
          Registered office: {COMPANY.registeredOffice}.{" "}
          <a className="underline underline-offset-2 hover:text-primary" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>
        </p>
      </article>
    </main>
    <Footer />
  </div>
);

export const Mail = () => (
  <a className="underline underline-offset-2 hover:text-primary" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>
);
