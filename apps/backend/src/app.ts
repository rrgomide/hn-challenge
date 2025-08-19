import express, { Express } from 'express'
import { greet } from '@hn-challenge/shared'
import { SnippetController } from './controllers/snippet-controller.js'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export function defineControllers(): Express {
  const app = express()

  app.use(express.json())

  const snippetController = new SnippetController()

  app.get('/', (req, res) => {
    res.json({ message: greet('Backend') })
  })

  app.post('/snippets', (req, res) => snippetController.createSnippet(req, res))
  app.get('/snippets/:id', (req, res) => snippetController.getSnippet(req, res))

  // app.get('/test-gemini', async (_, res) => {
  //   const { text } = await generateText({
  //     model: google('models/gemini-2.0-flash-exp'),
  //     prompt: 'What is love?',
  //   })

  //   res.json({ text })
  // })

  return app
}
