// Guides for running a trade business and going self-employed.
// Figures checked against gov.uk for the 2026/27 tax year (November 2026). Sources linked on each page.
import { P, UL, A, type BusinessGuide } from "./guideBits";
import { DAY_RATES } from "../dayRates";

const GOV = {
  register: ["Set up as a sole trader (gov.uk)", "https://www.gov.uk/set-up-sole-trader"] as [string, string],
  rates: ["Self-employed National Insurance rates (gov.uk)", "https://www.gov.uk/self-employed-national-insurance-rates"] as [string, string],
  incomeTax: ["Income Tax rates and Personal Allowances (gov.uk)", "https://www.gov.uk/income-tax-rates"] as [string, string],
  expenses: ["Expenses if you're self-employed (gov.uk)", "https://www.gov.uk/expenses-if-youre-self-employed"] as [string, string],
  mtd: ["Check when to sign up for Making Tax Digital for Income Tax (gov.uk)", "https://www.gov.uk/guidance/check-when-to-sign-up-for-making-tax-digital-for-income-tax"] as [string, string],
  cis: ["Construction Industry Scheme: subcontractors (gov.uk)", "https://www.gov.uk/what-you-must-do-as-a-cis-subcontractor"] as [string, string],
  vat: ["VAT registration (gov.uk)", "https://www.gov.uk/vat-registration"] as [string, string],
  ltd: ["Set up a limited company (gov.uk)", "https://www.gov.uk/set-up-limited-company"] as [string, string],
  cancel: ["Consumer Contracts Regulations: cancelling (gov.uk)", "https://www.gov.uk/accepting-returns-and-giving-refunds"] as [string, string],
  el: ["Employers' liability insurance (gov.uk)", "https://www.gov.uk/employers-liability-insurance"] as [string, string],
};

const GENERAL: BusinessGuide[] = [
  {
    slug: "making-tax-digital-for-tradespeople",
    h1: "Making Tax Digital for tradespeople: what changes and when",
    title: "Making Tax Digital for sole traders and tradespeople (2026): dates, thresholds, what to do",
    description: "Making Tax Digital for Income Tax started in April 2026 for sole traders earning over £50,000, and drops to £30,000 in April 2027 and £20,000 in April 2028. What it means for tradespeople and how to get ready.",
    intro: "Making Tax Digital (MTD) for Income Tax changes how self-employed tradespeople report to HMRC: digital records and quarterly updates instead of one return a year. Most sole-trader trades will be in it by 2028. Here's what you need to know.",
    sections: [
      { h: "When it applies to you", body: <>
        <P>It depends on your <strong>qualifying income</strong>: your turnover from self-employment plus any property income, before expenses.</P>
        <UL items={[
          <><strong>Over £50,000</strong> (on your 2024/25 return): from 6 April 2026.</>,
          <><strong>Over £30,000</strong> (on your 2025/26 return): from 6 April 2027.</>,
          <><strong>Over £20,000</strong> (on your 2026/27 return): from 6 April 2028.</>,
        ]} />
        <P>It's turnover, not profit. A plumber who bills £35,000 a year but takes home £22,000 after materials is in from April 2027.</P>
      </> },
      { h: "What you'll have to do", body: <>
        <UL items={[
          "Keep your income and expense records digitally, in software that works with MTD.",
          "Send a short quarterly update of your income and expenses to HMRC from that software, four times a year.",
          "Send a final declaration by 31 January after the tax year ends, which replaces the old Self Assessment return.",
        ]} />
        <P>You still pay tax on the same dates as now. The quarterly updates are summaries, not extra tax bills.</P>
      </> },
      { h: "How to get ready now", body: <>
        <UL items={[
          "Check your turnover on your last return against the thresholds above.",
          "Pick MTD-compatible software, or ask your accountant which they use. Xero, QuickBooks and FreeAgent all support it.",
          "Get every job invoiced properly, with a date and amount, so your income records are complete without retyping.",
          "Keep receipts for materials and expenses as you go, not in a shoebox in January.",
        ]} />
        <P>Quotable isn't MTD filing software, but it keeps every quote and invoice in one place and exports them in the format Xero, QuickBooks and FreeAgent expect, so your income side is already done. See <A to="/invoicing-software">invoicing for trades</A>.</P>
      </> },
    ],
    faqs: [
      ["Is Making Tax Digital based on turnover or profit?", "Turnover. HMRC calls it qualifying income: your total self-employment and property income before expenses."],
      ["Does Making Tax Digital apply to limited companies?", "Not MTD for Income Tax: that's for sole traders and landlords. Limited companies already use MTD for VAT if they're VAT-registered."],
      ["Do I need an accountant for Making Tax Digital?", "No, you can do it yourself with compatible software. Many tradespeople use an accountant, who can submit the updates for you."],
      ["What if I earn under £20,000?", "You're not required to join yet, and you carry on with a normal Self Assessment return. HMRC has said it will keep the lower threshold under review."],
    ],
    sources: [GOV.mtd],
    related: [
      ["Invoicing app for trades", "/invoicing-software", "Exports to Xero, QuickBooks, FreeAgent"],
      ["Tax-deductible expenses", "/guides/tax-deductible-expenses-for-tradespeople", "What you can claim"],
      ["VAT for tradespeople", "/guides/vat-for-tradespeople", "When to register"],
    ],
  },
  {
    slug: "how-much-to-charge-per-hour-self-employed",
    h1: "How much should I charge per hour as a self-employed tradesperson?",
    title: "How much to charge per hour as a self-employed tradesperson (UK 2026): work it out",
    description: "Work out your hourly and day rate from what you need to earn, your costs and the hours you can actually bill, with a worked example and typical UK trade rates for 2026.",
    intro: "Most new tradespeople copy what they were paid as an employee, then wonder why there's nothing left. Your rate has to cover the days you're not on the tools, your van, your insurance and your tax. Here's how to work it out properly.",
    sections: [
      { h: "1. Start from what you want to take home", body: <>
        <P>Decide the yearly income you need before tax. Say <strong>£40,000</strong>.</P>
      </> },
      { h: "2. Add your business costs", body: <>
        <P>Add up everything the business pays for in a year: van (finance, insurance, fuel, servicing), tools and their replacement, public liability insurance, phone, software, workwear, trade body or scheme fees, accountant, advertising. For a sole trader with a van, <strong>£10,000 to £15,000</strong> a year is common. Say £12,000.</P>
        <P>So the business needs to bring in <strong>£52,000</strong> a year before materials.</P>
      </> },
      { h: "3. Count the hours you can actually bill", body: <>
        <P>Start with 52 weeks. Take off holidays (about 5 weeks with bank holidays), a week or two for illness and quiet spells, and you have around <strong>45 working weeks</strong>.</P>
        <P>Then be honest about the day: quoting, buying materials, travel and paperwork aren't billable. Many trades bill about <strong>6 of every 8 hours</strong>. 45 weeks × 5 days × 6 hours = <strong>1,350 billable hours</strong>.</P>
      </> },
      { h: "4. Divide", body: <>
        <P>£52,000 ÷ 1,350 hours = <strong>about £38.50 an hour</strong>, or <strong>£310 a day</strong> for an 8-hour day. That's your floor: charge less and you earn less than you planned.</P>
        <P>Then sense-check it against your area. See typical <A to="/day-rates">day rates by trade and region</A>. If the market pays more, charge more. If your floor is above the market, look at your costs or the jobs you're taking.</P>
      </> },
      { h: "Hourly, daily or fixed price?", body: <>
        <P>Customers prefer a fixed price for a defined job. Work it out from your hours × your rate plus materials, then quote the total. Day rates suit open-ended work and other trades. Hourly suits small call-outs, usually with a minimum charge. Our <A to="/price-lists">trade price lists</A> show typical fixed prices for common jobs.</P>
      </> },
    ],
    faqs: [
      ["What's a good hourly rate for a tradesperson in the UK?", "It varies by trade and region. Most self-employed trades charge roughly £25 to £75 an hour in 2026, with London and the South East at the top. Work out your own floor from your costs and billable hours, then compare."],
      ["Should I charge for travel time?", "Build normal travel into your rate. For jobs far outside your usual area, add travel time or a mileage charge and say so on the quote."],
      ["Should I charge a call-out fee?", "Many trades charge a minimum of an hour or a fixed call-out for small jobs, because the travel and setup cost you the same however short the job."],
      ["How often should I put my rates up?", "Review them every year. If you're booked solid weeks ahead, your price is probably too low."],
    ],
    sources: [GOV.rates, GOV.incomeTax],
    related: [
      ["Day rates by trade", "/day-rates", "What trades charge per day, by region"],
      ["Trade price lists", "/price-lists", "Fixed prices for common jobs"],
      ["Quoting app", "/quoting-software", "Your rate applied to every job"],
    ],
  },
  {
    slug: "cis-explained-for-tradespeople",
    h1: "CIS explained for tradespeople: deductions, registration and refunds",
    title: "CIS explained (2026): the Construction Industry Scheme for subcontractors in plain English",
    description: "How the Construction Industry Scheme works for self-employed tradespeople: 20% or 30% deductions, gross payment status, registering, and claiming the money back.",
    intro: "If you work as a subcontractor for a builder or main contractor, they'll probably take money off your pay under the Construction Industry Scheme (CIS). It's not an extra tax: it's an advance payment towards your tax bill. Here's how it works.",
    sections: [
      { h: "Who it applies to", body: <>
        <P>CIS covers construction work done by a subcontractor for a contractor: building, alterations, repairs, decorating, plastering, plumbing and electrical work on buildings, and more. It does <strong>not</strong> apply to work you do directly for homeowners.</P>
      </> },
      { h: "How much is deducted", body: <>
        <UL items={[
          <><strong>20%</strong> if you're registered for CIS.</>,
          <><strong>30%</strong> if you're not registered.</>,
          <><strong>0%</strong> if you have gross payment status.</>,
        ]} />
        <P>The deduction is taken from your labour only, not from materials you supplied, so put materials on a separate line on your invoice.</P>
      </> },
      { h: "Registering", body: <>
        <P>Register as a CIS subcontractor with HMRC once you're registered as self-employed. It's free and saves you the extra 10%. Give contractors your name, UTR and National Insurance number so they can verify you.</P>
      </> },
      { h: "Getting it back", body: <>
        <P>The contractor gives you a monthly statement of what they've deducted. Keep every one. On your Self Assessment return, the deductions count as tax already paid, so most subcontractors get a refund once their allowances and expenses are taken into account.</P>
      </> },
      { h: "Gross payment status", body: <>
        <P>With gross payment status, contractors pay you in full and you pay your tax yourself. You need a good record of paying tax on time and enough construction turnover to qualify. It helps cash flow, but you must set money aside.</P>
      </> },
    ],
    faqs: [
      ["Is CIS deducted from materials?", "No. Deductions are only from the labour part of your invoice, so always show materials separately."],
      ["Does CIS apply to domestic customers?", "No. Homeowners paying you for work on their own home aren't contractors under CIS."],
      ["How do I get my CIS refund?", "Include the deductions on your Self Assessment return. If they're more than the tax you owe, HMRC repays the difference."],
      ["What's my UTR?", "Your Unique Taxpayer Reference, the 10-digit number HMRC gives you when you register for Self Assessment."],
    ],
    sources: [GOV.cis],
    related: [
      ["What to put on an invoice", "/guides/what-to-put-on-an-invoice", "Including CIS"],
      ["Register as self-employed", "/guides/how-to-register-as-self-employed-tradesperson", "Step by step"],
      ["Invoicing app", "/invoicing-software", "Separate labour and materials"],
    ],
  },
  {
    slug: "how-to-register-as-self-employed-tradesperson",
    h1: "How to register as a self-employed tradesperson (UK)",
    title: "How to register as self-employed as a tradesperson (UK 2026): step by step",
    description: "The steps to go self-employed as a UK tradesperson: registering with HMRC, deadlines, tax and National Insurance, CIS, insurance, and what to sort before your first job.",
    intro: "Going self-employed as a tradesperson is mostly paperwork you do once. Get these steps done and you can concentrate on the work.",
    sections: [
      { h: "1. Register with HMRC", body: <>
        <P>Register for Self Assessment as a sole trader once you earn more than £1,000 in a tax year from self-employment. The deadline is <strong>5 October</strong> after the end of the tax year you started in. You'll get a UTR (Unique Taxpayer Reference) by post.</P>
      </> },
      { h: "2. Understand your tax", body: <>
        <UL items={[
          "Income Tax on your profit (income minus allowable expenses) above the £12,570 Personal Allowance: 20% basic rate up to £50,270, 40% above that.",
          "Class 4 National Insurance: 6% on profits between £12,570 and £50,270, and 2% above.",
          "Your return and payment are due by 31 January after the tax year ends. Once your bill is over £1,000 you'll usually make payments on account in January and July too.",
        ]} />
        <P>Put aside around a quarter of every payment until you know your real bill. See <A to="/guides/tax-deductible-expenses-for-tradespeople">what expenses you can claim</A>.</P>
      </> },
      { h: "3. CIS if you'll subcontract", body: <>
        <P>If you'll work for builders or contractors, register for CIS so they deduct 20%, not 30%. See <A to="/guides/cis-explained-for-tradespeople">CIS explained</A>.</P>
      </> },
      { h: "4. Insurance", body: <>
        <P>Public liability insurance isn't a legal requirement, but most customers and contractors expect it. If you take anyone on as an employee, employers' liability insurance is a legal requirement. Insure your tools and van too.</P>
      </> },
      { h: "5. A business bank account and records", body: <>
        <P>A separate account makes your records far easier. Keep every invoice and receipt digitally: from April 2027, sole traders with turnover over £30,000 must keep digital records under <A to="/guides/making-tax-digital-for-tradespeople">Making Tax Digital</A>.</P>
      </> },
      { h: "6. Set your prices and paperwork", body: <>
        <P>Work out <A to="/guides/how-much-to-charge-per-hour-self-employed">your hourly and day rate</A>, then get a professional way to send <A to="/guides/how-to-write-a-quote">quotes</A> and <A to="/guides/what-to-put-on-an-invoice">invoices</A>. Customers judge you on your paperwork before they see your work.</P>
      </> },
    ],
    faqs: [
      ["How much can I earn before registering as self-employed?", "£1,000 a year from self-employment (the trading allowance). Above that you must register for Self Assessment."],
      ["When is the deadline to register?", "5 October after the end of the tax year in which you started. The tax year runs 6 April to 5 April."],
      ["Do I need to be VAT-registered?", "Only if your taxable turnover goes over £90,000 in any rolling 12 months. You can register voluntarily below that."],
      ["Should I be a sole trader or a limited company?", "Most trades start as sole traders because it's simpler. See our guide on sole trader vs limited company."],
    ],
    sources: [GOV.register, GOV.rates, GOV.incomeTax],
    related: [
      ["Sole trader or limited company?", "/guides/sole-trader-or-limited-company-tradesperson", "Which suits you"],
      ["How much to charge per hour", "/guides/how-much-to-charge-per-hour-self-employed", "Work out your rate"],
      ["Getting more customers", "/guides/how-to-get-more-customers-as-a-tradesperson", "Fill your diary"],
    ],
  },
  {
    slug: "sole-trader-or-limited-company-tradesperson",
    h1: "Sole trader or limited company: which is right for a tradesperson?",
    title: "Sole trader vs limited company for tradespeople (UK 2026): pros, cons and when to switch",
    description: "Should a UK tradesperson be a sole trader or a limited company? The differences in tax, paperwork, liability and how customers and contractors see you.",
    intro: "Almost every tradesperson starts as a sole trader. Some move to a limited company as they grow. Here's the honest difference.",
    sections: [
      { h: "Sole trader", body: <>
        <UL items={[
          "Simple to set up: register with HMRC and start.",
          "One Self Assessment return a year (plus Making Tax Digital updates once you're over the threshold).",
          "You pay Income Tax and Class 4 National Insurance on your profit.",
          "You're personally liable for business debts.",
        ]} />
      </> },
      { h: "Limited company", body: <>
        <UL items={[
          "A separate legal entity, registered at Companies House.",
          "The company pays Corporation Tax on its profit; you take money out as salary and dividends.",
          "More paperwork: annual accounts, a confirmation statement, a company tax return and payroll for yourself. Most use an accountant.",
          "Your personal liability is generally limited to what you put in, though banks and suppliers often ask directors for personal guarantees.",
          "Some commercial clients and main contractors prefer working with limited companies.",
        ]} />
      </> },
      { h: "When it's worth looking at", body: <>
        <P>The tax advantage depends on your profit, how you take money out and current rates, and it's narrowed in recent years. A common rule of thumb is to talk to an accountant once your profit is regularly above the higher-rate threshold (£50,270), or when contract work makes a company sensible.</P>
      </> },
    ],
    faqs: [
      ["Is a limited company better for tax?", "Sometimes, at higher profits, but not always, and the extra accountancy costs eat into it. Get advice based on your own numbers."],
      ["Can I switch from sole trader to limited company later?", "Yes. Many trades start as sole traders and incorporate as they grow."],
      ["What do I need on my quotes as a limited company?", "Your full registered company name, and on business letters, order forms and websites, your company number and registered office address."],
    ],
    sources: [GOV.register, GOV.ltd],
    related: [
      ["Register as self-employed", "/guides/how-to-register-as-self-employed-tradesperson", "Step by step"],
      ["How to write a quote", "/guides/how-to-write-a-quote", "What to include"],
      ["VAT for tradespeople", "/guides/vat-for-tradespeople", "Thresholds and rates"],
    ],
  },
  {
    slug: "tax-deductible-expenses-for-tradespeople",
    h1: "Tax-deductible expenses for tradespeople: what you can claim",
    title: "Tax-deductible expenses for self-employed tradespeople (UK 2026): van, tools, mileage and more",
    description: "What self-employed UK tradespeople can claim against tax: materials, tools, van or mileage, insurance, phone, workwear, training and more, with the rules that catch people out.",
    intro: "Every pound of allowable expense comes off your taxable profit. Plenty of tradespeople pay more tax than they need to because they don't claim everything. Here's what typically counts.",
    sections: [
      { h: "Usually allowable", body: <>
        <UL items={[
          <><strong>Materials</strong> you buy for customers' jobs.</>,
          <><strong>Tools and equipment.</strong> Bigger items are claimed as capital allowances, which for most small trades means the full cost in the year you buy them.</>,
          <><strong>Your van</strong>: either the actual costs (fuel, insurance, servicing, repairs, finance interest) plus capital allowances, or simplified mileage at 45p a mile for the first 10,000 business miles and 25p after. Pick one method per vehicle.</>,
          <><strong>Insurance</strong>: public liability, tools, van.</>,
          <><strong>Phone and software</strong>: the business share.</>,
          <><strong>Protective clothing and uniforms</strong>: workwear with your logo, safety boots, PPE. Everyday clothes don't count.</>,
          <><strong>Training</strong> that updates skills for your current trade, such as a wiring regulations update.</>,
          <><strong>Trade bodies and schemes</strong>, advertising, website, accountant's fees and bank charges.</>,
        ]} />
      </> },
      { h: "What catches people out", body: <>
        <UL items={[
          "Travel from home to a regular place of work, and personal use of the van, aren't allowable.",
          "Training for a brand-new skill outside your current trade usually isn't allowable.",
          "You can't claim the value of your own time, or fines.",
          "Keep receipts: HMRC can ask for them for years after the return.",
        ]} />
      </> },
    ],
    faqs: [
      ["Can I claim my van as a tradesperson?", "Yes, for business use: either actual costs plus capital allowances, or simplified mileage (45p a mile for the first 10,000 miles, 25p after)."],
      ["Can I claim tools I already owned?", "Usually yes, at their market value when you brought them into the business. Ask your accountant how to record it."],
      ["Can I claim my phone bill?", "The business share of it. If it's a separate business phone, the full cost."],
      ["Can I claim working from home?", "If you do your admin from home you can claim a proportion of household costs, or a simplified flat rate based on hours worked."],
    ],
    sources: [GOV.expenses],
    related: [
      ["Making Tax Digital", "/guides/making-tax-digital-for-tradespeople", "Digital records from 2026"],
      ["How much to charge per hour", "/guides/how-much-to-charge-per-hour-self-employed", "Cover your costs"],
      ["Invoicing app", "/invoicing-software", "Records your accountant can use"],
    ],
  },
  {
    slug: "how-much-deposit-to-ask-for",
    h1: "How much deposit should a tradesperson ask for?",
    title: "How much deposit should a tradesperson ask for? (UK): amounts, when, and the rules",
    description: "How much deposit UK tradespeople usually take, when to ask for stage payments, how to put it on the quote, and the 14-day cancellation rules for jobs agreed in a customer's home.",
    intro: "A deposit covers your materials and shows the customer is serious. There's no fixed legal amount, but there are a few rules worth knowing.",
    sections: [
      { h: "How much is normal", body: <>
        <UL items={[
          <><strong>Small jobs</strong> (a day or two): often no deposit, or enough to cover special-order materials.</>,
          <><strong>Medium jobs</strong>: commonly 10% to 25%, or the cost of the materials.</>,
          <><strong>Bigger jobs</strong>: a deposit, then stage payments tied to finished stages (first fix, plastering done, and so on) so you're never too far out of pocket.</>,
        ]} />
        <P>Avoid asking for most of the money up front on domestic work. It worries customers and puts them off.</P>
      </> },
      { h: "Put it on the quote", body: <>
        <P>Say how much deposit, when it's due, what it covers, and when the rest is paid. It stops arguments later. With Quotable, customers can pay the deposit straight from the quote when they accept it.</P>
      </> },
      { h: "The 14-day cancellation rule", body: <>
        <P>If you agree a job with a homeowner <strong>in their home</strong> (an off-premises contract) or remotely by phone, email or online, they usually have <strong>14 days to cancel</strong> under the Consumer Contracts Regulations, and you must tell them so in writing. If they ask you to start within the 14 days and then cancel, they pay for the work done so far. If you don't give them the cancellation information, the cancellation period can be extended and you may not be able to charge for work done.</P>
      </> },
    ],
    faqs: [
      ["Is it legal to ask for a deposit?", "Yes. Agree it in writing on the quote, with what it covers."],
      ["Is a deposit refundable?", "It depends on what you agreed and why the job was cancelled. Within the 14-day cancellation period a consumer is generally entitled to a refund, less the value of work already done at their request."],
      ["What's a reasonable deposit for building work?", "Commonly 10% to 25%, or the cost of materials, with stage payments for longer jobs."],
    ],
    sources: [GOV.cancel],
    related: [
      ["How to write a quote", "/guides/how-to-write-a-quote", "Including payment terms"],
      ["Chasing unpaid invoices", "/guides/how-to-chase-unpaid-invoices", "If they don't pay"],
      ["Quoting app", "/quoting-software", "Customers pay deposits online"],
    ],
  },
  {
    slug: "public-liability-insurance-for-tradespeople",
    h1: "Public liability insurance for tradespeople: do you need it?",
    title: "Do tradespeople need public liability insurance? (UK): what it covers and what's legally required",
    description: "Whether UK tradespeople legally need public liability insurance, what it covers, how much cover customers and contractors expect, and the insurance that is compulsory once you employ someone.",
    intro: "Public liability insurance is one of the first things new tradespeople ask about. Here's what's required, what's expected, and what it covers.",
    sections: [
      { h: "Is it a legal requirement?", body: <>
        <P>No. Public liability insurance isn't legally required for sole traders. But most domestic customers expect it, many contractors and commercial clients won't use you without it, and trade schemes and directories usually require it.</P>
        <P><strong>Employers' liability insurance</strong> is different: it's a legal requirement as soon as you employ someone, with limited exceptions.</P>
      </> },
      { h: "What it covers", body: <>
        <P>Claims from members of the public (including your customers) for injury or damage to their property caused by your work. For example, water damage from a fitting that fails, or a customer tripping over your tools.</P>
        <P>It doesn't cover your own tools, your van, or poor workmanship itself. Those need separate cover.</P>
      </> },
      { h: "How much cover", body: <>
        <P>£1 million, £2 million and £5 million are common levels. Domestic work is often fine at £1 or £2 million; commercial sites and main contractors often ask for £5 million. Check what your clients require before you buy.</P>
      </> },
    ],
    faqs: [
      ["Is public liability insurance a legal requirement for tradespeople?", "No, but it's expected by most customers and contractors. Employers' liability insurance is a legal requirement once you employ someone."],
      ["How much public liability cover do I need?", "Commonly £1 million to £5 million. Commercial sites usually want £5 million."],
      ["Should I show my insurance on my quotes?", "Yes. Mentioning it on your quotes builds trust, and some customers will ask to see the certificate."],
    ],
    sources: [GOV.el],
    related: [
      ["Register as self-employed", "/guides/how-to-register-as-self-employed-tradesperson", "Everything to set up"],
      ["How to write a quote", "/guides/how-to-write-a-quote", "Build trust on paper"],
      ["Tax-deductible expenses", "/guides/tax-deductible-expenses-for-tradespeople", "Insurance is claimable"],
    ],
  },
  {
    slug: "how-to-get-more-customers-as-a-tradesperson",
    h1: "How to get more customers as a tradesperson",
    title: "How to get more customers as a tradesperson (UK): 10 ways that work in 2026",
    description: "Practical ways for UK tradespeople to get more work: Google Business Profile, reviews, quoting faster, referrals, local groups, trade directories and turning enquiries into jobs.",
    intro: "Most trades don't have a shortage of enquiries so much as a leak: slow quotes, no follow-up, nowhere to see reviews. Fix those first, then add more enquiries.",
    sections: [
      { h: "Win more of the enquiries you already get", body: <>
        <UL items={[
          <><strong>Quote fast.</strong> The first decent quote often wins. Getting the quote out the same day matters more than you'd think. <A to="/quoting-software">Quoting from the van</A> makes that possible.</>,
          <><strong>Look professional.</strong> A branded quote with a clear breakdown beats a price in a text message.</>,
          <><strong>Follow up</strong> two or three days after sending. A short "any questions on the quote?" wins jobs.</>,
          <><strong>Make it easy to say yes</strong>: one-tap acceptance and a deposit link.</>,
        ]} />
      </> },
      { h: "Get found locally", body: <>
        <UL items={[
          <><strong>Google Business Profile</strong>: free, and it's what shows in Google Maps. Add your service area, photos of real jobs and your hours.</>,
          <><strong>Reviews</strong>: ask every happy customer, and send them the link the same day.</>,
          <><strong>Local Facebook groups</strong> and community pages, where people ask for recommendations every day.</>,
          <><strong>Your van</strong>: name, phone number and website, clean and readable.</>,
        ]} />
      </> },
      { h: "Get work from people you know", body: <>
        <UL items={[
          "Ask for referrals and thank people who send them.",
          "Team up with other trades: plasterers, decorators, electricians and plumbers all pass work to each other.",
          "Keep in touch with past customers. A short message in spring and autumn brings repeat work.",
        ]} />
      </> },
      { h: "Paid leads and directories", body: <>
        <P>Lead sites and trade directories can fill gaps, but check the cost per job you actually win, not per lead, and don't rely on them alone.</P>
      </> },
    ],
    faqs: [
      ["What's the best free way for a tradesperson to get customers?", "A complete Google Business Profile with real photos and plenty of recent reviews, plus asking every happy customer for a referral."],
      ["Do I need a website as a tradesperson?", "It helps customers trust you and check your work, but a strong Google Business Profile matters more for most local trades."],
      ["How quickly should I send a quote?", "Same day or next day if you can. Speed and a clear, professional quote win a lot of jobs."],
    ],
    sources: [],
    related: [
      ["Quoting app", "/quoting-software", "Send quotes from the van"],
      ["How to write a quote", "/guides/how-to-write-a-quote", "Quotes that win jobs"],
      ["Free quote templates", "/quote-templates", "Look professional today"],
    ],
  },
];

// ── Going self-employed, by trade ────────────────────────────────

interface TradeStart {
  slug: string; tradeSlug: string; singular: string; article: "a" | "an"; plural: string;
  rules: string[];        // registrations and qualifications for this trade
  rulesSource?: [string, string];
  firstWork: string[];    // where new self-employed people in this trade find work
  softwareSlug: string; priceList?: string;
}

const STARTS: TradeStart[] = [
  {
    slug: "going-self-employed-as-an-electrician", tradeSlug: "electrician", singular: "electrician", article: "an", plural: "electricians", softwareSlug: "electricians", priceList: "electrician-price-list",
    rules: [
      "Work to the current edition of the IET Wiring Regulations (BS 7671) and keep your knowledge of amendments up to date.",
      "Notifiable electrical work in homes in England and Wales (Part P of the Building Regulations), such as new circuits or consumer unit changes, must be notified to building control. Joining a competent person scheme (such as NICEIC, NAPIT or ELECSA) lets you self-certify instead of paying building control each time.",
      "You'll issue certificates (EICs, minor works certificates, EICRs) for your work, so budget for test equipment and certification software.",
    ],
    rulesSource: ["Electrical safety standards: Part P (gov.uk)", "https://www.gov.uk/guidance/competent-person-scheme-current-schemes-and-how-schemes-are-authorised"],
    firstWork: ["EICRs for landlords and letting agents", "Small domestic jobs: sockets, lights, fans", "Subcontracting for builders and kitchen fitters"],
  },
  {
    slug: "going-self-employed-as-a-plumber", tradeSlug: "plumber", singular: "plumber", article: "a", plural: "plumbers", softwareSlug: "plumbers", priceList: "plumber-price-list",
    rules: [
      "Any work on gas appliances or pipework must be done by someone on the Gas Safe Register: it's a legal requirement.",
      "Fitting unvented hot water cylinders needs a recognised unvented qualification and notifying building control (or self-certifying through a scheme).",
      "Follow the Water Supply (Water Fittings) Regulations. Approved contractor schemes such as WaterSafe let you self-certify some work.",
    ],
    rulesSource: ["Gas Safe Register", "https://www.gassaferegister.co.uk/"],
    firstWork: ["Repairs and call-outs: taps, toilets, leaks", "Bathroom installs with a tiler you trust", "Subcontracting for builders and kitchen and bathroom fitters"],
  },
  {
    slug: "going-self-employed-as-a-plasterer", tradeSlug: "plasterer", singular: "plasterer", article: "a", plural: "plasterers", softwareSlug: "plasterers", priceList: "plasterer-price-list",
    rules: [
      "There's no licence needed to work as a plasterer, but an NVQ and a CSCS card are often required on building sites.",
      "Replacing a ceiling or partitions can fall under the Building Regulations (for example fire resistance), so check before you quote.",
    ],
    firstWork: ["Re-skims and patch repairs after other trades", "Ceilings: overboarding and replacing", "Subcontracting for builders on extensions and refurbs"],
  },
  {
    slug: "going-self-employed-as-a-painter-and-decorator", tradeSlug: "painter-decorator", singular: "painter and decorator", article: "a", plural: "painters and decorators", softwareSlug: "decorators", priceList: "decorator-price-list",
    rules: [
      "No licence is needed to work as a decorator. A CSCS card is often needed on commercial sites.",
      "If you work on older properties, be aware of lead paint and take the right precautions when sanding or stripping.",
      "Working at height on exteriors means using the right access: towers or scaffold from a competent supplier.",
    ],
    firstWork: ["Single rooms and hallways for homeowners", "End-of-tenancy work for landlords and letting agents", "Subcontracting for builders and other decorators"],
  },
  {
    slug: "going-self-employed-as-a-tiler", tradeSlug: "tiler", singular: "tiler", article: "a", plural: "tilers", softwareSlug: "tilers", priceList: "tiler-price-list",
    rules: [
      "No licence is needed to work as a tiler. A CSCS card is often needed on building sites.",
      "In bathrooms, tanking and waterproofing in wet areas is where most problems and claims come from, so price it properly.",
    ],
    firstWork: ["Splashbacks and small bathroom jobs", "Partnering with a plumber on bathroom refits", "Subcontracting for kitchen and bathroom companies"],
  },
  {
    slug: "going-self-employed-as-a-carpenter", tradeSlug: "carpenter", singular: "carpenter", article: "a", plural: "carpenters and joiners", softwareSlug: "carpenters", priceList: "carpenter-price-list",
    rules: [
      "No licence is needed to work as a carpenter or joiner. A CSCS card is often needed on building sites.",
      "Fire doors must be fitted to the manufacturer's instructions. Third-party certification schemes for fire door installers are increasingly asked for on commercial and rental work.",
      "Stud walls and loft work can fall under the Building Regulations, so check before you quote.",
    ],
    firstWork: ["Doors, skirting and flooring for homeowners", "Second fix for builders on refurbs", "Fencing and decking in spring and summer"],
  },
  {
    slug: "going-self-employed-as-a-builder", tradeSlug: "general-builder", singular: "builder", article: "a", plural: "builders", softwareSlug: "builders",
    rules: [
      "There's no licence to be a builder, but your work must meet the Building Regulations, and most structural work needs building control approval.",
      "Under the Construction (Design and Management) Regulations 2015, on domestic jobs the client's duties normally pass to the contractor, so you're responsible for planning and managing health and safety on site.",
      "Work on or near a shared wall may need a party wall agreement, which is the homeowner's responsibility but worth raising early.",
    ],
    rulesSource: ["Construction (Design and Management) Regulations 2015 (HSE)", "https://www.hse.gov.uk/construction/cdm/2015/index.htm"],
    firstWork: ["Small works: garden walls, repairs, alterations", "Fit-out work for other contractors", "Extensions once you have a reliable team of trades"],
  },
];

const tradeGuide = (t: TradeStart): BusinessGuide => {
  const day = DAY_RATES.find((d) => d.tradeSlug === t.tradeSlug);
  const lo = day ? Math.min(...day.rates.map((r) => r.low)) : null;
  const hi = day ? Math.max(...day.rates.map((r) => r.high)) : null;
  const Name = t.singular.charAt(0).toUpperCase() + t.singular.slice(1);
  return {
    slug: t.slug,
    h1: `Going self-employed as ${t.article} ${t.singular}: a UK checklist`,
    title: `How to go self-employed as ${t.article} ${t.singular} (UK 2026): registration, rates, getting work`,
    description: `Everything to sort when you go self-employed as ${t.article} ${t.singular} in the UK: HMRC registration, ${t.singular}-specific rules, insurance, what to charge${lo ? ` (typically £${lo}–£${hi} a day)` : ""}, finding work and quoting.`,
    intro: `Going self-employed as ${t.article} ${t.singular} means more control over your work and what you earn, and a lot more to organise. Here's the checklist, in the order to do it.`,
    sections: [
      { h: "1. Register with HMRC", body: <>
        <P>Register for Self Assessment as a sole trader by 5 October after the end of the tax year you start in. If you'll work for builders or main contractors, register for CIS too so they deduct 20%, not 30%. See <A to="/guides/how-to-register-as-self-employed-tradesperson">registering as self-employed</A> and <A to="/guides/cis-explained-for-tradespeople">CIS explained</A>.</P>
      </> },
      { h: `2. Rules and registrations for ${t.plural}`, body: <UL items={t.rules} /> },
      { h: "3. Insurance", body: <>
        <P>Public liability insurance isn't a legal requirement, but most customers and contractors expect it. Insure your tools and van. If you take someone on, employers' liability is compulsory. See <A to="/guides/public-liability-insurance-for-tradespeople">public liability for tradespeople</A>.</P>
      </> },
      { h: "4. Work out what to charge", body: <>
        {lo && day ? (
          <P>Self-employed {t.plural} in the UK typically charge <strong>£{lo}–£{hi} a day</strong> in 2026, depending on region. See the <A to={`/day-rates/${day.slug}`}>{t.singular} day rate by region</A>. Then work out your own floor from your costs: <A to="/guides/how-much-to-charge-per-hour-self-employed">how much to charge per hour</A>.</P>
        ) : (
          <P>Work out your own floor from your costs and billable hours: <A to="/guides/how-much-to-charge-per-hour-self-employed">how much to charge per hour</A>.</P>
        )}
        {t.priceList && <P>For fixed prices on common jobs, see the <A to={`/price-lists/${t.priceList}`}>{t.singular} price list</A>.</P>}
      </> },
      { h: "5. Where the first work comes from", body: <>
        <UL items={t.firstWork} />
        <P>More ideas in <A to="/guides/how-to-get-more-customers-as-a-tradesperson">how to get more customers</A>.</P>
      </> },
      { h: "6. Quotes, invoices and records", body: <>
        <P>Customers judge you on your quote before they see your work. Send clear, itemised <A to="/guides/how-to-write-a-quote">quotes</A>, take a <A to="/guides/how-much-deposit-to-ask-for">deposit</A> on bigger jobs, and keep digital records from day one: <A to="/guides/making-tax-digital-for-tradespeople">Making Tax Digital</A> applies to most sole traders by 2028.</P>
        <P>Quotable is built for this: describe the job and it lists the materials, prices them at UK merchants and adds your labour. See the <A to={`/quoting-software/${t.softwareSlug}`}>quoting app for {t.plural}</A>.</P>
      </> },
    ],
    faqs: [
      [`How much do self-employed ${t.plural} earn?`, lo ? `Day rates are typically £${lo}–£${hi} in 2026 depending on region. What you take home depends on how many days you fill and your costs: van, tools, insurance and tax.` : "It depends on your rates, how many days you fill and your costs. Work out your rate from your costs and billable hours."],
      [`Do I need qualifications to be a self-employed ${t.singular}?`, t.rules[0]],
      [`Do ${t.plural} need public liability insurance?`, "It's not a legal requirement, but most customers and contractors expect it. Employers' liability is compulsory if you employ anyone."],
      [`How do I register as a self-employed ${t.singular}?`, "Register for Self Assessment with HMRC as a sole trader by 5 October after the end of the tax year you start in, and for CIS if you'll work for contractors."],
    ],
    sources: [GOV.register, GOV.cis, ...(t.rulesSource ? [t.rulesSource] : [])],
    related: [
      [`Quoting app for ${t.plural}`, `/quoting-software/${t.softwareSlug}`, "Priced quotes in minutes"],
      ...(t.priceList ? [[`${Name} price list`, `/price-lists/${t.priceList}`, "Common jobs, 2026 prices"] as [string, string, string]] : []),
      ...(day ? [[`${Name} day rate`, `/day-rates/${day.slug}`, "By region"] as [string, string, string]] : []),
    ],
  };
};

export const MORE_BUSINESS_GUIDES: BusinessGuide[] = [...GENERAL, ...STARTS.map(tradeGuide)];
export const SELF_EMPLOYED_LINKS: [string, string, string][] = STARTS.map((t) => [`Going self-employed as ${t.article} ${t.singular}`, `/guides/${t.slug}`, "Registration, rules, rates, first work"]);
