import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { SnippetController } from '../snippetController.js';

describe('SnippetController', () => {
  let controller: SnippetController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    controller = new SnippetController();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: mockStatus as any,
      json: mockJson as any
    };
  });

  describe('createSnippet', () => {
    it('should create and return a snippet when valid text is provided', async () => {
      mockRequest.body = { text: 'Test snippet text' };

      await controller.createSnippet(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
          text: 'Test snippet text',
          summary: 'Test snippet text'
        })
      );
    });

    it('should return 400 when text is missing', async () => {
      mockRequest.body = {};

      await controller.createSnippet(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string'
      });
    });

    it('should return 400 when text is not a string', async () => {
      mockRequest.body = { text: 123 };

      await controller.createSnippet(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string'
      });
    });

    it('should return 400 when text is null', async () => {
      mockRequest.body = { text: null };

      await controller.createSnippet(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string'
      });
    });

    it('should return 400 when text is empty string', async () => {
      mockRequest.body = { text: '' };

      await controller.createSnippet(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string'
      });
    });

    it('should handle long text and create proper summary', async () => {
      const longText = 'This is a very long piece of text that should be summarized properly by the service layer';
      mockRequest.body = { text: longText };

      await controller.createSnippet(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          text: longText,
          summary: 'This is a very long piece of text that should...'
        })
      );
    });

    it('should return 500 when service throws an error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the service to throw an error
      const originalService = (controller as any).snippetService;
      (controller as any).snippetService = {
        createSnippet: vi.fn().mockRejectedValue(new Error('Service error'))
      };

      mockRequest.body = { text: 'Valid text' };

      await controller.createSnippet(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      (controller as any).snippetService = originalService;
      consoleErrorSpy.mockRestore();
    });
  });
});