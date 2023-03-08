// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    build: {
        transpile: ['three'],
    },
    modules: [
        '@nuxtjs/tailwindcss'
    ],
    css: [
        '~/assets/css/input.css'
    ],
})
