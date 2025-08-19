import { Snippet, CreateSnippetRequest } from '../models/snippet.js';
import { randomUUID } from 'crypto';

export class SnippetService {
  private snippets: Map<string, Snippet> = new Map();

  async createSnippet(request: CreateSnippetRequest): Promise<Snippet> {
    const id = randomUUID();
    const summary = this.generateSummary(request.text);
    
    const snippet: Snippet = {
      id,
      text: request.text,
      summary
    };

    this.snippets.set(id, snippet);
    return snippet;
  }

  async getSnippetById(id: string): Promise<Snippet | null> {
    return this.snippets.get(id) || null;
  }

  private generateSummary(text: string): string {
    const words = text.trim().split(/\s+/);
    
    if (words.length <= 10) {
      return text;
    }
    
    return words.slice(0, 10).join(' ') + '...';
  }
}