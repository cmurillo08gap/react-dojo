export interface SearchResult {
  id: string;
  label: string;
}

// Stand-in for a real product catalog a search endpoint would query.
export const CATALOG: SearchResult[] = [
  { id: "1", label: "Wireless Mouse" },
  { id: "2", label: "Mechanical Keyboard" },
  { id: "3", label: "USB-C Hub" },
  { id: "4", label: "Noise-Cancelling Headphones" },
  { id: "5", label: "Portable SSD" },
  { id: "6", label: "Webcam" },
];

// Artificial latency so this behaves like a real, network-bound search
// endpoint instead of resolving instantly — this is the "boundary" the
// mocked test replaces with vi.mock, and the thing the naive test pays for
// in real wall-clock time on every run.
const SIMULATED_LATENCY_MS = 400;

/**
 * Stands in for a real network call (e.g. `fetch("/api/search?q=...")`).
 * Filters the in-memory catalog by substring match, wrapped in a
 * setTimeout to simulate real request latency.
 */
export function searchApi(query: string): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const needle = query.trim().toLowerCase();
      resolve(needle ? CATALOG.filter((item) => item.label.toLowerCase().includes(needle)) : []);
    }, SIMULATED_LATENCY_MS);
  });
}
