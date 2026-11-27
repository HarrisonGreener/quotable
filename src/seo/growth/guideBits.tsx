// Shared pieces for the written business guides.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Faq } from "./shared";

export interface BusinessGuide {
  slug: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  sections: { h: string; body: ReactNode }[];
  faqs: Faq[];
  sources: [string, string][];
  related: [string, string, string][];
}

export const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-foreground/85">{children}</p>;
export const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-accent leading-relaxed text-foreground/85">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);
export const A = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-medium text-primary underline underline-offset-2">{children}</Link>
);

