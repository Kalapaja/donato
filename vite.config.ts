import { defineConfig, Plugin } from "vite";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { versioningPlugin } from "./vite-plugin-versioning.ts";

// Plugin to serve donation-widget.js from dist in dev mode
function devWidgetPlugin(): Plugin {
  return {
    name: "dev-widget-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/donation-widget.js") {
          try {
            const distPath = resolve(__dirname, "dist/donation-widget.js");
            if (existsSync(distPath)) {
              const content = readFileSync(distPath, "utf-8");
              res.setHeader("Content-Type", "application/javascript");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Cache-Control", "no-cache");
              res.end(content);
              return;
            }
            // If file doesn't exist, return 404
            res.statusCode = 404;
            res.end(
              'File not found. Run "deno task build:dev" first or wait for watch build.',
            );
            return;
          } catch (err) {
            console.error("Error serving widget:", err);
            res.statusCode = 500;
            res.end("Error serving widget file");
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const isProduction = mode === "production";
  const isServe = command === "serve";

  // Read version from deno.json
  let version = "0.0.0";
  try {
    const denoJsonPath = resolve(__dirname, "deno.json");
    const denoJson = JSON.parse(readFileSync(denoJsonPath, "utf-8"));
    version = denoJson.version || version;
  } catch (error) {
    console.warn("Could not read version from deno.json:", error);
  }

  return {
    plugins: isServe ? [devWidgetPlugin()] : [
      // Versioning plugin for production builds
      versioningPlugin({
        enabled: isProduction,
      }),
    ],
    // Define global constants to inline environment variables
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
      "__WIDGET_VERSION__": JSON.stringify(version),
    },
    build: {
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "DonationWidget",
        formats: ["umd"],
        fileName: () => "donation-widget.js",
      },
      rollupOptions: {
        input: {
          ...(isServe
            ? {
              main: resolve(__dirname, "index.html"),
              javascript: resolve(__dirname, "examples/javascript-api.html"),
              themes: resolve(__dirname, "examples/themes.html"),
              confettiDemo: resolve(__dirname, "examples/confetti-demo.html"),
            }
            : {
              main: resolve(__dirname, "src/index.ts"),
            }),
        },
        output: {
          assetFileNames: "donation-widget.[ext]",
          // Inline all dynamic imports for single bundle
          inlineDynamicImports: true,
          // Use named exports only
          exports: "named",
          // Optimize output
          compact: true,
          generatedCode: {
            constBindings: true,
            objectShorthand: true,
          },
        },
        // Don't externalize any dependencies - bundle everything
        external: [],
        // Tree shaking configuration
        // Note: @reown packages have side effects (web component registration)
        // so we need to preserve them
        treeshake: {
          moduleSideEffects: (id) => {
            // For source files, allow tree shaking
            return true;
          },
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        plugins: [],
      },
      // Minification settings
      minify: isProduction ? "terser" : false,
      terserOptions: isProduction
        ? {
          compress: {
            // Remove console statements in production
            drop_console: true,
            drop_debugger: true,
            pure_funcs: [
              "console.log",
              "console.info",
              "console.debug",
              "console.trace",
            ],
            // Advanced optimizations
            passes: 2,
            unsafe: false,
            unsafe_comps: false,
            unsafe_math: false,
            unsafe_proto: false,
            // Remove unused code
            dead_code: true,
            unused: true,
            // Optimize conditionals
            conditionals: true,
            evaluate: true,
            booleans: true,
            loops: true,
            // Optimize property access
            properties: true,
            // Inline functions
            inline: 2,
            // Reduce variable names
            reduce_vars: true,
            // Join consecutive var statements
            join_vars: true,
            // Collapse single-use vars
            collapse_vars: true,
          },
          mangle: {
            // Mangle property names for smaller bundle
            properties: false, // Keep property names for API compatibility
            toplevel: true,
            safari10: true,
          },
          format: {
            comments: false,
            ecma: 2020,
            safari10: true,
          },
          // Keep class names for debugging
          keep_classnames: false,
          keep_fnames: false,
        }
        : undefined,
      // Source maps for debugging
      sourcemap: isProduction ? true : "inline",
      // Target modern browsers for smaller bundle
      target: "es2020",
      // Optimize chunk size
      chunkSizeWarningLimit: 500,
      // Report compressed size
      reportCompressedSize: true,
      // CSS code splitting
      cssCodeSplit: false,
      // Optimize dependencies
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
      // Optimize resolution
      dedupe: ["lit", "lit-element", "lit-html", "lit-html/directives"],
    },
    // CSS configuration
    css: {
      postcss: "./postcss.config.mjs",
      // Minify CSS in production
      devSourcemap: !isProduction,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ["lit", "@1inch/cross-chain-sdk", "@1inch/fusion-sdk", "viem"],
      exclude: [],
    },
    // Development server configuration
    server: {
      port: 3000,
      open: true,
      cors: true,
    },
    // Preview server configuration
    preview: {
      port: 4173,
      cors: true,
    },
    // Enable esbuild optimizations
    esbuild: {
      legalComments: "none",
      treeShaking: true,
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
    },
  };
});
