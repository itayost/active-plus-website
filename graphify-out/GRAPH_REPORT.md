# Graph Report - active-plus-website  (2026-08-03)

## Corpus Check
- 17 files · ~2,321 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 102 nodes · 96 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68f619b0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- compilerOptions
- actions.ts
- dependencies
- package.json
- include
- layout.tsx
- privacy-policy/page.tsx
- lib
- constants.ts
- next.config.ts
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 5 edges
3. `include` - 5 edges
4. `lib` - 4 edges
5. `submitDeletionRequest()` - 3 edges
6. `DeleteAccountResult` - 2 edges
7. `isRateLimited()` - 2 edges
8. `DeleteAccountForm()` - 2 edges
9. `Header()` - 2 edges
10. `createServiceClient()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (16 total, 5 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+9 more)

### Community 1 - "compilerOptions"
Cohesion: 0.13
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 2 - "actions.ts"
Cohesion: 0.20
Nodes (9): DeleteAccountResult, isRateLimited(), rateLimitMap, submitDeletionRequest(), DeleteAccountForm(), metadata, AccountDeletionRequest, createServiceClient() (+1 more)

### Community 3 - "dependencies"
Cohesion: 0.22
Nodes (9): next, dependencies, next, react, react-dom, @supabase/supabase-js, react, react-dom (+1 more)

### Community 4 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 5 - "include"
Cohesion: 0.25
Nodes (7): next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude, include

### Community 6 - "layout.tsx"
Cohesion: 0.40
Nodes (3): heebo, metadata, Header()

### Community 8 - "lib"
Cohesion: 0.50
Nodes (4): dom, dom.iterable, esnext, lib

## Knowledge Gaps
- **54 isolated node(s):** `rateLimitMap`, `metadata`, `CONTACT_EMAIL`, `SITE_NAME`, `AccountDeletionRequest` (+49 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `lib`, `include`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `rateLimitMap`, `metadata`, `CONTACT_EMAIL` to the rest of the system?**
  _54 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._