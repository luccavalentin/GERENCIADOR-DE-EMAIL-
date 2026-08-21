import { defineConfig } from "@lovable.dev/vite-tanstack-config";


import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: "Agilliza Gerenciador de E-mail",
          short_name: "Agilliza",
          description: "Sistema profissional para gerenciamento e monitoramento de e-mails Agilliza",

          theme_color: "#0000a2",
          background_color: "#fcfbf8",
          display: "standalone",
          icons: [],

        },
      }),
    ],
  },
});
