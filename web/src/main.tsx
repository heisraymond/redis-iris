import React from "react";
import { createRoot } from "react-dom/client";
import { SearchPage } from "./search/SearchPage.tsx";
import "./shared/style.css";
import { ManagePage } from "./manage/ManagePage.tsx";
import { ShopPage } from "./shop/ShopPage.tsx";
import { ProductPage } from "./shop/ProductPage.tsx";

const params = new URLSearchParams(window.location.search);
const view = params.get("view");

function Page() {
  if (view === "manage") return <ManagePage />;
  if (view === "compare" || params.has("q")) return <SearchPage />;
  if (view === "product") return <ProductPage id={params.get("id") || ""} />;
  return <ShopPage />;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><Page /></React.StrictMode>);
