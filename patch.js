const fs = require('fs');

const data = fs.readFileSync('src/components/home/HomeContent.tsx', 'utf8');

let result = data;

// Add imports
result = result.replace(
  'import useNasaSearch from "@/hooks/useNasaSearch";',
  'import { useNasaPopular, useNasaRecent } from "@/hooks/useNasaCurated";\nimport useNasaSearch from "@/hooks/useNasaSearch";'
);

// Add TabType
result = result.replace(
  'export default function HomeContent() {',
  'type TabType = "search" | "recent" | "popular";\n\nexport default function HomeContent() {'
);

// Add state and hooks
result = result.replace(
  /const {[\s\S]*?} = useNasaSearch\(\);/,
  `$&
  const { data: recentItems = [], isLoading: loadingRecent } = useNasaRecent();
  const { data: popularItems = [], isLoading: loadingPopular } = useNasaPopular();
  const [activeTab, setActiveTab] = useState<TabType>("search");`
);

// Add derived state
result = result.replace(
  '  const preloadImage = useCallback((src?: string) => {',
  `  const currentItems = useMemo(() => {
    if (activeTab === "recent") return recentItems;
    if (activeTab === "popular") return popularItems;
    return items;
  }, [activeTab, items, recentItems, popularItems]);

  const currentLoading =
    activeTab === "recent"
      ? loadingRecent
      : activeTab === "popular"
        ? loadingPopular
        : loading;

  const preloadImage = useCallback((src?: string) => {`
);

// Update preloadFromIndex
result = result.replace(
  /const preloadFromIndex = useCallback\([\s\S]*?\[items, preloadImage\],\n  \);/,
  `const preloadFromIndex = useCallback(
    (index: number, sourceItems: typeof items) => {
      const current = sourceItems[index];
      if (!current) return;

      const currentThumb = getThumbHref(current.links);
      preloadImage(currentThumb);

      const nextOne = sourceItems[index + 1];
      const nextTwo = sourceItems[index + 2];

      preloadImage(nextOne ? getThumbHref(nextOne.links) : undefined);
      preloadImage(nextTwo ? getThumbHref(nextTwo.links) : undefined);
    },
    [preloadImage],
  );`
);

// Update itemsSignature
result = result.replace(
  'const itemsSignature = items',
  'const itemsSignature = currentItems'
);
result = result.replace(
  '}, [items]);',
  '}, [currentItems]);'
);

// Update observer effect
result = result.replace(
  'if (!observerRef.current || !hasMore || loading || isFetchingNextPage) {',
  'if (activeTab !== "search" || !observerRef.current || !hasMore || loading || isFetchingNextPage) {'
);
result = result.replace(
  '}, [hasMore, loading, isFetchingNextPage, fetchNextPage]);',
  '}, [activeTab, hasMore, loading, isFetchingNextPage, fetchNextPage]);'
);

// Update handleSearchSubmit
result = result.replace(
  /const handleSearchSubmit = \(e: FormEvent\) => {\s*e.preventDefault\(\);\s*if \(localQuery.trim\(\) !== filters.q\) {\s*setFilter\("q", localQuery.trim\(\)\);\s*}\s*};/,
  `const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() !== filters.q) {
      if (activeTab !== "search") {
        setActiveTab("search");
      }
      setFilter("q", localQuery.trim());
    }
  };`
);

// Update skeletonAspectRatios
result = result.replace(
  'const recentRatios = items',
  'const recentRatios = currentItems'
);
result = result.replace(
  '  }, [items]);',
  '  }, [currentItems]);'
);

// Add tabs UI
result = result.replace(
  '<motion.form',
  `<div className="mb-10 flex flex-wrap justify-center gap-2 rounded-full border border-white/10 bg-[#111] p-1 w-full max-w-2xl">
        {[
          { id: "search", label: "Search" },
          { id: "recent", label: "Recent Highlights" },
          { id: "popular", label: "Popular" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={\`rounded-full px-6 py-2 text-sm font-medium transition-colors \${
              activeTab === tab.id
                ? "bg-white text-black"
                : "text-white/50 hover:text-white"
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.form`
);

// Hide filters if not search tab
result = result.replace(
  /<motion\.div\s*initial={{ opacity: 0, y: 20 }}\s*animate={{ opacity: 1, y: 0 }}\s*transition={{ delay: 1\.2, duration: 0\.8, ease: \[0\.25, 0\.1, 0, 1\] }}\s*className="mb-12 flex w-full max-w-7xl flex-col items-center"\s*>/,
  `{activeTab === "search" && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="mb-12 flex w-full max-w-7xl flex-col items-center"
      >`
);
result = result.replace(
  /<\/AnimatePresence>\s*<\/motion\.div>\s*<motion\.div\s*initial={{ opacity: 0, y: 20 }}\s*animate={{ opacity: 1, y: 0 }}\s*transition={{ delay: 1\.4, duration: 0\.8, ease: \[0\.25, 0\.1, 0, 1\] }}\s*className="w-full"\s*>/,
  `        </AnimatePresence>
      </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="w-full"
      >`
);


// Replace items with currentItems map
result = result.replace(
  '{items.map((item, index) => {',
  '{currentItems.map((item, index) => {'
);
result = result.replace(
  'preloadFromIndex(index)',
  'preloadFromIndex(index, currentItems)'
);
result = result.replace(
  'preloadFromIndex(index)',
  'preloadFromIndex(index, currentItems)'
);

// Render conditions
result = result.replace(
  '{!loading && items.length === 0 && filters.q && !error && (',
  '{!currentLoading && currentItems.length === 0 && (activeTab !== "search" || filters.q) && !error && ('
);
result = result.replace(
  /\{\(total > 0 \|\| items\.length > 0\) && \([\s\S]*?\}\)/,
  `{((activeTab === "search" && total > 0) || currentItems.length > 0) ? (
          <p className="mb-6 text-center text-sm text-white/40 lg:text-left">
            {currentItems.length.toLocaleString()}
            {hasMore && activeTab === "search" ? "+" : ""} visible results
          </p>
        ) : null}`
);
result = result.replace(
  '{(loading || isFetchingNextPage || hasMore) && filters.q && (',
  '{(currentLoading || isFetchingNextPage || (activeTab === "search" && hasMore)) && (activeTab !== "search" || filters.q) && ('
);
result = result.replace(
  '{loading ? (',
  '{currentLoading ? ('
);
result = result.replace(
  'items={items}',
  'items={currentItems}'
);

fs.writeFileSync('src/components/home/HomeContent.tsx', result);
console.log("Patched");
