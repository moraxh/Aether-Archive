const fs = require('fs');
const file = 'src/components/home/HomeContent.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add MediaGrid imports
content = content.replace(
  'import { ItemModal } from "@/components/common/ItemModal";',
  'import { ItemModal } from "@/components/common/ItemModal";\nimport { MediaGrid, getAspectRatio, MASONRY_BREAKPOINTS } from "@/components/common/MediaGrid";\nimport Masonry from "react-masonry-css";'
);

// 2. Remove the old map and insert MediaGrid
const listRegex = /<div className="relative z-10 columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">[\s\S]*?<\/div>\s*\{\(loading/m;
content = content.replace(listRegex, `<MediaGrid
          items={items}
          openItem={openItem}
          preloadFromIndex={(index) => preloadFromIndex(index, items)}
        />

        {(loading`);

// 3. Replace the skeletons container with Masonry
const skeletonsRegex = /<div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">\s*\{SKELETON_KEYS\.map\(\(key\) => \([\s\S]*?\}\)\}\s*<\/div>/m;
content = content.replace(skeletonsRegex, `<Masonry
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
                </Masonry>`);

// 4. Update the skeleton keys calculation to use aspect ratios
content = content.replace(
  'export default function HomeContent() {',
  `export default function HomeContent() {
  const skeletonAspectRatios = React.useMemo(() => {
    return SKELETON_KEYS.map(() => "16 / 9");
  }, []);`
);

// Ensure React import exists for useMemo
if (!content.includes('import React')) {
  content = content.replace('import { useCallback', 'import React, { useCallback');
}

fs.writeFileSync(file, content);
console.log("Patched HomeContent");
