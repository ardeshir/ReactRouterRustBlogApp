import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig({
  plugins: [reactRouter()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 3000,
    },
  },
  ssr: {
    noExternal: ["@mui/material", "@mui/icons-material"],
  },
});
