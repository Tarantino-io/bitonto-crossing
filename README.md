# Bitonto Level Crossing Monitor

[![CI](https://github.com/Tarantino-io/bitonto-crossing/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Tarantino-io/bitonto-crossing/actions/workflows/ci.yml?query=branch%3Amain)
[![CodeQL](https://github.com/Tarantino-io/bitonto-crossing/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/Tarantino-io/bitonto-crossing/actions/workflows/codeql.yml?query=branch%3Amain)
[![Coverage](https://codecov.io/gh/Tarantino-io/bitonto-crossing/branch/main/graph/badge.svg)](https://codecov.io/gh/Tarantino-io/bitonto-crossing/tree/main)
[![License](https://img.shields.io/github/license/Tarantino-io/bitonto-crossing)](https://github.com/Tarantino-io/bitonto-crossing/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.9.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/en/download)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/installation)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/docs)
[![Code style: Prettier](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg?logo=prettier)](https://prettier.io/docs/en/)

Production-ready mobile web app that estimates the status of level crossings in Bitonto, Italy.

## Features

- Real-time status estimation (`OPEN`, `WARNING`, `CLOSED`) using live train movement data.
- Dual-station monitoring: `Bitonto Centrale` and `Bitonto SS. Medici`.
- Resilient API handling with timeout, partial-source fallback, and no-store caching.
- PWA support (installable on iOS/Android home screens).
- Quality gates with CI: formatting, linting, type-checking, tests, and coverage thresholds.

## Data Source and Methodology

This app does not read physical crossing sensors. It infers likely crossing state from Ferrotramviaria real-time train feeds.

- `CLOSED`: train imminent or just passed (`-1` to `+2` minutes).
- `WARNING`: train approaching (`+3` to `+7` minutes).
- `OPEN`: no nearby train movement in the warning window.

Important: this is an estimate. Always follow physical signals and barriers at the crossing.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Vitest + Testing Library
- ESLint + TypeScript + Prettier
- GitHub Actions (CI + CodeQL)

## Quick Start

```bash
git clone https://github.com/Tarantino-io/bitonto-crossing.git
cd bitonto-crossing
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Commands

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run coverage
pnpm run quality
```

`pnpm run quality` is the same quality gate used by CI.

## Deployment

Use Vercel for deployment:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTarantino-io%2Fbitonto-crossing)

## Security and Maintenance

- `CodeQL` workflow for static security analysis.
- `Dependabot` weekly dependency updates.
- CI upload of coverage artifacts and Codecov reporting.

## License

MIT - see [LICENSE](https://github.com/Tarantino-io/bitonto-crossing/blob/main/LICENSE).
