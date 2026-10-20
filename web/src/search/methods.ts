import type { Mode, SourceLabel } from "../shared/api.ts";

export const methods: { mode: Mode; name: string; hint: string; explanation: string }[] = [
  { mode: "basic", name: "Basic", hint: "Literal title match", explanation: "Case-insensitive title substring matching, in alphabetical order. No stemming, relevance ranking, or semantic matching." },
  { mode: "text", name: "Full-text", hint: "Words in the indexed text", explanation: "Rank passages by matching query terms with BM25. Model names and exact wording can help; a word in the query is not a hard brand filter." },
  { mode: "vector", name: "Vector", hint: "Nearby meaning", explanation: "Rank passages by embedding similarity. Read the retrieved passage to decide whether it answers the need; similarity does not prove a product meets every requirement." },
  { mode: "hybrid", name: "Hybrid", hint: "Combine passage rankings", explanation: "Redis combines the full-text and vector passage rankings with reciprocal rank fusion (RRF). Each method then keeps the best passage per product." },
];

export const sourceLabels: Record<SourceLabel, string> = { E: "Exact", S: "Substitute", C: "Complement", I: "Irrelevant" };

export function formatTime(milliseconds: number): string {
  return milliseconds < 1000 ? `${milliseconds.toFixed(1)} ms` : `${(milliseconds / 1000).toFixed(2)} s`;
}

export function fieldName(field: string): string {
  const names: Record<string, string> = { product_title: "Title", product_description: "Description", product_bullet_point: "Bullet points" };
  return names[field] ?? field;
}
