import type { ReactNode } from "react";

// The same terms / privacy text as the full pages, for the sign-up dialogs.
export const LegalDialogBody = ({ intro, sections }: { intro: ReactNode; sections: { id: string; title: string; body: ReactNode }[] }) => (
  <div className="legal text-sm">
    {intro}
    {sections.map((s, i) => (
      <section key={s.id} className="mt-6">
        <h3 className="text-base font-semibold text-primary">{i + 1}. {s.title}</h3>
        {s.body}
      </section>
    ))}
  </div>
);
