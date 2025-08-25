import '@dotenvx/dotenvx/config'

import { defineControllers } from './app.js'
import { config } from './config/environment.js'

async function startServer() {
  try {
    const app = await defineControllers()

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} (${config.nodeEnv} mode)`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
