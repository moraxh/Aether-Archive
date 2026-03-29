const fs = require('fs');
const file = 'src/components/home/HomeContent.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix syntax error near line 633: `) : null}} </Masonry>`
content = content.replace(
  ') : null}}',
  ') : null}'
);

content = content.replace(
  ') : null}\n        </Masonry>',
  `) : null}

        <Masonry
          breakpointCols={MASONRY_BREAKPOINTS}
          className="relative z-10 -ml-6 flex w-auto"
          columnClassName="pl-6 bg-clip-padding space-y-6"
        >
          {currentItems.map((item, index) => {
            const itemData = item.data?.[0];
            if (!itemData?.nasa_id) return null;

            const thumb = getThumbHref(item.links);
            if (!thumb) return null;
            const isAboveFold = index < 12;
            const aspectRatio = getAspectRatio(item.links);

            const nasaId = itemData.nasa_id;
            const title = itemData.title || "NASA archive item";
            const mediaType = itemData.media_type;
            const itemYear = itemData.date_created
              ? new Date(itemData.date_created).getFullYear()
              : null;
            const hasValidYear = Number.isFinite(itemYear);

            return (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "400px" }}
                transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
                key={nasaId}
                onClick={() => openItem(nasaId)}
                onMouseEnter={() => preloadFromIndex(index, currentItems)}
                onFocus={() => preloadFromIndex(index, currentItems)}
                className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-[#111] text-left transition-all duration-500 hover:border-white/20"
                style={{ aspectRatio }}
                aria-label={\`Open item \${title}\`}
                aria-haspopup="dialog"
              >
                <motion.div className="relative h-full w-full">
                  <Image
                    src={thumb}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    quality={60}
                    priority={isAboveFold}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-4 flex-col p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="mb-2 w-max rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] tracking-wider text-white/90 uppercase backdrop-blur-md">
                      {mediaType}
                    </span>
                    <h3 className="line-clamp-2 text-sm font-medium text-white">
                      {title}
                    </h3>
                    {hasValidYear && (
                      <span className="mt-1 block text-xs text-white/60">
                        {itemYear}
                      </span>
                    )}
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </Masonry>`
);


fs.writeFileSync(file, content);
console.log("Patched");
