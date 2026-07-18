# Graph Report - .  (2026-07-18)

## Corpus Check
- 2 files · ~18,984 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 150 nodes · 111 edges · 51 communities (15 shown, 36 thin omitted)
- Extraction: 89% EXTRACTED · 10% INFERRED · 1% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ESLint & Dev Dependencies
- Server Runtime Dependencies
- Graphify Query/Path/Explain Flow
- Package Scripts & Config
- React App Pages & Supabase
- Icon Sprite Set
- Graphify Skill Overview & Exports
- Graphify Update & Report Internals
- Marionette AI Art Page
- Chat API (Gemini)
- Graphify Add/Watch Ingest
- Graphify Watch Mechanism
- Graphify Neo4j/FalkorDB Export
- Graphify Post-Commit Hook & Code-Only Update
- Graphify Query Reflect & Work Memory
- Graphify Health Check & Shrink Guard
- Express Server App
- Vercel Rewrites Config
- Graphify Benchmark Export
- Graphify GraphML Export
- Graphify MCP Server Export
- Graphify SVG Export
- Extraction Confidence Rubric
- Extraction Hyperedge Rule
- Extraction Semantic Similarity Rule
- Extraction Source File Rule
- GitHub Clone Flow
- Cross-Repo Graph Merge
- Query BFS Mode
- Query Save-Result Feedback
- Whisper Model Choice
- Whisper Transcription Prompt
- Update Graph Diff
- AST Extraction (Code)
- Cost Tracker
- Deep Mode
- Directed Graph Flag
- Extraction Cache
- Gemini Backend
- God Nodes Analysis
- Honesty Rules
- Favicon Brand Icon
- Hero Illustration Asset
- React Logo Asset
- Vite Logo Asset

## God Nodes (most connected - your core abstractions)
1. `graphify project rules (native CLAUDE.md section)` - 7 edges
2. `scripts` - 6 edges
3. `Icon Sprite Sheet (public/icons.svg)` - 6 edges
4. `graphify` - 5 edges
5. `Bluesky Icon (butterfly logo, filled black glyph)` - 3 edges
6. `callGemini()` - 2 edges
7. `handler()` - 2 edges
8. `@supabase/supabase-js` - 2 edges
9. `cors` - 2 edges
10. `dotenv` - 2 edges

## Surprising Connections (you probably didn't know these)
- `graphify project rules (native CLAUDE.md section)` --conceptually_related_to--> `index.html app entry point`  [AMBIGUOUS]
  CLAUDE.md → index.html
- `graphify project rules (native CLAUDE.md section)` --references--> `GRAPH_REPORT.md`  [EXTRACTED]
  CLAUDE.md → .claude/skills/graphify/SKILL.md
- `Native CLAUDE.md integration (graphify claude install)` --references--> `graphify project rules (native CLAUDE.md section)`  [INFERRED]
  .claude/skills/graphify/references/hooks.md → CLAUDE.md
- `graphify project rules (native CLAUDE.md section)` --references--> `graphify query command`  [EXTRACTED]
  CLAUDE.md → .claude/skills/graphify/SKILL.md
- `graphify project rules (native CLAUDE.md section)` --references--> `graphify path command`  [EXTRACTED]
  CLAUDE.md → .claude/skills/graphify/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SKILL.md conditional reference-file fan-out** — _claude_skills_graphify_skill_graphify, _claude_skills_graphify_references_add_watch_watch_mechanism, _claude_skills_graphify_references_exports_wiki, _claude_skills_graphify_references_extraction_spec_node_id_format, _claude_skills_graphify_references_github_and_merge_cross_repo, _claude_skills_graphify_references_hooks_claude_md_integration, _claude_skills_graphify_references_query_vocab_expansion, _claude_skills_graphify_references_transcribe_video_step, _claude_skills_graphify_references_update_incremental [INFERRED 0.85]
- **AST-only, no-LLM rebuild paths** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_references_hooks_post_commit, _claude_skills_graphify_references_update_code_only_shortcut [INFERRED 0.85]
- **graphify export format flags (Steps 6b-8)** — _claude_skills_graphify_references_exports_wiki, _claude_skills_graphify_references_exports_neo4j, _claude_skills_graphify_references_exports_falkordb, _claude_skills_graphify_references_exports_svg, _claude_skills_graphify_references_exports_graphml, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Social/community platform icon group (Bluesky, Discord, X)** — public_icons_blueskyicon, public_icons_discordicon, public_icons_xicon [INFERRED 0.75]

## Communities (51 total, 36 thin omitted)

### Community 0 - "ESLint & Dev Dependencies"
Cohesion: 0.11
Nodes (19): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+11 more)

### Community 1 - "Server Runtime Dependencies"
Cohesion: 0.12
Nodes (17): cors, dotenv, express, hls.js, dependencies, cors, dotenv, express (+9 more)

### Community 2 - "Graphify Query/Path/Explain Flow"
Cohesion: 0.14
Nodes (14): Debounce (default 3s), Native CLAUDE.md integration (graphify claude install), /graphify explain flow, /graphify path flow, Constrained query expansion (Step 0), --update incremental re-extraction flow, graphify explain command, graphify path command (+6 more)

### Community 3 - "Package Scripts & Config"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, dev:api, lint, preview (+2 more)

### Community 4 - "React App Pages & Supabase"
Cohesion: 0.33
Nodes (4): App(), supabase, Home(), MoreCctvs()

### Community 5 - "Icon Sprite Set"
Cohesion: 0.43
Nodes (7): Bluesky Icon (butterfly logo, filled black glyph), Discord Icon (game controller/face logo, filled black glyph), Documentation Icon (folder with chat/reply bubbles, purple stroke outline), GitHub Icon (Octocat mark, filled black glyph), Icon Sprite Sheet (public/icons.svg), Social Icon (person avatar with share/notification badge, purple stroke outline), X (Twitter) Icon (X mark, filled black glyph)

### Community 6 - "Graphify Skill Overview & Exports"
Cohesion: 0.33
Nodes (6): graphify Skill Trigger Rule, --wiki export, Cross-repo graph merge flow, Monorepo/multi-service merge flow, Step 2.5 video/audio transcription flow, graphify

### Community 7 - "Graphify Update & Report Internals"
Cohesion: 0.33
Nodes (6): Node ID format rule, build_merge(), --cluster-only flag, graph.json, GRAPH_REPORT.md, Semantic extraction (Part B)

### Community 8 - "Marionette AI Art Page"
Cohesion: 0.40
Nodes (3): AI_PINK_VARIATIONS, GERMAN_COLORS, KLEIST_TEXT

## Ambiguous Edges - Review These
- `graphify project rules (native CLAUDE.md section)` → `index.html app entry point`  [AMBIGUOUS]
  CLAUDE.md · relation: conceptually_related_to

## Knowledge Gaps
- **63 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+58 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `graphify project rules (native CLAUDE.md section)` and `index.html app entry point`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `devDependencies` connect `ESLint & Dev Dependencies` to `Package Scripts & Config`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Server Runtime Dependencies` to `Package Scripts & Config`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `graphify project rules (native CLAUDE.md section)` connect `Graphify Query/Path/Explain Flow` to `Graphify Update & Report Internals`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _63 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ESLint & Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Server Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._