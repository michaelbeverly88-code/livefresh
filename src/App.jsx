import { useState } from "react";
import LakeSearch from "./components/LakeSearch";
import SimpleCustomizer from "./components/SimpleCustomizer";
import ProductSelector from "./components/ProductSelector";
import LogoEditor from "./components/LogoEditor";
import "./index.css";

// The full-control editor (fonts, raw colors, templates, DXF export, etc.)
// is meant for internal/admin use — approving how a lake looks before it's
// offered to customers — not for the public-facing flow. It's reachable at
// ?mode=admin so it stays out of the way of the simplified customer path
// without needing a whole separate login system yet.
const isAdminMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "admin";

export default function App() {
  if (isAdminMode) {
    return <AdminApp />;
  }
  return <CustomerApp />;
}

function CustomerApp() {
  // step: "search" -> "customize" -> "product"
  const [step, setStep] = useState("search");
  const [selectedLake, setSelectedLake] = useState(null);
  const [design, setDesign] = useState(null);

  function handleSelectLake(lake) {
    setSelectedLake(lake);
    setStep("customize");
  }

  function handleContinueToProducts(designData) {
    setDesign(designData);
    setStep("product");
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Live Fresh Lake Logos</h1>
        <p>Find your lake, make it yours, put it on something you'll actually use.</p>
      </header>

      <main>
        {step === "search" && <LakeSearch onSelectLake={handleSelectLake} />}
        {step === "customize" && selectedLake && (
          <SimpleCustomizer
            lake={selectedLake}
            onBack={() => setStep("search")}
            onContinue={handleContinueToProducts}
          />
        )}
        {step === "product" && design && (
          <ProductSelector design={design} onBack={() => setStep("customize")} />
        )}
      </main>

      <footer className="app-footer">
        <p>Lake shape data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
      </footer>
    </div>
  );
}

function AdminApp() {
  const [selectedLake, setSelectedLake] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Live Fresh — advanced design tool</h1>
        <p>Full controls for approving how a lake looks before it goes live. Customers see the simplified flow at the site root.</p>
      </header>

      <main>
        {!selectedLake && <LakeSearch onSelectLake={setSelectedLake} />}
        {selectedLake && (
          <LogoEditor lake={selectedLake} onBack={() => setSelectedLake(null)} />
        )}
      </main>

      <footer className="app-footer">
        <p>Lake shape data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
      </footer>
    </div>
  );
}
