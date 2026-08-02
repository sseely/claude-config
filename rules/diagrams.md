# Diagrams

## PlantUML is the default

Use PlantUML for all generated diagrams.

- In Markdown, use a fenced block: ```` ```plantuml ```` wrapping
  `@startuml` … `@enduml`
- For standalone diagrams outside prose, use a `.puml` file
- Never use ASCII art or a prose description where a diagram type
  from the rubric below fits
- One diagram per fenced block — do not stack multiple `@startuml`
  blocks in a single fence

### When the target cannot render PlantUML

Two cases, and only these two:

- **The destination has a fixed renderer that excludes PlantUML.**
  Claude Artifacts are the live example — the runtime has no
  PlantUML renderer, so a PlantUML block there displays as raw
  text. Use whatever notation that renderer does support, and say
  in your response why.
- **The project already standardizes on another notation.** Match
  the project. Do not convert its existing diagrams as a side
  effect of unrelated work.

Neither case is a reason to reach for another notation by default.
If a local renderer or preprocessor is available, PlantUML wins.

## Rubric — pick by the question the diagram answers

| The question | Diagram type | Opener |
|---|---|---|
| Who calls whom, in what order? | Sequence | `@startuml` + `A -> B: msg` |
| What are the types and how do they relate? | Class | `class Foo { }` |
| What does the control flow / branching look like? | Activity | `start` / `:step;` / `if () then ()` |
| What are the deployable parts and their interfaces? | Component | `component [Foo]` |
| Where does it run — hosts, containers, regions? | Deployment | `node` / `cloud` / `database` |
| What states can this entity be in, and what transitions are legal? | State | `[*] --> Draft` |
| What is the database schema? | ER | `entity Foo { }` + crow's foot (`}\|--\|\|`) |
| What does this payload look like? | JSON / YAML | `@startjson` / `@startyaml` |
| What is the network topology / subnetting? | nwdiag | `nwdiag { }` |
| How does the work break down hierarchically? | WBS / MindMap | `@startwbs` / `@startmindmap` |
| What is the schedule and what blocks what? | Gantt | `@startgantt` |
| What does this screen look like? | Salt wireframe | `@startsalt` |
| What are the system boundaries at C4 level 1–3? | C4 | `!include <C4/C4_Container>` |

### Tie-breakers

- **Sequence vs. Activity** — sequence when *who* does it matters
  (multiple participants exchanging messages); activity when only
  *what happens next* matters (branching inside one component).
- **Component vs. Deployment** — component for logical structure
  (what talks to what); deployment for physical placement (what
  runs where).
- **Class vs. ER** — class for code types and behavior; ER for
  persisted schema. Do not use one to document the other.
- **State vs. Activity** — state when the subject is a single
  entity's lifecycle; activity when the subject is a process.
- If two types both fit, pick the one with fewer elements. A
  diagram that needs a legend to read has the wrong type.

## Quality bar

- Label every edge. An unlabeled arrow states a relationship
  exists but not what it is.
- Cap at ~15 nodes. Past that, split into a high-level diagram
  plus per-area detail diagrams rather than shrinking the font.
- Diagram the current or proposed state, not both in one figure.
- Prefer the PlantUML stdlib (`!include <C4/…>`,
  `!include <awslib/…>`) over hand-drawn approximations of a
  standard notation.
