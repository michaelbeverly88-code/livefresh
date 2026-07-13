import { useState, useRef } from "react";

// Points at the Netlify Function in prod, and at the Netlify Dev proxy
// locally (both live at /.netlify/functions/... so no env-specific URL
// needs to be hardcoded or exposed in the client).
const SEARCH_ENDPOINT = "/.netlify/functions/search-lake";

export default function LakeSearch({ onSelectLake }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [errorMsg, setErrorMsg] = useState("");
  const debounceRef = useRef(null);

  async function runSearch(q) {
    if (q.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }
      setResults(data.results || []);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong.");
      setResults([]);
    }
  }

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 450);
  }

  return (
    <div className="lake-search">
      <label htmlFor="lake-search-input" className="field-label">
        Search for a lake
      </label>
      <input
        id="lake-search-input"
        type="text"
        placeholder="e.g. Lake Lanier"
        value={query}
        onChange={handleChange}
        autoComplete="off"
        maxLength={100}
      />

      {status === "loading" && <p className="hint">Searching…</p>}
      {status === "error" && <p className="hint error">{errorMsg}</p>}
      {status === "done" && results.length === 0 && (
        <p className="hint">No lake shapes found for that name. Try a more specific search (e.g. add the state).</p>
      )}

      {results.length > 0 && (
        <ul className="lake-results">
          {results.map((lake) => (
            <li key={lake.id}>
              <button type="button" onClick={() => onSelectLake(lake)}>
                <span className="lake-name">{lake.name}</span>
                <span className="lake-address">{lake.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
