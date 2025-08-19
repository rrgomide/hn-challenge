import { defineControllers } from './app.js'
import 'dotenv/config'

const app = defineControllers()
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
