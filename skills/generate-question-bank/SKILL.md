---
name: generate-question-bank
description: Generate an NCLEX-style question bank from a scraped Pressbooks textbook. Produces 50 questions per content section using the Anthropic Batch API. Run after import-pressbook.js has scraped a book into a content directory.
allowed-tools: Bash, Read
---

Generate a question bank for a Pressbooks textbook that has already been scraped.

## Prerequisites

The content directory must already exist with:
- `toc.json` — book metadata and chapter list
- `chapters/*.md` — scraped chapter files with YAML frontmatter

If not yet scraped, run `import-pressbook.js` first.

## Arguments

The skill accepts an optional content directory argument. If not provided, ask the user which book to generate questions for.

Available books (check `content/` for directories containing `toc.json`):
```bash
find content -name toc.json -maxdepth 2 | sort
```

## Steps

1. **Identify the target book.** If the user specified a book name or path, resolve it. Otherwise list available books and ask.

2. **Check existing questions.** Look for a `questions/` subdirectory in the content dir:
   ```bash
   ls content/<book>/questions/ 2>/dev/null | wc -l
   ```
   If it already exists, report how many chapters have questions and ask whether to regenerate missing chapters or stop.

3. **Run a dry run first** to preview scope:
   ```bash
   python scripts/generate-question-bank.py \
     --content-dir content/<book> \
     --target 50 \
     --dry-run
   ```
   Report the chapter count and estimated batch requests to the user.

4. **Generate the question bank:**
   ```bash
   python scripts/generate-question-bank.py \
     --content-dir content/<book> \
     --target 50
   ```
   This submits to the Anthropic Batch API and polls until complete. It can take several minutes for large books.

5. **Verify output:**
   ```bash
   # Count chapters with questions
   ls content/<book>/questions/*.json | wc -l
   # Check the combined bank
   python3 -c "
   import json
   bank = json.load(open('content/<book>/question-bank.json'))
   print(f\"Book: {bank['book']['title']}\")
   print(f\"Total questions: {bank['total_questions']}\")
   print(f\"Chapters covered: {bank['chapters_covered']}\")
   "
   ```

6. **Commit the results:**
   ```bash
   git add content/<book>/questions/ content/<book>/question-bank.json
   git commit -m "feat(content): generate question bank for <book title> (<N> questions)"
   ```

## Resume after interruption

If the batch was interrupted (Ctrl+C, network error), resume without resubmitting:
```bash
python scripts/generate-question-bank.py \
  --content-dir content/<book> \
  --resume
```

If the batch state is stale or expired (>24h), delete it and restart:
```bash
rm content/<book>/.batch-state.json
python scripts/generate-question-bank.py --content-dir content/<book> --target 50
```

## Single-chapter testing

To generate questions for one chapter before running the full book:
```bash
python scripts/generate-question-bank.py \
  --content-dir content/<book> \
  --chapter 1-1 \
  --target 50
```

## What gets skipped

The script automatically skips non-content sections:
- Front matter (`front-matter-*`)
- Answer keys (`answer-key-*`)
- Appendices (`appendix-*`)
- Glossaries (`*-glossary`, titles containing "glossary")
- Learning activities (titles containing "learning activities")

## Output format

Each `questions/<chapter-id>.json` is a JSON array. Each question has:
- `id` — UUID
- `type` — `multiple_choice | sata | ordered | fill_blank`
- `content` — stem, options/items/blanks, correctAnswer, explanation, rationalePerOption, sourceQuote, sourceSection
- `chapter_id`, `section_title`, `source_url`, `source_citation` — full traceability to the original textbook
- `book_title`, `reviewed: false`, `created_by: "haiku-batch"`

The combined `question-bank.json` includes all questions plus a summary with `total_questions`, `chapters_covered`, and `questions_by_chapter`.

## Rules

- Do NOT commit `.batch-state.json` — it is gitignored
- Do NOT run two batches for the same book simultaneously
- Run `--dry-run` before any large generation to confirm scope
- If the batch API returns errors for specific chapters, those chapters will be missing from the output; re-run with `--chapter <id>` to regenerate them individually