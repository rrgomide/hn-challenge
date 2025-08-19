import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { sanitizeJsonString } from '@hn-challenge/shared'
import { generateText } from 'ai'

export interface AIService {
  summarizeText(text: string): Promise<string>
  getProviderName(): string
}

export class GoogleAIService implements AIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async summarizeText(text: string): Promise<string> {
    if (!text || text.trim() === '') {
      throw new Error('Text cannot be empty')
    }

    const sanitizedText = sanitizeJsonString(text)

    try {
      const model = google('gemini-1.5-flash')

      const { text: summary } = await generateText({
        model,
        prompt: `Summarize the following text in a concise way (maximum 30 words): ${sanitizedText}`,
      })

      return summary
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to generate summary: ${message}`)
    }
  }

  getProviderName(): string {
    return 'google'
  }
}

export class OpenAIService implements AIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async summarizeText(text: string): Promise<string> {
    if (!text || text.trim() === '') {
      throw new Error('Text cannot be empty')
    }

    try {
      const model = openai('gpt-4o-mini')

      const { text: summary } = await generateText({
        model,
        prompt: `Summarize the following text in a concise way (maximum 30 words): ${text}`,
      })

      return summary
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to generate summary: ${message}`)
    }
  }

  getProviderName(): string {
    return 'openai'
  }
}

export function createAIService(): AIService {
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  // Prioritize Google AI first
  if (googleApiKey) {
    return new GoogleAIService(googleApiKey)
  }

  if (openaiApiKey) {
    return new OpenAIService(openaiApiKey)
  }

  throw new Error(
    'No AI provider API keys found. Please set either GOOGLE_GENERATIVE_AI_API_KEY or OPENAI_API_KEY environment variable.'
  )
}
