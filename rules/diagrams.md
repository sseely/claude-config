---
paths:
  - "**/*.puml"
  - "**/*.md"
---

# Diagrams

PlantUML is the default for every generated diagram — fenced ```` ```plantuml ````
blocks in Markdown, `.puml` files standalone. Never use ASCII art or prose
where a diagram type fits.

Two exceptions only:
- The destination has a fixed renderer that excludes PlantUML (e.g. Claude
  Artifacts) — use what it supports and say why.
- The project already standardizes on another notation — match it; don't
  convert existing diagrams as a side effect of unrelated work.

Full rubric (diagram type by question), tie-breakers, and quality bar
(label every edge, cap ~15 nodes, current-or-proposed not both):
`docs/reference/diagrams.md`.
