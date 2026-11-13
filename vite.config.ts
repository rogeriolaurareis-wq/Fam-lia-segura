// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      // Offline shell: precache hashed client assets, NetworkFirst for HTML navigations.
      // Registration happens only in src/lib/pwa.ts (guarded: never in dev/preview/iframe).
      VitePWA({
        outDir: ".output/public",
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,woff,woff2,svg,ico}"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.method === "GET" &&
                url.origin === self.location.origin &&
                (request.mode === "navigate" || request.destination === "document") &&
                !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: { cacheName: "fs-pages", networkTimeoutSeconds: 3 },
            },
          ],
        },
      }).map((plugin) => ({
        ...plugin,
        applyToEnvironment: (environment: { name: string }) => environment.name === "client",
      })),
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

