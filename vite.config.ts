import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode, command }) => {
  const isProduction = mode === 'production';
  const isServe = command === 'serve';

  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'DonationWidget',
        formats: ['es', 'umd'],
        fileName: (format) => `donation-widget.${format}.js`
      },
      rollupOptions: {
        input: {
          ...(isServe ? {
            main: resolve(__dirname, 'index.html'),
            javascript: resolve(__dirname, 'examples/javascript-api.html'),
            themes: resolve(__dirname, 'examples/themes.html')
          } : {
            main: resolve(__dirname, 'src/index.ts'),
          })
        },
        output: {
          assetFileNames: 'donation-widget.[ext]',
          // Inline all dynamic imports for single bundle
          inlineDynamicImports: true,
          // Use named exports only
          exports: 'named',
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
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        plugins: [],
      },
      // Minification settings
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          // Remove console statements in production
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
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
      } : undefined,
      // Source maps for debugging
      sourcemap: isProduction ? true : 'inline',
      // Target modern browsers for smaller bundle
      target: 'es2020',
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
        '@': resolve(__dirname, './src')
      },
      // Optimize resolution
      dedupe: ['lit', 'lit-element', 'lit-html', 'lit-html/directives'],
    },
    // CSS configuration
    css: {
      postcss: './postcss.config.mjs',
      // Minify CSS in production
      devSourcemap: !isProduction,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['lit', '@lifi/sdk', 'viem'],
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
      legalComments: 'none',
      treeShaking: true,
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
    },
  };
});
