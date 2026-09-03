/**
 * Mistral Vibe build output path constants.
 *
 * These constants are intentionally distinct from their source-side equivalents
 * even when the literal values coincide. Future changes to either side must not
 * collapse them.
 */

/** Relative path for the Mistral Vibe-native plugin manifest inside each plugin output directory. */
export const OUTPUT_MISTRAL_MANIFEST_RELATIVE = ".vibe-plugin/plugin.json";

/** Relative path for the Mistral Vibe marketplace catalog in the vibe output tree. */
export const OUTPUT_MISTRAL_MARKETPLACE_RELATIVE = ".vibe-plugin/marketplace.json";
