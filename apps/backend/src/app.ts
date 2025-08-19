import express, { Express } from 'express';
import { greet } from '@hn-challenge/shared';
import { SnippetController } from './controllers/snippetController.js';

export function createApp(): Express {
  const app = express();
  
  app.use(express.json());
  
  const snippetController = new SnippetController();
  
  app.get('/', (req, res) => {
    res.json({ message: greet('Backend') });
  });
  
  app.post('/snippets', (req, res) => snippetController.createSnippet(req, res));
  
  return app;
}