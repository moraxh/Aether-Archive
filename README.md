# Aether Archive

Aether Archive is an unofficial, open-source search and discovery interface for NASA's public image archive.

NASA hosts one of the most important public media collections in history. This project focuses on making that archive easier to explore with a faster, cleaner, and more intentional user experience.

## Project Scope

This project is intentionally focused on one thing: **search and discovery**.

- Better filtering and browsing for NASA media
- Infinite scrolling and high-density gallery exploration
- Clean metadata presentation with a photography-first UX

What this project is **not**:

- A social platform (accounts, comments, feeds)
- A personal media manager (uploads, private libraries)
- An official NASA product

All imagery and content rights belong to NASA and the respective creators.

## Tech Stack

- `Next.js` (App Router)
- `React`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Biome` (lint + format)
- `pnpm`

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Run locally

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Run production server
pnpm lint     # Biome checks
pnpm format   # Biome format --write
```

## Infrastructure and Cost Philosophy

The project aims to remain **100% free** to operate:

- Client-first architecture
- NASA public APIs as data source
- Vercel free tier deployment

Performance and efficiency are product features. Improvements that reduce unnecessary requests, payload size, or rendering cost are always welcome.

## Contributing

Pull requests are welcome.

Before opening a PR, please read `CONTRIBUTING.md` for scope, architecture, and review guidelines.

## Disclaimer

Aether Archive is an independent project and is **not affiliated with, endorsed by, or officially connected to NASA**.

## Built by

Jorge Mora — [moraxh](https://github.com/moraxh)