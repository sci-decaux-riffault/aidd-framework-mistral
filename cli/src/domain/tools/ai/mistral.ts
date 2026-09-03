import { AgentsCapability } from "../../capabilities/agents-capability.js";
import { CommandsCapability } from "../../capabilities/commands-capability.js";
import { McpCapability } from "../../capabilities/mcp-capability.js";
import { PluginsCapability } from "../../capabilities/plugins-capability.js";
import { RulesCapability } from "../../capabilities/rules-capability.js";
import { SkillsCapability } from "../../capabilities/skills-capability.js";
import {
  convertCommandFrontmatter,
  detectSectionKeyFromPrefixes,
  reverseConvertCommandFrontmatter,
  stripToolSuffix,
} from "../../formats/command.js";
import { baseReverseRewriteContent, baseRewriteContent } from "../../formats/placeholders.js";
import { CONFIG_MCP } from "../../models/framework.js";
import type {
  AiTool,
  HasAgents,
  HasCommands,
  HasMcp,
  HasPlugins,
  HasRules,
  HasSkills,
  UserFileSectionKey,
} from "../contracts.js";
import { registerTool } from "../registry.js";
import { MISTRAL_MCP_PATH, MISTRAL_WORKSPACE_DIR } from "./mistral-paths.js";

const DIRECTORY = MISTRAL_WORKSPACE_DIR;
const TOOL_SUFFIX = ".md";

function commandsDir(phase: string): string {
  return `${DIRECTORY}commands/aidd/${phase}/`;
}

export const mistral: AiTool<HasAgents & HasSkills & HasCommands & HasRules & HasMcp & HasPlugins> =
  {
    kind: "ai",
    toolId: "mistral",
    directory: DIRECTORY,
    toolSuffix: TOOL_SUFFIX,
    signalDir: ".vibe/commands",
    configOutputPaths: {
      "settings.json": ".vibe/settings.json",
    },

    capabilities: {
      agents: new AgentsCapability({
        directory: DIRECTORY,
        toolSuffix: TOOL_SUFFIX,
        format: "markdown",
        buildInstallPath: (fileName) =>
          `${DIRECTORY}agents/${stripToolSuffix(TOOL_SUFFIX, fileName)}`,
        convertFrontmatter: (fm) => {
          // Convert AIDD frontmatter to Vibe format (only name, description)
          const result: Record<string, unknown> = {};
          if (fm.name !== undefined) result.name = fm.name;
          if (fm.description !== undefined) result.description = fm.description;
          // Remove all other fields not supported by Vibe
          return result;
        },
        reverseConvertFrontmatter: (fm) => fm,
      }),
      skills: new SkillsCapability({
        directory: DIRECTORY,
        toolSuffix: TOOL_SUFFIX,
        buildInstallPath: (fileName) => {
          // stripToolSuffix keeps the .md extension, so we need to remove it for Vibe
          const baseName = stripToolSuffix(TOOL_SUFFIX, fileName);
          const withoutMd = baseName.endsWith(".md") ? baseName.slice(0, -3) : baseName;
          return `${DIRECTORY}skills/${withoutMd.toLowerCase()}/skill.md`;
        },
        convertFrontmatter: (fm) => {
          // Convert AIDD frontmatter to Vibe format (only name, description)
          const result: Record<string, unknown> = {};
          if (fm.name !== undefined) result.name = fm.name;
          if (fm.description !== undefined) result.description = fm.description;
          // Remove all other fields (argument-hint, etc.) not supported by Vibe
          return result;
        },
        reverseConvertFrontmatter: (fm) => fm,
      }),
      commands: new CommandsCapability({
        directory: DIRECTORY,
        toolSuffix: TOOL_SUFFIX,
        buildInstallPath: (fileName) => {
          const slashIdx = fileName.indexOf("/");
          if (slashIdx !== -1) {
            const phaseDir = fileName.slice(0, slashIdx);
            const rest = fileName.slice(slashIdx + 1);
            const phase = phaseDir.match(/^(\d+)/)?.[1];
            if (phase) return `${DIRECTORY}commands/${rest}`;
          }
          return `${DIRECTORY}commands/${stripToolSuffix(TOOL_SUFFIX, fileName)}`;
        },
        convertFrontmatter: (fm, relativeFileName) =>
          convertCommandFrontmatter(fm, relativeFileName),
        reverseConvertFrontmatter: (fm) => reverseConvertCommandFrontmatter(fm),
      }),
      rules: new RulesCapability({
        directory: DIRECTORY,
        toolSuffix: TOOL_SUFFIX,
        buildInstallPath: (fileName) =>
          `${DIRECTORY}rules/${stripToolSuffix(TOOL_SUFFIX, fileName)}`,
        convertFrontmatter: (fm) => {
          if ("paths" in fm) {
            const paths = fm.paths;
            if (Array.isArray(paths) && paths.length === 0) return {};
            return { paths };
          }
          if ("globs" in fm) return { paths: fm.globs };
          if ("alwaysApply" in fm) {
            if (fm.alwaysApply === false && fm.description !== undefined) {
              return { description: fm.description };
            }
            return {};
          }
          return {};
        },
        reverseConvertFrontmatter: (fm) =>
          Array.isArray(fm.paths) && fm.paths.length > 0 ? { paths: fm.paths } : {},
      }),
      mcp: new McpCapability({
        outputPath: MISTRAL_MCP_PATH,
        format: "json",
        entrySection: "mcpServers",
        consumes: [CONFIG_MCP],
      }),
      plugins: new PluginsCapability({
        mode: "flat",
        flatNamespacePrefix: "aidd-",
      }),
    },

    rewriteContent(content: string, docsDir: string): string {
      return baseRewriteContent(content, DIRECTORY, docsDir).replace(
        /(@?)\.vibe\/commands\/(\d+)[_-][^/]+\/([^\s]+)/g,
        "$1.vibe/commands/$2/$3"
      );
    },

    reverseRewriteContent(content: string, docsDir: string): string {
      return baseReverseRewriteContent(content, DIRECTORY, docsDir);
    },

    detectUserFileSectionKey(relativePath: string): UserFileSectionKey | null {
      return detectSectionKeyFromPrefixes(relativePath, [
        [`${DIRECTORY}agents/`, "agents"],
        [`${DIRECTORY}commands/`, "commands"],
        [`${DIRECTORY}rules/`, "rules"],
        [`${DIRECTORY}skills/`, "skills"],
      ]);
    },
  };

registerTool(mistral);
