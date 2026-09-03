/**
 * Canonical path constants for the Mistral Vibe workspace layout.
 *
 * Exported from a dedicated file so both `mistral.ts` (tool definition) and
 * flat-mode build helpers can import from a single source of truth, without
 * introducing a cross-layer dependency.
 */

/** Root directory for all Mistral Vibe workspace files. */
export const MISTRAL_WORKSPACE_DIR = ".vibe/";

/** Workspace-level MCP configuration path for Mistral Vibe. */
export const MISTRAL_MCP_PATH = ".vibe/mcp.json";
