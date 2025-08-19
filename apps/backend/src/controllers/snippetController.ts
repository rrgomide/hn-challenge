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
}