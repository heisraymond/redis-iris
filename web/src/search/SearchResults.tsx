import type { Comparison, Hit, Mode, SourceLabel } from "../shared/api.ts";
import { formatTime, methods, sourceLabels } from "./methods.ts";
import type { ProductRank, VisibleCount } from "./ranking.ts";
import { HighlightedText } from "./HighlightedText.tsx";
import { ProductPhotoView } from "../shared/ProductPhoto.tsx";

export function RankLabel({ rank, visibleCount, compact = false }: { rank: ProductRank; visibleCount: VisibleCount; compact?: boolean }) {
  if (rank.status === "unavailable") return <span className="rank-unavailable">{compact ? "N/A" : "Unavailable"}</span>;
  if (rank.status === "outside") return <span className="rank-outside">{compact ? ">5" : "Outside fetched top 5"}</span>;
  return <span className={rank.outsideVisible ? "rank-outside-visible" : ""}>#{rank.rank}{rank.outsideVisible && (compact ? "*" : <small>Beyond visible top {visibleCount}</small>)}</span>;
}

export function SourceJudgement({ label }: { label: SourceLabel | null }) {
  return <span className={`judgement ${label ? `judgement-${label.toLowerCase()}` : ""}`} title={label ? `Original ESCI judgement: ${sourceLabels[label]}` : "No original ESCI judgement for this query and product"}>
    <span aria-hidden="true">{label ?? "–"}</span>{label ? sourceLabels[label] : "Unjudged"}
  </span>;
}

function ProductRow({ hit, mode, rank, selected, onSelect }: {
  hit: Hit; mode: Mode; rank: number; selected: boolean; onSelect: (id: string) => void;
}) {
  return <li className="product-row">
    <button type="button" className="product-select" aria-pressed={selected} aria-haspopup="dialog" aria-controls="product-evidence" onClick={() => onSelect(hit.product_id)}>
      <span className="result-rank" aria-label={`Rank ${rank}`}>{String(rank).padStart(2, "0")}</span>
      <span className="result-copy">
        {(hit.brand || hit.color) && <span className="product-brand">{[hit.brand, hit.color].filter(Boolean).join(" · ")}</span>}
        <span className="product-title"><HighlightedText text={hit.title} ranges={mode === "text" ? hit.title_matches : []} /></span>
        {hit.available === false && <span className="passage-preview">Deleted from catalogue · stale indexed record</span>}
        {hit.passage.field !== "product_title" && <span className="passage-preview"><HighlightedText text={hit.passage.text} ranges={mode === "text" ? hit.passage_matches : []} preview={mode === "text"} /></span>}
      </span>
      <span className="result-arrow" aria-hidden="true">↗</span>
    </button>
    {hit.photo && <ProductPhotoView photo={hit.photo} compact />}
  </li>;
}

export function SearchResults({ comparison, busy, selectedId, onSelect, filtered, onRetry, selectedModes }: {
  comparison: Comparison | null; busy: boolean; selectedId: string | null;
  onSelect: (id: string) => void; filtered: boolean;
  onRetry: () => void; selectedModes: Mode[];
}) {
  const hints: Record<Mode, string> = {
    basic: "Literal title match · alphabetical order.",
    text: "Highlights show literal matches to your search words.",
    vector: "Explores the meaning behind your search.",
    hybrid: "A mix of wording and meaning.",
  };
  const visibleMethods = methods.filter((method) => selectedModes.includes(method.mode));
  const multiple = visibleMethods.length > 1;

  return <section className="results-section" aria-label="Search results" aria-busy={busy}>
    <div className="results-toolbar">
      <p className="results-overview">{multiple ? `${visibleMethods.length} methods · same query and filters` : "Search results"}</p>
    </div>
    {multiple && <p className="comparison-scroll-hint">Swipe across to compare methods.</p>}
    <div className={`comparison-scroll ${multiple ? "multiple-methods" : ""}`} tabIndex={multiple ? 0 : undefined} aria-label={multiple ? "Scroll to compare search methods" : undefined}>
      <div className={`method-results-grid columns-${visibleMethods.length}`}>
        {visibleMethods.map((method) => {
          const result = comparison?.results.find((item) => item.mode === method.mode);
          return <section key={method.mode} className={`method-result method-${method.mode}`} aria-labelledby={`${method.mode}-heading`}>
            <div className="method-result-heading">
              <h2 id={`${method.mode}-heading`}>{method.name}</h2>
              {!busy && result && !result.error && <span className="method-metrics">
                <span>{result.hits.length} results</span>
                <span aria-hidden="true"> · </span>
                <span className="method-latency" title={method.mode === "basic" ? "Time to read the live catalogue from Redis and scan its titles." : "Redis search round trip. Excludes shared query embedding and evidence processing; see About this search for those timings."} aria-label={`${method.name} search time: ${formatTime(result.query_ms)}`}>{formatTime(result.query_ms)}</span>
              </span>}
            </div>
            <p className="method-hint">{hints[method.mode]}</p>
            {busy ? <div className="search-state" role="status"><span className="loader" aria-hidden="true" /><p>Finding a few possibilities…</p></div>
            : !result || result.error ? <div className="error-box" role="alert"><strong>{method.name} is unavailable</strong><p>{result?.error || "This method did not return a response."}</p><button type="button" onClick={onRetry}>Try again</button></div>
            : result.hits.length ? <ol className="product-list">{result.hits.map((hit, index) => <ProductRow key={hit.product_id} hit={hit} mode={method.mode} rank={index + 1} selected={selectedId === hit.product_id} onSelect={onSelect} />)}</ol>
            : <div className="search-state"><h3>No results this time.</h3><p>{method.mode === "basic" ? "The complete phrase must appear in the title. Try a shorter phrase or compare with Full-text." : "Try a broader description."}{filtered && " You can also clear the filters to search all products."}</p></div>}
          </section>;
        })}
      </div>
    </div>
  </section>;
}
