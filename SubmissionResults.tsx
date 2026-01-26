import { useState, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { TestSubmissionReview } from "~/components/TestSubmissionReview";
import { cn } from "~/lib/utils";
import { Target, Eye, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface SubmissionResultsProps {
  token: string;
}

export function SubmissionResults({ token }: SubmissionResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showSubmissionReview, setShowSubmissionReview] = useState(false);
  const [sortField, setSortField] = useState<'createdAt' | 'finalPercentScore'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [submissionsPerPage, setSubmissionsPerPage] = useState(20);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    submissionId: string;
    candidateName: string;
    testName: string;
  } | null>(null);

  // Add connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'refreshing'>('connected');

  const trpc = useTRPC();

  // Fetch all submissions with results - more responsive polling
  const { data: submissionsData, isLoading, refetch, error, isError } = useQuery(
    trpc.getAllSubmissions.queryOptions({
      token,
      status: statusFilter as any || undefined,
      result: resultFilter as any || undefined,
      search: searchTerm || undefined,
      page: currentPage,
      limit: submissionsPerPage,
      sortField,
      sortOrder,
    }, {
      refetchInterval: 10000, // Reduced from 30000ms to 10000ms (10 seconds) for more responsive updates
      refetchIntervalInBackground: true, // Keep polling when window is not focused
      retry: (failureCount, error) => {
        if (error.message.includes('Invalid or expired token')) {
          return false;
        }
        return failureCount < 3; // Increased retry attempts
      },
      // Add stale time to prevent unnecessary refetches
      staleTime: 5000, // 5 seconds
      // Ensure we get fresh data when component mounts or window gains focus
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      // Handle network connectivity
      networkMode: 'online',
    })
  );

  // Track connection status
  useEffect(() => {
    if (isError) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('connected');
    }
  }, [isError]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setConnectionStatus('refreshing');
    try {
      await refetch();
      setConnectionStatus('connected');
      toast.success('Submission data refreshed!', {
        duration: 2000,
        icon: '🔄',
      });
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Failed to refresh data. Please try again.', {
        duration: 3000,
        icon: '⚠️',
      });
    }
  };

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation(
    trpc.deleteSubmission.mutationOptions({
      onSuccess: (data) => {
        refetch();
        setDeleteConfirmation(null);
        toast.success(data.message);
      },
      onError: (error) => {
        console.error('Delete submission error:', error);
        if (error.message.includes('Invalid or expired token')) {
          localStorage.removeItem('admin-token');
          window.location.reload();
        } else {
          toast.error(`Failed to delete submission: ${error.message}`);
        }
      },
    })
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING_APPROVAL: { 
        bg: "bg-yellow-100", 
        text: "text-yellow-800", 
        label: "Pending Approval",
        icon: Clock
      },
      IN_PROGRESS: { 
        bg: "bg-blue-100", 
        text: "text-blue-800", 
        label: "In Progress",
        icon: Clock
      },
      COMPLETED: { 
        bg: "bg-purple-100", 
        text: "text-purple-800", 
        label: "Completed",
        icon: AlertCircle
      },
      EVALUATED: { 
        bg: "bg-green-100", 
        text: "text-green-800", 
        label: "Evaluated",
        icon: CheckCircle
      },
      CANCELED: { 
        bg: "bg-red-100", 
        text: "text-red-800", 
        label: "Canceled",
        icon: XCircle
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.COMPLETED;
    const IconComponent = config.icon;
    
    return (
      <span className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium gap-1",
        config.bg, 
        config.text
      )}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getResultBadge = (result: string | null, score: number | null) => {
    if (!result) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Pending
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          result === 'PASS' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {result === 'PASS' ? '✓ PASS' : '✗ FAIL'}
        </span>
        {score !== null && (
          <span className="text-sm font-medium text-gray-700">
            {score.toFixed(1)}%
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading submissions...</p>
      </div>
    );
  }

  if (error && error.message.includes('Invalid or expired token')) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
        <p className="text-gray-600">Your session has expired. Please refresh the page to log in again.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Enhanced Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Target className="h-5 w-5 text-green-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Test Submissions
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span>{submissionsData?.pagination.total || 0} total submissions</span>
                <div className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-200",
                  connectionStatus === 'connected' ? "bg-green-500 animate-pulse" :
                  connectionStatus === 'refreshing' ? "bg-yellow-500" :
                  "bg-red-500"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  connectionStatus === 'connected' ? "text-green-600" :
                  connectionStatus === 'refreshing' ? "text-yellow-600" :
                  "text-red-600"
                )}>
                  {connectionStatus === 'connected' ? 'Live updates' :
                   connectionStatus === 'refreshing' ? 'Refreshing...' :
                   'Connection issues'}
                </span>
                <button
                  onClick={handleManualRefresh}
                  disabled={connectionStatus === 'refreshing'}
                  className="p-1 hover:bg-blue-50 rounded transition-colors duration-200 disabled:opacity-50"
                  title="Refresh submission data"
                >
                  <RefreshCw className={cn(
                    "h-3 w-3 text-gray-500 hover:text-blue-500 transition-colors duration-200",
                    connectionStatus === 'refreshing' && "animate-spin"
                  )} />
                </button>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search with enhanced styling */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search candidates or tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-400 focus:shadow-lg"
              />
            </div>
            
            {/* Enhanced dropdowns */}
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [typeof sortField, typeof sortOrder];
                setSortField(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-400 bg-white"
            >
              <option value="createdAt-desc">🕒 Latest First</option>
              <option value="createdAt-asc">🕐 Oldest First</option>
              <option value="finalPercentScore-desc">📈 Highest Score</option>
              <option value="finalPercentScore-asc">📉 Lowest Score</option>
            </select>
            
            <select
              value={submissionsPerPage}
              onChange={(e) => {
                setSubmissionsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-400 bg-white"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-400 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">✅ Completed</option>
              <option value="EVALUATED">📊 Evaluated</option>
              <option value="IN_PROGRESS">⏳ In Progress</option>
              <option value="PENDING_APPROVAL">🔍 Pending</option>
              <option value="CANCELED">❌ Canceled</option>
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-400 bg-white"
            >
              <option value="">All Results</option>
              <option value="PASS">✅ Pass</option>
              <option value="FAIL">❌ Fail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidate
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissionsData?.submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 hover:shadow-sm animate-fade-in group">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="group-hover:scale-105 transition-transform duration-200">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                      {submission.candidateName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {submission.candidateEmail}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">{submission.testName}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      submission.testType === "INTERNAL" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-green-100 text-green-700"
                    )}>
                      {submission.testType}
                    </span>
                    <span>• {submission.testDurationMinutes}min</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(submission.status)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getResultBadge(submission.finalResult, submission.finalPercentScore)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {submission.endTime 
                        ? new Date(submission.endTime).toLocaleDateString()
                        : new Date(submission.createdAt).toLocaleDateString()
                      }
                    </span>
                    <span className="text-xs text-gray-500">
                      {submission.endTime 
                        ? new Date(submission.endTime).toLocaleTimeString()
                        : new Date(submission.createdAt).toLocaleTimeString()
                      }
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {submission.startTime && submission.endTime ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">
                        {Math.round((new Date(submission.endTime).getTime() - new Date(submission.startTime).getTime()) / (1000 * 60))}min
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      —
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedSubmission(submission.id);
                        setShowSubmissionReview(true);
                      }}
                      className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 hover:shadow-md group-hover:scale-105"
                    >
                      <Eye className="h-3 w-3" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setDeleteConfirmation({
                          submissionId: submission.id,
                          candidateName: submission.candidateName,
                          testName: submission.testName,
                        });
                      }}
                      disabled={deleteSubmissionMutation.isPending}
                      className="flex items-center gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 hover:shadow-md group-hover:scale-105"
                      title="Delete submission permanently"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Empty state */}
      {submissionsData?.submissions.length === 0 && (
        <div className="p-12 text-center animate-fade-in">
          <div className="relative mb-6">
            <Target className="h-16 w-16 mx-auto text-gray-300 animate-float" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Search className="h-3 w-3 text-blue-500" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Found</h3>
          <p className="text-gray-600 mb-4">No test submissions match your current filters.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Try adjusting your search or filters</span>
          </div>
        </div>
      )}

      {/* Enhanced Pagination */}
      {submissionsData?.pagination && submissionsData.pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>
                Showing <span className="font-medium">{((submissionsData.pagination.page - 1) * submissionsData.pagination.limit) + 1}</span> to{" "}
                <span className="font-medium">{Math.min(submissionsData.pagination.page * submissionsData.pagination.limit, submissionsData.pagination.total)}</span> of{" "}
                <span className="font-medium">{submissionsData.pagination.total}</span> results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 disabled:opacity-50"
              >
                ← Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-700 px-3 py-1 bg-white rounded-md border">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{submissionsData.pagination.totalPages}</span>
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= submissionsData.pagination.totalPages}
                className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 disabled:opacity-50"
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Submission Review Modal */}
      {showSubmissionReview && selectedSubmission && (
        <TestSubmissionReview
          token={token}
          submissionId={selectedSubmission}
          onClose={() => {
            setShowSubmissionReview(false);
            setSelectedSubmission(null);
            refetch(); // Refresh data after review
          }}
        />
      )}

      {/* Delete Submission Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Submission</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Are you sure you want to permanently delete this test submission?
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium text-red-800 dark:text-red-400">
                    Warning: Complete Data Removal
                  </span>
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• <strong>Candidate:</strong> {deleteConfirmation.candidateName}</li>
                  <li>• <strong>Test:</strong> {deleteConfirmation.testName}</li>
                  <li>• All submission answers will be permanently deleted</li>
                  <li>• Test scores and results will be removed</li>
                  <li>• This action cannot be reversed</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1"
                disabled={deleteSubmissionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (deleteConfirmation) {
                    deleteSubmissionMutation.mutate({
                      token,
                      submissionId: deleteConfirmation.submissionId,
                    });
                  }
                }}
                isLoading={deleteSubmissionMutation.isPending}
                className="flex-1"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
