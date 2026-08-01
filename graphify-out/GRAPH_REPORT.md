# Graph Report - .  (2026-08-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 100 nodes · 95 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b135373`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 13
- Community 14
- Community 15

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 5 edges
3. `include` - 5 edges
4. `submitDeletionRequest()` - 4 edges
5. `lib` - 4 edges
6. `createServiceClient()` - 3 edges
7. `DeleteAccountForm()` - 2 edges
8. `DeleteAccountResult` - 2 edges
9. `isRateLimited()` - 2 edges
10. `Header()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `submitDeletionRequest()` --calls--> `createServiceClient()`  [EXTRACTED]
  app/delete-account/actions.ts → lib/supabase.ts

## Import Cycles
- None detected.

## Communities (16 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.26
Nodes (7): DeleteAccountResult, isRateLimited(), rateLimitMap, submitDeletionRequest(), DeleteAccountForm(), metadata, createServiceClient()

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (9): next, dependencies, next, react, react-dom, @supabase/supabase-js, react, react-dom (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (7): next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude, include

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (3): heebo, metadata, Header()

### Community 8 - "Community 8"
Cohesion: 0.50
Nodes (4): dom, dom.iterable, esnext, lib

## Knowledge Gaps
- **52 isolated node(s):** `rateLimitMap`, `metadata`, `heebo`, `metadata`, `metadata` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 0` to `Community 4`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `Community 1` to `Community 8`, `Community 5`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `rateLimitMap`, `metadata`, `heebo` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._