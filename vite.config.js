import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequestHandler } from './src/app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function debtwiseApiMiddleware() {
  return {
    name: 'debtwise-api-middleware',
    configureServer(server) {
      const handler = createRequestHandler()
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '/'
        const isApiRequest = url === '/api' || url.startsWith('/api/')

        if (!isApiRequest) {
          next()
          return
        }

        const originalUrl = req.url
        const originalPath = url

        try {
          const rewritten = originalPath.slice(4) || '/'
          req.url = rewritten.startsWith('/') ? rewritten : `/${rewritten}`
          await handler(req, res)
          if (!res.writableEnded) {
            next()
          }
        } catch (error) {
          console.error('[dev-api] Request handling failed:', error)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: { message: 'Internal Server Error' } }))
          }
        } finally {
          req.url = originalUrl
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), debtwiseApiMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
