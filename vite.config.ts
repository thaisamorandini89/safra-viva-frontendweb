import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Toda requisição que começar com /api será redirecionada para o Flask
      '/api': {
        target: 'http://flask_backend:5000', // Endereço do seu backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})