import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { defineControllers } from '../app.js'

describe('POST /snippets integration tests', () => {
  const app = defineControllers()

  it('should create a snippet and return 200 with correct response format', async () => {
    const requestBody = {
      text: 'This is a test snippet for integration testing',
    }

    const response = await request(app)
      .post('/snippets')
      .send(requestBody)
      .expect(200)

    expect(response.body).toHaveProperty('id')
    expect(response.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
    expect(response.body.text).toBe(requestBody.text)
    expect(response.body.summary).toBe(
      'This is a test snippet for integration testing'
    )
  })

  it('should handle long text and create proper summary', async () => {
    const longText =
      'This is a very long piece of text that contains more than ten words and should be truncated properly'
    const requestBody = { text: longText }

    const response = await request(app)
      .post('/snippets')
      .send(requestBody)
      .expect(200)

    expect(response.body.text).toBe(longText)
    expect(response.body.summary).toBe(
      'This is a very long piece of text that contains...'
    )
  })

  it('should return 400 when text is missing', async () => {
    const response = await request(app).post('/snippets').send({}).expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is not a string', async () => {
    const response = await request(app)
      .post('/snippets')
      .send({ text: 123 })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is empty string', async () => {
    const response = await request(app)
      .post('/snippets')
      .send({ text: '' })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is null', async () => {
    const response = await request(app)
      .post('/snippets')
      .send({ text: null })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should handle special characters in text', async () => {
    const specialText =
      'Special chars: !@#$%^&*()_+{}|:"<>?[]\\;\',./ àáâãäåæçèéêë'
    const requestBody = { text: specialText }

    const response = await request(app).post('/snippets').send(requestBody)

    expect(response.body.text).toBe(specialText)
    expect(response.body.summary).toBe(specialText)
  })

  it('should handle text with newlines and tabs', async () => {
    const textWithWhitespace = 'Line 1\nLine 2\tTabbed content\n\nLine 4'
    const requestBody = { text: textWithWhitespace }

    const response = await request(app).post('/snippets').send(requestBody)

    expect(response.body.text).toBe(textWithWhitespace)
    expect(response.body.summary).toBe(textWithWhitespace)
  })

  it('should generate unique IDs for different requests', async () => {
    const response1 = await request(app)
      .post('/snippets')
      .send({ text: 'First snippet' })
      .expect(200)

    const response2 = await request(app)
      .post('/snippets')
      .send({ text: 'Second snippet' })
      .expect(200)

    expect(response1.body.id).not.toBe(response2.body.id)
  })

  it('should handle JSON content-type correctly', async () => {
    const response = await request(app)
      .post('/snippets')
      .set('Content-Type', 'application/json')
      .send({ text: 'Content type test' })
      .expect(200)

    expect(response.body.text).toBe('Content type test')
  })

  it('should return proper JSON response format', async () => {
    const response = await request(app)
      .post('/snippets')
      .send({ text: 'JSON format test' })
      .expect(200)

    expect(response.headers['content-type']).toMatch(/json/)
    expect(typeof response.body).toBe('object')
    expect(response.body).not.toBeNull()
  })
})

describe('GET /snippets/:id integration tests', () => {
  const app = defineControllers()

  it('should return 404 when snippet does not exist', async () => {
    const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

    const response = await request(app)
      .get(`/snippets/${nonExistentId}`)
      .expect(404)

    expect(response.body).toEqual({
      error: 'Snippet not found'
    })
  })

  it('should return 404 when snippet with invalid ID format does not exist', async () => {
    const invalidId = 'invalid-id'

    const response = await request(app)
      .get(`/snippets/${invalidId}`)
      .expect(404)

    expect(response.body).toEqual({
      error: 'Snippet not found'
    })
  })

  it('should return 404 when accessing /snippets/ without ID', async () => {
    await request(app)
      .get('/snippets/')
      .expect(404) // This will be a 404 from Express router, not our handler
  })

  it('should return a snippet when valid ID exists', async () => {
    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: 'Test snippet for retrieval' })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body).toEqual({
      id: snippetId,
      text: 'Test snippet for retrieval',
      summary: 'Test snippet for retrieval'
    })
  })

  it('should return correct snippet with long text and summary', async () => {
    const longText = 'This is a very long piece of text that contains more than ten words and should be truncated properly in the summary'
    
    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: longText })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body).toEqual({
      id: snippetId,
      text: longText,
      summary: 'This is a very long piece of text that contains...'
    })
  })

  it('should return correct content type for JSON response', async () => {
    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: 'Content type test' })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.headers['content-type']).toMatch(/json/)
    expect(typeof getResponse.body).toBe('object')
    expect(getResponse.body).not.toBeNull()
  })

  it('should handle special characters in retrieved snippet', async () => {
    const specialText = 'Special chars: !@#$%^&*()_+{}|:"<>?[]\\;\',./ àáâãäåæçèéêë'
    
    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: specialText })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body.text).toBe(specialText)
    expect(getResponse.body.summary).toBe(specialText)
  })

  it('should preserve whitespace in retrieved snippet', async () => {
    const textWithWhitespace = 'Line 1\nLine 2\tTabbed content\n\nLine 4'
    
    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: textWithWhitespace })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body.text).toBe(textWithWhitespace)
    expect(getResponse.body.summary).toBe(textWithWhitespace)
  })
})
