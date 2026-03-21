/**
 * Static key declarations for i18next-parser / the i18n-audit script.
 *
 * NEVER imported at runtime. Its sole purpose is to declare keys that are
 * computed dynamically (template literals) so the audit script doesn't flag
 * them as orphaned.
 *
 * When you write  t(`prefix.${variable}`)  anywhere in the codebase, add each
 * possible resolved value here with its namespace prefix.
 *
 * Example:
 *   t('polls:questionType.multiple_choice');
 *   t('polls:questionType.word_cloud');
 */

declare function t(key: string): string;

// ADAPT: add dynamic key declarations as you build features
