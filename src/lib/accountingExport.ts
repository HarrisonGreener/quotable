// CSV exports in the import formats of UK accounting packages.
//
// • Xero — "Import sales invoices" template (Business → Invoices → Import)
// • QuickBooks Online — invoice import (Settings → Import data → Invoices)
// • FreeAgent — bank statement CSV (date, amount, description), for
//   matching invoice payments to income in a bank account
//
// Each invoice exports as one line: its title, net amount and VAT.

export interface ExportInvoice {
  invoice_number: string;
  client: string;
  title: string;
  date: string;        // ISO yyyy-mm-dd
  due_date: string;
  amount: number;      // net
  tax: number;         // VAT
  total: number;
  status: string;
}

export type AccountingFormat = "xero" | "quickbooks" | "freeagent";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
const ukDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
const money = (n: number) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export function buildAccountingCsv(format: AccountingFormat, invoices: ExportInvoice[], salesAccountCode = "200"): string {
  if (format === "xero") {
    const header = ["*ContactName", "EmailAddress", "*InvoiceNumber", "Reference", "*InvoiceDate", "*DueDate", "*Description", "*Quantity", "*UnitAmount", "*AccountCode", "*TaxType", "TaxAmount", "Currency"];
    return toCsv([
      header,
      ...invoices.map((i) => [
        i.client, "", i.invoice_number, i.title, ukDate(i.date), ukDate(i.due_date), i.title || "Work completed", 1,
        money(i.amount), salesAccountCode, Number(i.tax) > 0 ? "20% (VAT on Income)" : "No VAT", money(i.tax), "GBP",
      ]),
    ]);
  }

  if (format === "quickbooks") {
    const header = ["InvoiceNo", "Customer", "InvoiceDate", "DueDate", "Memo", "Item(Product/Service)", "ItemDescription", "ItemQuantity", "ItemRate", "ItemAmount", "ItemTaxCode", "ItemTaxAmount", "Currency"];
    return toCsv([
      header,
      ...invoices.map((i) => [
        i.invoice_number, i.client, ukDate(i.date), ukDate(i.due_date), i.title, "Services", i.title || "Work completed", 1,
        money(i.amount), money(i.amount), Number(i.tax) > 0 ? "20.0% S" : "No VAT", money(i.tax), "GBP",
      ]),
    ]);
  }

  // FreeAgent bank statement format: no header, dd/mm/yyyy, amount, description
  return toCsv(
    invoices
      .filter((i) => /paid/i.test(i.status))
      .map((i) => [ukDate(i.date), money(i.total), `${i.invoice_number} ${i.client} ${i.title}`.trim()]),
  );
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
