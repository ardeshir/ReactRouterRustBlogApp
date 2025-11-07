import createCache from "@emotion/cache";

export default function createEmotionCache() {
  return createCache({ 
    key: "css",
    prepend: true, // Critical for style injection order
  });
}
