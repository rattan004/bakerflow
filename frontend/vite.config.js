import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Add this line

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Listen on all addresses, including LAN and public IPs
  },
  plugins: [
    react(),
    tailwindcss(), // Add this line
  ],
})