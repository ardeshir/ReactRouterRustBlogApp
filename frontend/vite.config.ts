import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isProduction = process.env.NODE_ENV === "production";

// Critical: Conditional noExternal based on environment
const noExternal = ["@mui/icons-material"];

if (isProduction) {
  noExternal.push(
    "@mui/material",
    "@mui/utils",
    "@mui/system",
    "@mui/styled-engine"
  );
}

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    host: true, // Important for Docker
  },
  ssr: {
    noExternal, // This is the key fix
  },
  optimizeDeps: {
    include: ["@emotion/styled"],
  },
});
