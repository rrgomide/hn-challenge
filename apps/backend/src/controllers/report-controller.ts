import { Request, Response, NextFunction } from 'express'
import { SnippetService } from '../services/snippet-service.js'

export class ReportController {
  constructor(private readonly snippetService: SnippetService) {}

  getSnippetReport = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.snippetService.getSnippetReport()
      response.json({
        data: report,
        generatedAt: new Date().toISOString(),
        totalUsers: report.length,
        totalSnippets: report.reduce((sum, item) => sum + item.snippetCount, 0)
      })
    } catch (error) {
      next(error)
    }
  }
}