import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo: conteúdo editorial mora em ../content (fora de web/)
  outputFileTracingRoot: path.join(rootDir, ".."),
  outputFileTracingIncludes: {
    "/*": [
      "../content/published/**/*",
      "../content/taxonomy.json",
      "../content/authors.json",
    ],
  },
};

export default nextConfig;
