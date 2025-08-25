import { useState, useEffect, useCallback } from 'react'
import { useNavigate, redirect as _redirect } from 'react-router'
import { useAuth } from '../contexts/auth-context'
import { apiClient } from '../lib/api-client'
import { ScrollArea } from '../components/ui/scroll-area'
import { Button } from '../components/ui/button'
import { BarChart3, Users, FileText, Calendar as _Calendar } from 'lucide-react'
import type { LoaderFunctionArgs } from 'react-router'

interface UserSnippetCount {
  userId: string
  username: string
  snippetCount: number
}

interface ReportData {
  data: UserSnippetCount[]
  generatedAt: string
  totalUsers: number
  totalSnippets: number
}

export async function loader({ request: _request }: LoaderFunctionArgs) {
  // Server-side admin check would go here if needed
  // For now, we'll handle admin check on client side
  return {}
}

export function meta() {
  return [
    { title: 'Reports - Snippet Summarizer' },
    { name: 'description', content: 'Admin reports and analytics' },
  ]
}

export default function ReportPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReportData = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const data: ReportData = await apiClient.get('/report', token)
      setReport(data)
    } catch (error: unknown) {
      console.error('Failed to load report:', error)
      setError(error instanceof Error ? error.message : 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    
    if (user.role !== 'admin') {
      navigate('/', { replace: true })
      return
    }

    loadReportData()
  }, [user, token, navigate, loadReportData])

  const refreshReport = () => {
    setError(null)
    loadReportData()
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-destructive">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Failed to load report</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={refreshReport} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-muted-foreground">No report data available</div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              User Activity Report
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generated on {formatDate(report.generatedAt)}
            </p>
          </div>
          <Button onClick={refreshReport} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{report.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{report.totalSnippets}</p>
                <p className="text-sm text-muted-foreground">Total Snippets</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {report.totalUsers > 0 ? (report.totalSnippets / report.totalUsers).toFixed(1) : '0'}
                </p>
                <p className="text-sm text-muted-foreground">Avg per User</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Snippets by User</h2>
          
          {report.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No user data available
            </div>
          ) : (
            <div className="space-y-2">
              {report.data.map((item, index) => (
                <div
                  key={item.userId}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.username}</p>
                      <p className="text-xs text-muted-foreground">ID: {item.userId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-bold text-lg">{item.snippetCount}</p>
                      <p className="text-xs text-muted-foreground">snippets</p>
                    </div>
                    
                    {/* Visual bar representation */}
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden ml-4">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (item.snippetCount / Math.max(...report.data.map(d => d.snippetCount))) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}