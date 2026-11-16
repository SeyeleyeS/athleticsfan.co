import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const rootDir = import.meta.dirname;

function htmlInputs(dir: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const full = resolve(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".html")) {
        const rel = full.slice(dir.length + 1).replace(/\.html$/, "").replaceAll("/", "-");
        entries[rel === "index" ? "home" : rel] = full;
      }
    }
  };
  walk(dir);
  return entries;
}

function stableCss(): Plugin {
  return {
    name: "stable-site-css",
    generateBundle(_options, bundle) {
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === "asset" && fileName.endsWith(".css")) {
          item.fileName = "assets/site.css";
        }
      }
    },
  };
}

const webRoot = resolve(rootDir, "web");

export default defineConfig({
  appType: "mpa",
  root: webRoot,
  publicDir: resolve(rootDir, "public"),
  plugins: [stableCss()],
  server: {
    fs: { allow: [rootDir] },
  },
  build: {
    outDir: resolve(rootDir, "dist"),
    emptyOutDir: true,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: {
        ...htmlInputs(webRoot),
        thread: resolve(rootDir, "src/client/pages/thread.ts"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (info) => {
          const names = info.names ?? [];
          if (names.some((name) => name.endsWith(".css")) || (info.name ?? "").endsWith(".css")) {
            return "assets/site.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
