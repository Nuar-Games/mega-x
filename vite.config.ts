import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins:[react()],
  build:{
    rollupOptions:{
      input:{
        main:resolve(process.cwd(),'index.html'),
        arenaNextPrototype:resolve(process.cwd(),'arena-next-prototype.html'),
      },
    },
  },
})
