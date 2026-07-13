import { useState } from "react";
import LakeSearch from "./components/LakeSearch";
import LogoEditor from "./components/LogoEditor";
import "./index.css";

export default function App() {
  const [selectedLake, setSelectedLake] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Live Fresh Lake Logos</h1>
        <p>Search any lake, pull its real shoreline shape, and build a custom logo for merch, decals, or engraving.</p>
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
