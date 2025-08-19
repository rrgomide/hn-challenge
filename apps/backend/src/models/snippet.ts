export interface Snippet {
  id: string;
  text: string;
  summary: string;
}

export interface CreateSnippetRequest {
  text: string;
}