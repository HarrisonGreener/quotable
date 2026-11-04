// How much of a quote's materials cost is backed by a real price.
//
//   verified  – your inventory, a manual price, or a matched supplier product
//   estimated – reference estimates and keyword guesses (needsVerification)

export interface PricedLine {
  name?: string;
  cost?: number | null;
  unitPrice?: number | null;
  quantity?: number;
  priceSource?: string;
  priceConfidence?: number;
  needsVerification?: boolean;
  fromInventory?: boolean;
}

export type LineStatus = "verified" | "estimated";

export function lineStatus(m: PricedLine): LineStatus {
  if (m.fromInventory || m.priceSource === "Manual" || m.priceSource === "Inventory") return "verified";
  if (m.needsVerification || m.priceSource === "Estimated" || m.unitPrice == null) return "estimated";
  return (m.priceConfidence ?? 0) >= 0.6 ? "verified" : "estimated";
}

export interface QuoteConfidence {
  score: number;            // 0–100, share of materials cost that is verified
  verifiedCount: number;
  estimatedCount: number;
  estimatedValue: number;   // £ of materials still estimated
  level: "high" | "medium" | "low";
}

export function quoteConfidence(materials: PricedLine[] = []): QuoteConfidence {
  let verified = 0, estimated = 0, verifiedCount = 0, estimatedCount = 0;
  for (const m of materials) {
    const value = Math.max(0, Number(m.cost ?? (m.unitPrice ?? 0) * (m.quantity ?? 1)) || 0);
    if (lineStatus(m) === "verified") { verified += value; verifiedCount++; }
    else { estimated += value; estimatedCount++; }
  }
  const total = verified + estimated;
  const score = total > 0 ? Math.round((verified / total) * 100) : materials.length ? 0 : 100;
  return {
    score,
    verifiedCount,
    estimatedCount,
    estimatedValue: Math.round(estimated * 100) / 100,
    level: score >= 80 ? "high" : score >= 50 ? "medium" : "low",
  };
}
