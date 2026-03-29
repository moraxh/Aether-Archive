# Contributing Guide

Hey! Thanks for your interest in contributing to Aether Archive. Any help is very welcome.

To get your Pull Request reviewed and merged quickly, please follow the guidelines below.

## 1. Project Scope

Aether Archive is a search and discovery interface for NASA's public image archive.

- **Stay focused:** Avoid features that turn the app into a social platform or a personal media manager (user accounts, uploads, comments, etc.).
- **Client-first architecture:** The project is intentionally designed to run with a client-first approach on top of NASA public APIs. Avoid adding server-side complexity unless there is a very strong and justified reason. If you want to propose a major architecture change, open an Issue first.

## 2. Performance and Architecture

Because the app handles large image grids and infinite scroll, performance is critical.

- **Keep the client light:** Filtering, sorting, and rendering logic over large datasets must stay efficient. Avoid expensive loops and main-thread blocking work.
- **Respect the API:** Avoid unnecessary fetches and always cancel stale requests when possible (for example, with `AbortController`). Do not poll NASA APIs.
- **Images are the product:** Use lazy loading, stable aspect ratios, and prevent layout shifts.

## 3. Dependency Management

We are strict about bundle size and long-term maintainability.

- **Justify every dependency:** Prefer existing tools in the stack before introducing new packages.
- **No heavy state libraries by default:** URL + hooks are the core state model. Avoid introducing Redux/Zustand-like solutions unless previously discussed in an Issue.

## 4. Design and Styles

- **Visual consistency:** Keep the dark, cinematic, NASA-inspired visual language.
- **Respect existing UI patterns:** This project uses Tailwind CSS v4 and shadcn/ui components. Prefer extending current patterns over introducing a parallel design system.
- **Use color intentionally:** Keep contrast and hierarchy clear, and avoid introducing color palettes that conflict with the current aesthetic.

## 5. Maintainability and Infrastructure

The long-term goal is to keep this project **100% free**, using Vercel free tier + NASA public APIs.

- **Efficiency is a feature:** Contributions that reduce load times, API calls, bundle size, or build time are highly appreciated.
- **Keep changes focused:** Prefer small, isolated improvements over broad rewrites without clear measurable gains.

## 6. Local Setup

Use `pnpm` for all local development tasks.

```bash
pnpm install
pnpm dev
```

Before opening a PR, run:

```bash
pnpm lint
pnpm build
```

If your change affects formatting, also run:

```bash
pnpm format
```

## 7. PR Guidelines

- **Atomic PRs:** Keep each PR focused on one concern.
- **Describe your changes:** Explain what changed, why, and how to test.
- **Include visuals for UI updates:** Screenshots or short recordings are strongly encouraged for frontend changes.
- **Mention dependency impact:** If you add a package, justify why and describe bundle/runtime impact.

---

Thanks again for your time and contributions. Excited to keep building Aether Archive together.
