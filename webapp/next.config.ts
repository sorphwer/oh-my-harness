import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const config: NextConfig = {
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "harness-kit": resolve(repoRoot, "src/compile.ts"),
    };
    return config;
  },
};

export default config;
