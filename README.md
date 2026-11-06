# Quotable-it

**Live preview: https://harrisongreener.github.io/quotable/**


Project Name: Quotable – AI-Powered Quoting, Invoicing & Tax SaaS

Goal:
Build a professional, interactive website and web app for Quotable that demonstrates:

AI-generated, location-based quotes

Quotes break down costs into individual products, materials, labour, and overheads

Smart Edit function for small manual quote adjustments

AI Adjuster for automatic tweaks to quotes

Saved quotes library

Invoice creation from quotes

Tax calculation per country

Financial dashboards and analytics

PDF export for quotes & invoices

Demo mode for unregistered users

Modern, branded UI (deep blue + burnt orange)

Professional typography

1️⃣ Website Structure & Pages

1. Landing / Home Page

Hero section: Tagline: “AI-Powered Quotes, Invoices & Insights for Freelancers and Contractors”

Logo: Burnt-orange “Q” + deep-blue “uotable”

Call-to-action buttons:

“Get Started” → Signup/Login

“See How It Works” → Demo mode overlay

Features section: Illustrations/cards for AI Quotes, Smart Edit, AI Adjuster, Save & Export, Invoices, Tax Summary

2. Login / Signup Page

Login area: Blank slate for real users

Users store their own quotes, invoices, and financial data

Starts empty — does not include demo data

Login form: Email / Password / Login button

Signup form: Name, Business Name, Email, Password

Demo mode button: “See How It Works”

Opens a pre-filled demo side with example quotes, invoices, and dashboards

Demo mode is interactive but does not save user data

Key distinction:

Login area: stores real user data

Demo side: pre-filled example data for exploration; no saving

3. Dashboard / Web App

Sidebar: Dashboard, Quotes, Invoices, Tax & Reports, Settings

Dashboard view:

Cards: Total Quotes, Total Invoices, Revenue, Outstanding Balance

Charts: Revenue over time, Paid vs Pending invoices

Quick action buttons: Create New Quote, Export Tax Report

4. Quotes Page

Input area for new quote: Job description, Location, Category

AI-powered estimate card:

Shows total cost broken down into products/materials, labour, overheads, regional adjustments

Optional AI explanation panel

Smart Edit button: allows manual small changes (adjust quantities, add/remove items, tweak labour hours)

AI Adjuster button: automatically recalculates totals based on tweaks (materials, labour, or regional costs)

Buttons: Save Quote, Export PDF

Saved quotes table with columns: Quote ID, Title, Date, Total, Status, Actions

5. Invoices Page

Convert saved quotes to invoices with pre-filled client details

Invoice table: Invoice ID, Client, Linked Quote, Amount, Tax, Total, Status, Actions

Buttons: Export PDF, Mark as Paid

6. Tax & Reports Page

Cards: Income to date, VAT/GST collected, Estimated Income Tax, Next Payment Deadline

Charts: Revenue by month, Paid vs Unpaid invoices

Button: Download Tax Summary PDF

7. Settings / Account Page

Account info: Name, Email, Business Name

Branding: Upload logo, customize PDF header/footer colors

Currency & tax region selection

2️⃣ Features & Functionalities

AI & Smart Features

AI-generated cost estimates include detailed product/material breakdown

Labour, overheads, and materials listed separately

Smart Edit: manually tweak small quote details (quantities, labour hours, minor cost changes)

AI Adjuster: automatically recalculates totals and adjustments based on edits or regional updates

AI learning indicator: improves estimates over time

User Experience Enhancements

Demo mode: pre-filled example data for exploration only

Login area: blank slate for real user data

Client library & autofill for repeated clients

Quote templates for different service types

Notifications & reminders for pending/overdue invoices

Compare multiple quotes side-by-side

Export & Sharing

Export quotes and invoices as PDF

Share via link or email

Branding customization for exported PDFs

Responsive & Accessibility

Desktop and mobile layouts

Collapsible sidebar for mobile

Scrollable panels for inputs and tables

3️⃣ Branding & Visual Design

Logo: Burnt-orange “Q” + Deep-blue “uotable”

Colors:

Primary: Deep Blue (#0C2340)

Accent: Burnt Orange (#D35400)

Background: Off-white (#F8F9FA)

Text: Charcoal (#1A1A1A)

Typography:

Headings: Montserrat SemiBold

Body / UI: Source Sans Pro

UI Elements:

Buttons: Deep Blue background, Burnt Orange hover, rounded corners 12–16px

Cards: Shadow and rounded corners, whitespace-rich

Charts: Deep Blue bars, Burnt Orange highlights

Tables: Clean, sortable, hover states

4️⃣ User Flow

Login / Signup → Option for Demo Mode

Dashboard shows totals, graphs, and quick actions

Create a quote → AI generates estimate with detailed product/material breakdown

Use Smart Edit to manually tweak small details

Use AI Adjuster to automatically recalc totals after tweaks

Save or Export Quote → Convert to Invoice → Export PDF → Mark as Paid

Tax & Reports dashboard auto-updates with invoices

Users access Settings for branding, currency, and tax regions

Key distinction:

Blank slate login area: stores actual user-generated prompts, quotes, and invoices

Demo mode: shows pre-filled example data for exploration only, does not save anything

5️⃣ Prototype Notes

Interactive buttons: Save Quote, Export PDF, Smart Edit, AI Adjuster, Convert to Invoice, Mark as Paid

Dashboard cards and charts update dynamically when quotes/invoices are manipulated

Sidebar navigation collapsible for mobile

PDF export templates match branding

AI quotes must show a clear breakdown of each product/material required, along with labour and overhead costs

Smart Edit and AI Adjuster should be visually distinct buttons next to each quote

## Running it

See **[SETUP.md](SETUP.md)** for the full self-hosting guide: Supabase, AI keys,
deploying the server functions, hosting the front end, and moving data off Lovable.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
cp .env.example .env   # fill in your Supabase details
npm i
npm run dev
```
