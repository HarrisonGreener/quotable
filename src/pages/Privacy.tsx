import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LegalPage, Mail } from "@/components/LegalPage";
import { COMPANY } from "@/config/company";
import { PRIVACY_VERSION, LEGAL_UPDATED } from "@/config/legal";
import { usePageMeta, type PageMeta } from "@/seo/meta";

// Written for UK GDPR and the Data Protection Act 2018. If you add a new service that
// receives personal data (analytics, a CRM, a new AI provider), add it to "Who we share
// it with", bump PRIVACY_VERSION and update LEGAL_UPDATED.

const PROCESSORS: [string, string, string][] = [
  ["Supabase", "Database, sign-in, file storage and server functions", "UK (London); support staff may access from the US"],
  ["Vercel", "Hosting the website", "UK/EU edge servers, with the company in the US"],
  ["Stripe", "Subscription payments and invoices for your Quotable plan", "UK/EU and US"],
  ["Resend", "Sending account emails (sign-up, password reset)", "US"],
  ["Groq", "AI that turns a job description into materials and labour", "US"],
  ["Google (Gemini API, paid tier)", "AI, as a backup to Groq", "US and other Google locations"],
  ["IONOS", "Our email inbox", "UK/EU"],
];

export const privacyIntro = (<p>
      This policy explains what personal data {COMPANY.legalName} collects when you use Quotable, why, who it's shared
      with and the rights you have. We've tried to keep it plain. If anything's unclear, email <Mail />.
    </p>);

export const privacySections: { id: string; title: string; body: ReactNode }[] = [
    {
      id: "who",
      title: "Who we are",
      body: (
        <>
          <p>
            Quotable is run by {COMPANY.legalName}, a company registered in England and Wales (number {COMPANY.companyNumber}),
            registered office {COMPANY.registeredOffice}. You can contact us about anything in this policy at <Mail />.
          </p>
          <p>We have two roles, depending on whose data it is:</p>
          <ul>
            <li>
              <strong>Your account details</strong> (you, your business, your subscription): we decide how these are used, so
              we are the <em>controller</em>.
            </li>
            <li>
              <strong>Your customers' details</strong> (the names, addresses, phone numbers and job details you put on quotes,
              invoices and jobs): you decide what to collect and why, so you are the controller and we are your
              <em> processor</em>. We only use that data to run Quotable for you, as set out in section 6 of our{" "}
              <Link to="/terms#your-data">terms</Link>.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "collect",
      title: "What we collect",
      body: (
        <ul>
          <li><strong>Account details:</strong> your name, email address, password (stored scrambled, never readable), trade, and your business name, address, phone number, website, logo and VAT number.</li>
          <li><strong>Payment details for your invoices:</strong> bank details and a payment link, if you add them, so they appear on documents you send.</li>
          <li><strong>Your subscription:</strong> plan, status and billing history. Card details are taken by Stripe; we never see or store your card number.</li>
          <li><strong>What you create:</strong> job descriptions (typed or spoken), quotes, invoices, clients, jobs and schedules, stock and prices, photos you attach and your settings.</li>
          <li><strong>When your customers use a quote or invoice link:</strong> when it was opened, and the name they type if they accept.</li>
          <li><strong>Technical data:</strong> IP address, browser and device type, and logs of requests, kept by our hosting and database providers to keep the service secure and working.</li>
          <li><strong>Messages:</strong> anything you send us by email or through the app.</li>
        </ul>
      ),
    },
    {
      id: "use",
      title: "How we use it, and our legal basis",
      body: (
        <>
          <p>Data protection law requires a legal basis for each use. Ours are:</p>
          <div className="legal-table">
            <table>
              <thead><tr><th>What we do</th><th>Legal basis</th></tr></thead>
              <tbody>
                <tr><td>Create and run your account, generate quotes, store your documents, send customer links</td><td>Contract: we need it to provide the service you signed up for</td></tr>
                <tr><td>Take subscription payments and keep billing and tax records</td><td>Contract, and legal obligation (we must keep accounting records for six years)</td></tr>
                <tr><td>Send emails about your account, such as sign-up, password resets and changes to these terms</td><td>Contract</td></tr>
                <tr><td>Keep Quotable secure: prevent fraud and abuse, enforce fair-use limits, fix faults</td><td>Legitimate interests in running a safe, reliable service</td></tr>
                <tr><td>Improve Quotable using usage figures (for example how many quotes are made, or which prices weren't found)</td><td>Legitimate interests in improving the product</td></tr>
                <tr><td>Tell you about new features or offers</td><td>Your consent, or as an existing customer for similar services; you can opt out at any time</td></tr>
                <tr><td>Deal with legal claims or requests from authorities</td><td>Legal obligation, or legitimate interests in protecting our rights</td></tr>
              </tbody>
            </table>
          </div>
          <p>We don't sell personal data, and we don't use it for advertising.</p>
        </>
      ),
    },
    {
      id: "ai",
      title: "AI and live prices",
      body: (
        <>
          <p>
            When you create a quote, the job description and your relevant settings (such as your trade and rates) are sent to
            an AI provider, which suggests the materials, quantities and labour. Groq, our main provider, has zero data
            retention switched on for our account, so it doesn't store requests. Google's paid Gemini API, our backup, doesn't
            use what we send to improve its products. We don't use the free tier of any AI service that would.
          </p>
          <p>
            Only include what the AI needs to price the job. You don't need to put your customer's name or address in the job
            description; those go in the quote's customer fields, which aren't sent to the AI.
          </p>
          <p>
            To price materials, Quotable reads public product pages on UK merchants' websites. No personal data is sent to
            the merchants. The AI's suggestions are a starting point: no decision with legal or similar effects is made
            about anyone automatically.
          </p>
          <p>
            Spoken job descriptions are turned into text by your own browser's speech service (for example, Chrome uses
            Google's), under that browser's privacy terms. Quotable receives only the text.
          </p>
        </>
      ),
    },
    {
      id: "share",
      title: "Who we share it with",
      body: (
        <>
          <p>
            We use the following service providers to run Quotable. They act on our instructions, under contracts that
            protect your data, and only see what they need:
          </p>
          <div className="legal-table">
            <table>
              <thead><tr><th>Provider</th><th>What for</th><th>Where</th></tr></thead>
              <tbody>
                {PROCESSORS.map(([n, w, l]) => <tr key={n}><td>{n}</td><td>{w}</td><td>{l}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p>
            We'll update this list before adding a new provider that handles personal data. We may also share data if the law
            requires it, to protect our rights or someone's safety, or with a buyer if Quotable is ever sold (they'd be bound
            by this policy).
          </p>
          <p>
            Quotes and invoices you send are shared with whoever you send the link to: anyone with the link can open it, so
            only send it to your customer. If your customer pays through a payment link you've added (such as your own
            Stripe, SumUp or PayPal link), that payment is between you, them and that provider.
          </p>
        </>
      ),
    },
    {
      id: "transfers",
      title: "Data sent outside the UK",
      body: (
        <p>
          Some of the providers above are based in, or can be accessed from, the United States. Where personal data leaves
          the UK, it's protected by the UK's adequacy regulations (including the UK–US Data Bridge, for certified companies)
          or by the UK International Data Transfer Agreement or Addendum, which are contract terms approved for UK transfers.
          You can ask us for details.
        </p>
      ),
    },
    {
      id: "retention",
      title: "How long we keep it",
      body: (
        <ul>
          <li><strong>Your account and everything in it:</strong> for as long as you have an account. If you close it, we delete it within 90 days, apart from the records below.</li>
          <li><strong>Billing and tax records:</strong> six years after the end of the financial year they relate to, as the law requires.</li>
          <li><strong>Things you delete</strong> (a quote, a client): removed straight away, and gone from backups within 30 days.</li>
          <li><strong>Security logs:</strong> usually up to 30 days, kept by our hosting and database providers.</li>
          <li><strong>Daily usage counts</strong> used for fair-use limits: 90 days.</li>
        </ul>
      ),
    },
    {
      id: "security",
      title: "Keeping it safe",
      body: (
        <p>
          Data is encrypted in transit and at rest. Each account can only reach its own records, enforced by the database
          itself rather than just the app. Passwords are stored scrambled. Our own access is limited and protected with
          two-factor sign-in. Quote and invoice links use long random codes that can't be guessed. If a breach puts your
          data at risk, we'll tell you without delay and report it to the ICO within 72 hours where the law requires.
        </p>
      ),
    },
    {
      id: "rights",
      title: "Your rights",
      body: (
        <>
          <p>You have the right to:</p>
          <ul>
            <li>get a copy of your personal data;</li>
            <li>have it corrected if it's wrong;</li>
            <li>have it deleted;</li>
            <li>restrict or object to how we use it, including at any time to marketing;</li>
            <li>get it in a portable format (you can also export your data yourself from Settings);</li>
            <li>withdraw consent, where we rely on it.</li>
          </ul>
          <p>
            Email <Mail /> to use any of these. It's free, and we'll reply within one month. If your request is about a
            customer's data held in your account, we'll help you deal with it, since you're the controller for that data.
          </p>
          <p>
            If you're unhappy with how we've handled your data, please tell us first. You can also complain to the
            Information Commissioner's Office: <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer" target="_blank">ico.org.uk/make-a-complaint</a>,
            0303 123 1113.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and similar storage",
      body: (
        <>
          <p>Quotable only stores what it needs to work in your browser:</p>
          <ul>
            <li><strong>Sign-in:</strong> keeps you logged in between visits.</li>
            <li><strong>Preferences:</strong> things like your theme and the sample account's example data.</li>
          </ul>
          <p>
            These are strictly necessary, so the law doesn't require us to ask first. We don't use analytics, advertising or
            tracking cookies. If we ever add analytics, we'll ask for your permission before setting them. Stripe's
            checkout and billing pages set their own cookies to prevent fraud; see Stripe's privacy policy.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "Children",
      body: <p>Quotable is a business service for people aged 18 and over. We don't knowingly collect data about children.</p>,
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: (
        <p>
          If we change this policy in a way that matters, we'll tell you by email or in the app before the change takes
          effect. The version and date at the top show when it last changed.
        </p>
      ),
    },
];

export const privacyMeta: PageMeta = {
  path: "/privacy",
  title: "Privacy policy | Quotable",
  description: "How Quotable Ltd collects, uses and protects personal data, including the details your customers' quotes and invoices contain.",
};

const Privacy = () => {
  usePageMeta(privacyMeta);

  return (
    <LegalPage
      title="Privacy policy"
      version={PRIVACY_VERSION}
      updated={LEGAL_UPDATED}
      intro={privacyIntro}
      sections={privacySections}
    />
  );
};

export default Privacy;
