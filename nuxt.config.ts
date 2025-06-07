// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  routeRules: {
    "/confirm": { ssr: false },
    "/login": { ssr: false },
  },
  modules: ["@nuxt/ui", "@nuxt/ui-pro", "@vueuse/nuxt", "@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],
});