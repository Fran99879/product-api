import 'dotenv/config'
import { createApp } from './app.js'
import { createModels } from './models/index.js'

const { PORT } = process.env
if (!PORT) throw new Error('PORT no definido en .env')

const models = await createModels()

const app = createApp(models)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
