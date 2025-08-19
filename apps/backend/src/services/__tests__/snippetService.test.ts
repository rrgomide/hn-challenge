import { describe, it, expect, beforeEach } from 'vitest';
import { SnippetService } from '../snippetService.js';

describe('SnippetService', () => {
  let snippetService: SnippetService;

  beforeEach(() => {
    snippetService = new SnippetService();
  });

  describe('createSnippet', () => {
    it('should create a snippet with id, text, and summary', async () => {
      const request = { text: 'This is a test snippet' };
      
      const result = await snippetService.createSnippet(request);
      
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.text).toBe('This is a test snippet');
      expect(result.summary).toBe('This is a test snippet');
    });

    it('should generate summary with first 10 words when text is longer', async () => {
      const longText = 'This is a very long text that contains more than ten words and should be truncated in summary';
      const request = { text: longText };
      
      const result = await snippetService.createSnippet(request);
      
      expect(result.text).toBe(longText);
      expect(result.summary).toBe('This is a very long text that contains more than...');
    });

    it('should return full text as summary when text has exactly 10 words', async () => {
      const exactText = 'This text has exactly ten words in it for testing';
      const request = { text: exactText };
      
      const result = await snippetService.createSnippet(request);
      
      expect(result.summary).toBe(exactText);
    });

    it('should handle empty text', async () => {
      const request = { text: '' };
      
      const result = await snippetService.createSnippet(request);
      
      expect(result.text).toBe('');
      expect(result.summary).toBe('');
    });

    it('should handle text with only whitespace', async () => {
      const request = { text: '   \n\t  ' };
      
      const result = await snippetService.createSnippet(request);
      
      expect(result.text).toBe('   \n\t  ');
      expect(result.summary).toBe('   \n\t  ');
    });

    it('should generate unique IDs for different snippets', async () => {
      const request1 = { text: 'First snippet' };
      const request2 = { text: 'Second snippet' };
      
      const result1 = await snippetService.createSnippet(request1);
      const result2 = await snippetService.createSnippet(request2);
      
      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle single word text', async () => {
      const request = { text: 'Hello' };
      
      const result = await snippetService.createSnippet(request);
      
      expect(result.text).toBe('Hello');
      expect(result.summary).toBe('Hello');
    });
  });
});