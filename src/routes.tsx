import { lazy } from "react";

// Eagerly loaded (landing + auth - critical path)
export { default as Index } from "./pages/Index";
export { default as Auth } from "./pages/Auth";

// Lazy loaded pages
export const Dashboard = lazy(() => import("./pages/Dashboard"));
export const Quotes = lazy(() => import("./pages/Quotes"));
export const Invoices = lazy(() => import("./pages/Invoices"));
export const Reports = lazy(() => import("./pages/Reports"));
export const Account = lazy(() => import("./pages/Account"));
export const AppSettings = lazy(() => import("./pages/AppSettings"));
export const Help = lazy(() => import("./pages/Help"));
export const Scheduling = lazy(() => import("./pages/Scheduling"));
export const Terms = lazy(() => import("./pages/Terms"));
export const Privacy = lazy(() => import("./pages/Privacy"));
export const Clients = lazy(() => import("./pages/Clients"));
export const Inventory = lazy(() => import("./pages/Inventory"));
export const Analytics = lazy(() => import("./pages/Analytics"));
export const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
export const Subscribe = lazy(() => import("./pages/Subscribe"));
export const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
export const Onboarding = lazy(() => import("./pages/Onboarding"));
export const TemplateDesigner = lazy(() => import("./pages/TemplateDesigner"));
export const NotFound = lazy(() => import("./pages/NotFound"));
export const PublicQuote = lazy(() => import("./pages/PublicDocument").then((m) => ({ default: m.PublicQuote })));
export const PublicInvoice = lazy(() => import("./pages/PublicDocument").then((m) => ({ default: m.PublicInvoice })));
export const TradesIndex = lazy(() => import("./pages/Trades").then((m) => ({ default: m.TradesIndex })));
export const TradePage = lazy(() => import("./pages/Trades").then((m) => ({ default: m.TradePage })));

// Help sub-pages
export const HelpDemoMode = lazy(() => import("./pages/help/DemoMode"));
export const HelpAccurateQuotes = lazy(() => import("./pages/help/AccurateQuotes"));
export const HelpCommonIssues = lazy(() => import("./pages/help/CommonIssues"));
export const HelpTemplates = lazy(() => import("./pages/help/Templates"));
export const HelpTaxPricing = lazy(() => import("./pages/help/TaxPricing"));
export const HelpScheduling = lazy(() => import("./pages/help/Scheduling"));
export const HelpClients = lazy(() => import("./pages/help/Clients"));
export const HelpInventoryPricing = lazy(() => import("./pages/help/InventoryPricing"));
export const HelpQuoteTemplates = lazy(() => import("./pages/help/QuoteTemplates"));
export const HelpRecurringInvoices = lazy(() => import("./pages/help/RecurringInvoices"));
export const HelpTroubleshooting = lazy(() => import("./pages/help/Troubleshooting"));
export const HelpContact = lazy(() => import("./pages/help/Contact"));
