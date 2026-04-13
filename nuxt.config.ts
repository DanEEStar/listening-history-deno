// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-11-01",
  devtools: { enabled: true },
  routeRules: {
    "/confirm": { ssr: false },
    "/login": { ssr: false },
  },
  modules: ["@nuxt/icon", "@vueuse/nuxt", "@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
});
