import { Request, Response } from 'express';
import { SnippetService } from '../services/snippetService.js';
import { CreateSnippetRequest } from '../models/snippet.js';

export class SnippetController {
  private snippetService: SnippetService;

  constructor() {
    this.snippetService = new SnippetService();
  }

  async createSnippet(req: Request, res: Response): Promise<void> {
    try {
      const { text }: CreateSnippetRequest = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text field is required and must be a string' });
        return;
      }

      const snippet = await this.snippetService.createSnippet({ text });
      res.json(snippet);
    } catch (error) {
      console.error('Error creating snippet:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSnippet(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || id.trim() === '') {
        res.status(400).json({ error: 'Snippet ID is required' });
        return;
      }

      const snippet = await this.snippetService.getSnippetById(id);
      
      if (!snippet) {
        res.status(404).json({ error: 'Snippet not found' });
        return;
      }

      res.json(snippet);
    } catch (error) {
      console.error('Error retrieving snippet:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}