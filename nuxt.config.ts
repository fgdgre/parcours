export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-07-13',
  app: {
    head: {
      title: 'Parcours',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#12121a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Parcours' },
        { name: 'description', content: 'Personal French A0→B2 path: Language Transfer, pronunciation, SRS vocabulary, speaking and dictation drills.' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' },
      ],
    },
  },
})
