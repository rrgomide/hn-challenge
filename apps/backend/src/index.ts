import { defineControllers } from './app.js'
import 'dotenv/config'

async function startServer() {
  try {
    const app = await defineControllers()
    const port = process.env.PORT || 3000

    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
