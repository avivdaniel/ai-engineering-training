"use client";
import { FormEvent, useEffect, useRef, useState } from "react";

type SearchResult = {
  pageContent: string;
  metadata: {
    source: string;
    page: number;
  };
};

export default function SemanticSearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSearching) return;

    setIsSearching(true);
    setResults([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: inputValue }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        const lines = text.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = JSON.parse(line.slice(6));
            setResults((prev) => [...prev, data]);
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Search form */}
      <div className="border-t border-gray-200 bg-black">
        <div className="max-w-2xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search through documents..."
              className="flex-1 p-3 border border-gray-300 rounded-lg text-white"
              disabled={isSearching}
            />
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg ${
                isSearching ? "opacity-50" : "hover:bg-green-400"
              }`}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </div>

      {/* Results display */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          {results.map((result, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-2">
                Source: {result.metadata.source} (Page {result.metadata.page})
              </div>
              <div className="whitespace-pre-wrap">{result.pageContent}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
