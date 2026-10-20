import { SiteHeader } from "../shared/SiteHeader.tsx";
import { FreshnessLab } from "./FreshnessLab.tsx";
import { TrafficLab } from "./TrafficLab.tsx";
import { DeploymentLab } from "./DeploymentLab.tsx";

export function ManagePage() {
  function searchProduct(query: string) {
    const params = new URLSearchParams({ view: "compare", q: query });
    window.open(`/?${params}`, "_blank", "noopener,noreferrer");
  }

  return <div className="app-shell">
    <SiteHeader manage />
    <main className="manage-page">
      <header className="search-intro">
        <h1>Manage shop.</h1>
        <p>Update the catalogue. Keep search ready for your customers.</p>
      </header>
      <p className="manage-help">Search buttons open the customer view in a new tab. Keep both tabs open to see how catalogue changes reach search.</p>
      <FreshnessLab initiallyOpen onSearch={searchProduct} />
      <TrafficLab />
      <DeploymentLab />
    </main>
  </div>;
}
