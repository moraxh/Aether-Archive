const fs = require('fs');
const file = 'src/components/home/HomeContent.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard imports and add MediaGrid
content = content.replace(
  'import { ItemModal } from "@/components/common/ItemModal";',
  'import { ItemModal } from "@/components/common/ItemModal";\nimport { MediaGrid, getAspectRatio, MASONRY_BREAKPOINTS } from "@/components/common/MediaGrid";\nimport Masonry from "react-masonry-css";'
);

// Add useMemo to skeleton aspect ratio
content = content.replace(
  'const skeletonAspectRatios = items',
  'const skeletonAspectRatios = React.useMemo(() => items'
);
content = content.replace(
  /return SKELETON_KEYS\.map\([\s\S]*?\);\n  }, \[items\]\);/,
  `return SKELETON_KEYS.map(
      (_, index) => recentRatios[index % recentRatios.length],
    );
  }, [items]);`
);


// Replace items.map with MediaGrid
content = content.replace(
  /<div className="relative z-10 columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">[\s\S]*?<\/div>/,
  `<MediaGrid
          items={items}
          openItem={openItem}
          preloadFromIndex={(index) => preloadFromIndex(index)}
        />`
);

// Replace skeleton items with Masonry
content = content.replace(
  /<div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">[\s\S]*?<\/div>/,
  `<Masonry
                  breakpointCols={MASONRY_BREAKPOINTS}
                  className="-ml-6 flex w-auto"
                  columnClassName="pl-6 bg-clip-padding space-y-6"
                >
                  {SKELETON_KEYS.map((key, index) => (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={key}
                      className="overflow-hidden rounded-xl border border-white/5 bg-[#111] animate-pulse"
                      style={{ aspectRatio: skeletonAspectRatios[index] }}
                    >
                      <div className="h-full w-full bg-white/5" />
                    </motion.div>
                  ))}
                </Masonry>`
);


// Add React import if missing for useMemo
if (!content.includes('import React')) {
  content = content.replace('import { useCallback', 'import React, { useCallback');
}

fs.writeFileSync(file, content);
console.log("Patched");
