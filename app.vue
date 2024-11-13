<script setup lang="ts">
const links = [{
  label: 'Documentation',
  icon: 'i-heroicons-book-open',
  to: '/getting-started'
}, {
  label: 'Playground',
  icon: 'i-simple-icons-stackblitz',
  to: '/playground'
}, {
  label: 'Roadmap',
  icon: 'i-heroicons-map',
  to: '/roadmap'
}, {
  label: 'Pro',
  icon: 'i-heroicons-square-3-stack-3d',
  to: '/pro'
}, {
  label: 'Releases',
  icon: 'i-heroicons-rocket-launch',
  to: 'https://github.com/nuxt/ui/releases',
  target: '_blank'
}]
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <Logo class="w-auto h-6" />
    </template>

    <template #right>
      <UColorModeButton />

      <UButton icon="i-simple-icons-github" to="https://github.com/nuxt/nuxt" target="_blank" color="gray" variant="ghost" />
    </template>
  </UHeader>

  <UMain>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UMain>

  <UFooter>
    <template #left>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Copyright © 2016-{{ new Date().getFullYear() }} Nuxt - <NuxtLink class="hover:underline" to="https://github.com/nuxt/nuxt/blob/main/LICENSE" target="_blank">
          MIT License
        </NuxtLink>
      </p>
    </template>

    <template #right>
      <UButton to="https://x.com/nuxt_js" target="_blank" icon="i-simple-icons-x" color="gray" variant="ghost" />
      <UButton to="https://discord.com/invite/ps2h6QT" target="_blank" icon="i-simple-icons-discord" color="gray" variant="ghost" />
      <UButton to="https://github.com/nuxt/nuxt" target="_blank" icon="i-simple-icons-github" color="gray" variant="ghost" />
    </template>
  </UFooter>
  <UNotifications />
</template>
