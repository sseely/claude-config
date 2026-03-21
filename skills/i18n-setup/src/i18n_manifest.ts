/**
 * Context annotations for the translation script.
 * Each entry describes where/how a string is used so Claude can produce
 * accurate, natural translations rather than literal word-for-word substitutions.
 *
 * Build-time only — not imported by any runtime code.
 *
 * Add an entry here whenever you add a new key that needs translation context.
 * Keys that are self-evident (e.g. button labels) don't need entries.
 *
 * Run:  cd ui && npm run translate -- --force --ns <namespace>
 */
export const TRANSLATION_CONTEXT: Record<string, Record<string, string>> = {
  common: {
    // Example:
    // 'nav.dashboard': 'Main navigation item linking to the dashboard home page',
    // 'status.active': 'Badge label for a session that is currently running',
  },
  // ADAPT: add a section for each namespace you add to the project
};
