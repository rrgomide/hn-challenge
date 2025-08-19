import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the AI SDK modules
const mockGoogleModel = { name: 'gemini-1.5-flash' }
const mockOpenAIModel = { name: 'gpt-4o-mini' }
const mockGenerateText = vi.fn()

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => mockGoogleModel),
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => mockOpenAIModel),
}))

vi.mock('ai', () => ({
  generateText: mockGenerateText,
}))

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateText.mockClear()
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.OPENAI_API_KEY
    vi.resetModules()
  })

  describe('createAIService', () => {
    it('should prioritize Google AI when GOOGLE_GENERATIVE_AI_API_KEY is available', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
      process.env.OPENAI_API_KEY = 'test-openai-key'

      const { createAIService } = await import('../ai-service.js')
      const service = createAIService()
      expect(service.getProviderName()).toBe('google')
    })

    it('should use OpenAI when only OPENAI_API_KEY is available', async () => {
      process.env.OPENAI_API_KEY = 'test-openai-key'

      const { createAIService } = await import('../ai-service.js')
      const service = createAIService()
      expect(service.getProviderName()).toBe('openai')
    })

    it('should throw error when no API keys are available', async () => {
      const { createAIService } = await import('../ai-service.js')
      expect(() => createAIService()).toThrow(
        'No AI provider API keys found. Please set either GOOGLE_GENERATIVE_AI_API_KEY or OPENAI_API_KEY environment variable.'
      )
    })

    it('should use Google AI when both keys are available (priority test)', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
      process.env.OPENAI_API_KEY = 'test-openai-key'

      const { createAIService } = await import('../ai-service.js')
      const service = createAIService()
      expect(service.getProviderName()).toBe('google')
    })
  })

  describe('GoogleAIService', () => {
    beforeEach(() => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
    })

    it('should summarize text correctly', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'This is a test summary',
      })

      const { GoogleAIService } = await import('../ai-service.js')
      const service = new GoogleAIService('test-key')

      const result = await service.summarizeText(
        'This is a long text that needs to be summarized'
      )

      expect(result).toBe('This is a test summary')
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: mockGoogleModel,
        prompt: expect.stringContaining(
          'Summarize the following text in a concise way'
        ),
      })
    })

    it('should handle AI service errors gracefully', async () => {
      mockGenerateText.mockRejectedValue(new Error('AI service error'))

      const { GoogleAIService } = await import('../ai-service.js')
      const service = new GoogleAIService('test-key')

      await expect(service.summarizeText('Test text')).rejects.toThrow(
        'Failed to generate summary: AI service error'
      )
    })

    it('should return provider name', async () => {
      const { GoogleAIService } = await import('../ai-service.js')
      const service = new GoogleAIService('test-key')
      expect(service.getProviderName()).toBe('google')
    })
  })

  describe('OpenAIService', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-openai-key'
    })

    it('should summarize text correctly', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'This is a test summary from OpenAI',
      })

      const { OpenAIService } = await import('../ai-service.js')
      const service = new OpenAIService('test-key')

      const result = await service.summarizeText(
        'This is a long text that needs to be summarized'
      )

      expect(result).toBe('This is a test summary from OpenAI')
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: mockOpenAIModel,
        prompt: expect.stringContaining(
          'Summarize the following text in a concise way'
        ),
      })
    })

    it('should handle AI service errors gracefully', async () => {
      mockGenerateText.mockRejectedValue(new Error('OpenAI service error'))

      const { OpenAIService } = await import('../ai-service.js')
      const service = new OpenAIService('test-key')

      await expect(service.summarizeText('Test text')).rejects.toThrow(
        'Failed to generate summary: OpenAI service error'
      )
    })

    it('should return provider name', async () => {
      const { OpenAIService } = await import('../ai-service.js')
      const service = new OpenAIService('test-key')
      expect(service.getProviderName()).toBe('openai')
    })
  })

  describe('AIService interface compliance', () => {
    it('should implement summarizeText method', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
      const { createAIService } = await import('../ai-service.js')
      const service = createAIService()

      expect(typeof service.summarizeText).toBe('function')
      expect(service.summarizeText.length).toBe(1) // expects 1 parameter
    })

    it('should implement getProviderName method', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
      const { createAIService } = await import('../ai-service.js')
      const service = createAIService()

      expect(typeof service.getProviderName).toBe('function')
      expect(service.getProviderName.length).toBe(0) // expects 0 parameters
    })
  })

  describe('Text summarization behavior', () => {
    it('should handle empty text', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
      const { createAIService } = await import('../ai-service.js')
      const service = createAIService()

      await expect(service.summarizeText('')).rejects.toThrow(
        'Text cannot be empty'
      )
    })

    it('should handle whitespace-only text', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
      const { createAIService } = await import('../ai-service.js')
      const service = createAIService()

      await expect(service.summarizeText('   \n\t   ')).rejects.toThrow(
        'Text cannot be empty'
      )
    })

    it('should handle very short text by returning summary', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Short text',
      })

      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
      const { GoogleAIService } = await import('../ai-service.js')
      const service = new GoogleAIService('test-key')

      const shortText = 'Short text'
      const result = await service.summarizeText(shortText)

      expect(result).toBe('Short text')
    })
  })
})
