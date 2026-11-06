import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LegalPage, Mail } from "@/components/LegalPage";
import { COMPANY } from "@/config/company";
import { TERMS_VERSION, LEGAL_UPDATED } from "@/config/legal";
import { usePageMeta, type PageMeta } from "@/seo/meta";

// Terms for business customers (tradespeople and trade businesses). If you change
// anything material, bump TERMS_VERSION and update LEGAL_UPDATED: signed-in users
// are then asked to accept the new version.

export const termsIntro = (<p>
      These terms are the agreement between you and {COMPANY.legalName} ("we", "us") for using Quotable. Please read
      them, especially section 5 (checking your quotes) and section 10 (our liability). Our{" "}
      <Link to="/privacy">privacy policy</Link> explains how we handle personal data.
    </p>);

export const termsSections: { id: string; title: string; body: ReactNode }[] = [
    {
      id: "who",
      title: "Who Quotable is for",
      body: (
        <p>
          Quotable is for businesses: sole traders, partnerships and companies using it for their trade. By creating an
          account you confirm you're using it for your business, not as a consumer, and that you're 18 or over and able to
          agree to these terms for your business.
        </p>
      ),
    },
    {
      id: "account",
      title: "Your account",
      body: (
        <ul>
          <li>Give accurate details and keep them up to date.</li>
          <li>Keep your login private. You're responsible for what happens under your account.</li>
          <li>Tell us straight away at <Mail /> if you think someone else has accessed it.</li>
        </ul>
      ),
    },
    {
      id: "plans",
      title: "Free month, subscription and cancelling",
      body: (
        <>
          <p>
            <strong>Free month.</strong> New accounts get the first month free. You add a payment card through Stripe when
            you start. Unless you cancel before the free month ends, your subscription starts automatically and you'll be
            charged the plan price you chose.
          </p>
          <p>
            <strong>Price and renewal.</strong> Plans are monthly or yearly, at the price shown when you sign up. They renew
            automatically at the end of each period until you cancel. If we change the price, we'll give you at least 30
            days' notice by email before it applies to you, so you can cancel first.
          </p>
          <p>
            <strong>Cancelling.</strong> You can cancel at any time from Account, then Manage subscription. You keep access
            until the end of the period you've paid for, and you won't be charged again. Payments already made aren't
            refunded for unused time, unless the law requires it.
          </p>
          <p>
            <strong>Fair use.</strong> To keep Quotable fast and affordable for everyone, there are generous daily limits on
            AI quotes per account. Normal use won't reach them; if you need more, ask us.
          </p>
          <p>If a payment fails, Stripe will try again and email you. Your account may be paused until the payment goes through.</p>
        </>
      ),
    },
    {
      id: "service",
      title: "What Quotable does",
      body: (
        <p>
          Quotable helps you create quotes and invoices, send them to customers, track jobs and keep records. It uses AI to
          suggest materials, quantities and labour from your job description, and reads prices from UK merchants' public
          websites. We may improve, change or remove features over time. If we remove something important that you pay
          for, we'll tell you in advance.
        </p>
      ),
    },
    {
      id: "check",
      title: "Checking your quotes",
      body: (
        <>
          <p>
            <strong>Quotable is a tool to help you price. You're responsible for every quote and invoice you send.</strong>{" "}
            In particular:
          </p>
          <ul>
            <li>
              Materials, quantities and labour times suggested by the AI are estimates. They can be wrong or leave things out.
              Check them against the job before you send anything.
            </li>
            <li>
              Merchant prices are read from public websites at a point in time. They may have changed, may not include
              delivery, may differ in store or on a trade account, and can occasionally be matched to the wrong product. Each
              priced line links to its source so you can check it.
            </li>
            <li>
              We're not connected with, or endorsed by, Toolstation, Wickes, Travis Perkins or any other merchant. Their names
              are used only to show where a price came from.
            </li>
            <li>
              You're responsible for meeting the rules that apply to your work and your business, such as building
              regulations, Part P and other certification, VAT and tax, and consumer law for your own customers. Reports and
              tax figures in Quotable are there to help, and aren't accounting or tax advice.
            </li>
            <li>Your contract for the work is between you and your customer. We're not part of it.</li>
          </ul>
        </>
      ),
    },
    {
      id: "your-data",
      title: "Your data and your customers' data",
      body: (
        <>
          <p>
            <strong>It's yours.</strong> You own what you put into Quotable. You give us permission to store and process it
            only to run Quotable for you. You can export your data from Settings at any time.
          </p>
          <p>
            <strong>Your customers' personal data.</strong> For the details of your customers that you add, you're the
            controller and we're your processor under UK data protection law. You confirm you have a lawful reason to add
            and use their details, and to send them quotes and invoices. We will:
          </p>
          <ul>
            <li>only process that data to provide Quotable to you, following your instructions in how you use it, unless the law requires otherwise;</li>
            <li>make sure anyone who can access it is bound by confidentiality;</li>
            <li>keep it secure with appropriate technical and organisational measures (see our <Link to="/privacy#security">privacy policy</Link>);</li>
            <li>use only the sub-processors listed in our <Link to="/privacy#share">privacy policy</Link>, under contracts with the same protections, and tell you before adding new ones so you can object or leave;</li>
            <li>help you respond to your customers' requests to exercise their rights, and with any security or data protection assessments you need to do;</li>
            <li>tell you without undue delay if we become aware of a breach affecting that data;</li>
            <li>delete it, or let you export it, when your account closes (we delete within 90 days unless the law requires us to keep it);</li>
            <li>give you the information you reasonably need to show these obligations are being met.</li>
          </ul>
          <p>
            <strong>Customer links.</strong> Anyone with a quote or invoice link can open it, so only send it to the right
            person. You can stop sharing a link at any time from the quote or invoice.
          </p>
        </>
      ),
    },
    {
      id: "use",
      title: "Using Quotable fairly",
      body: (
        <>
          <p>You agree not to:</p>
          <ul>
            <li>break the law using Quotable, or send misleading quotes or invoices;</li>
            <li>try to access other people's accounts or data, or get round security or usage limits;</li>
            <li>overload, disrupt, copy, scrape or reverse-engineer the service, or use automated tools to make quotes in bulk;</li>
            <li>upload malware, or content you don't have the right to use;</li>
            <li>resell Quotable or share your account outside your business.</li>
          </ul>
          <p>We can suspend accounts that break these rules, and will tell you why unless the law or a security risk prevents it.</p>
        </>
      ),
    },
    {
      id: "availability",
      title: "Availability",
      body: (
        <p>
          We work to keep Quotable available and to back up data, but can't promise it will always be uninterrupted or
          error-free. Sometimes we'll need to take it offline briefly for maintenance; where we can, we'll do this at quiet
          times and give notice.
        </p>
      ),
    },
    {
      id: "ip",
      title: "Our intellectual property",
      body: (
        <p>
          Quotable's software, design, name and logo belong to {COMPANY.legalName}. Your subscription gives you a right to use
          Quotable for your business while it's active; it doesn't transfer ownership of any of it. Quotes and invoices you
          create are yours to use however you like.
        </p>
      ),
    },
    {
      id: "liability",
      title: "Our liability",
      body: (
        <>
          <p>
            Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for
            anything else that can't legally be limited.
          </p>
          <p>Apart from that:</p>
          <ul>
            <li>
              we aren't liable for loss of profit, revenue, business, contracts or goodwill, or for any indirect or
              consequential loss;
            </li>
            <li>
              we aren't liable for losses arising from the prices, quantities or other content of quotes and invoices you send,
              which you're responsible for checking (section 5);
            </li>
            <li>
              our total liability to you for everything arising out of these terms in any 12 months is limited to the greater
              of £100 or the amount you paid us in those 12 months.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "ending",
      title: "Ending the agreement",
      body: (
        <p>
          You can stop using Quotable and cancel at any time (section 3). We can end or suspend your account if you seriously
          or repeatedly break these terms, if payment isn't made, or, with at least 30 days' notice, if we stop offering
          Quotable. After your account ends you'll have 30 days to export your data, after which we delete it as set out in
          our <Link to="/privacy#retention">privacy policy</Link>.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to these terms",
      body: (
        <p>
          We may update these terms, for example when we add features or the law changes. We'll tell you about important
          changes by email or in the app at least 30 days before they apply, unless they're needed sooner for legal or
          security reasons. If you don't agree, you can cancel before they take effect.
        </p>
      ),
    },
    {
      id: "general",
      title: "General",
      body: (
        <ul>
          <li>These terms and our privacy policy are the whole agreement between us about Quotable.</li>
          <li>If part of these terms can't be enforced, the rest still applies.</li>
          <li>If we don't enforce a right straight away, we can still enforce it later.</li>
          <li>We may transfer this agreement to a company that takes over Quotable; your rights won't be reduced. You need our permission to transfer it.</li>
          <li>Nobody else has rights under these terms.</li>
          <li>We aren't responsible for delays caused by events outside our reasonable control.</li>
          <li>These terms are governed by the law of England and Wales, and the courts of England and Wales deal with any dispute.</li>
        </ul>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      body: (
        <p>
          {COMPANY.legalName}, {COMPANY.registeredOffice}. Email <Mail />.
        </p>
      ),
    },
];

export const termsMeta: PageMeta = {
  path: "/terms",
  title: "Terms and conditions | Quotable",
  description: "The terms for using Quotable, quoting and invoicing software for UK tradespeople, provided by Quotable Ltd.",
};

const Terms = () => {
  usePageMeta(termsMeta);

  return (
    <LegalPage
      title="Terms and conditions"
      version={TERMS_VERSION}
      updated={LEGAL_UPDATED}
      intro={termsIntro}
      sections={termsSections}
    />
  );
};

export default Terms;
