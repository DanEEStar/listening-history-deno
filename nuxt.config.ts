// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  routeRules: {
    "/confirm": { ssr: false },
    "/login": { ssr: false },
  },
  modules: ["@nuxt/ui", "@vueuse/nuxt", "@nuxtjs/supabase"],
  extends: ["@nuxt/ui-pro"],
});