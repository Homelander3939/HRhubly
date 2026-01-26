import { useState, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";
import { Download, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import { TestSubmissionReview } from "~/components/TestSubmissionReview";
import { CommentReviewModal } from "~/components/CommentReviewModal";
import toast from "react-hot-toast";

interface CandidateManagementProps {
  token: string;
}

export function CandidateManagement({ token }: CandidateManagementProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [vacancyFilter, setVacancyFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showTestAssignment, setShowTestAssignment] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showSubmissionReview, setShowSubmissionReview] = useState(false);
  const [sortField, setSortField] = useState<'firstName' | 'lastName' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [candidatesPerPage, setCandidatesPerPage] = useState(20);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    submissionCount: number;
  } | null>(null);
  const [selectedCommentCandidate, setSelectedCommentCandidate] = useState<{
    id: string;
    name: string;
    userComment: string | null;
    hrComment: string | null;
  } | null>(null);

  // Add connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'refreshing'>('connected');

  const trpc = useTRPC();

  // Fetch candidates with optimized polling for real-time updates
  const { data: candidatesData, isLoading, refetch, error, isError } = useQuery(
    trpc.getAllCandidates.queryOptions({
      token,
      status: statusFilter as any || undefined,
      vacancyId: vacancyFilter || undefined,
      search: searchTerm || undefined,
      page: currentPage,
      limit: candidatesPerPage,
      sortField,
      sortOrder,
    }, {
      refetchInterval: 8000, // Reduced from 15000ms to 8000ms (8 seconds) for more responsive updates
      refetchIntervalInBackground: true, // Keep polling when window is not focused
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error.message.includes('Invalid or expired token')) {
          return false;
        }
        return failureCount < 3; // Increased retry attempts
      },
      // Add stale time to prevent unnecessary refetches
      staleTime: 3000, // 3 seconds
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
      toast.success('Candidate data refreshed!', {
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

  // Fetch tests for assignment
  const { data: tests, error: testsError } = useQuery(
    trpc.getAllTests.queryOptions({ token }, {
      retry: (failureCount, error) => {
        if (error.message.includes('Invalid or expired token')) {
          return false;
        }
        return failureCount < 2;
      },
    })
  );

  // Fetch vacancies for filter dropdown
  const { data: vacancies } = useQuery(
    trpc.getAllVacancies.queryOptions({ token }, {
      retry: (failureCount, error) => {
        if (error.message.includes('Invalid or expired token')) {
          return false;
        }
        return failureCount < 2;
      },
    })
  );

  // Update candidate status mutation - improved
  const updateStatusMutation = useMutation(
    trpc.updateCandidateStatus.mutationOptions({
      onSuccess: () => {
        refetch();
        toast.success('Candidate status updated successfully!');
      },
      onError: (error) => {
        console.error('Status update error:', error);
        if (error.message.includes('Invalid or expired token')) {
          localStorage.removeItem('admin-token');
          window.location.reload();
        } else {
          toast.error(`Failed to update status: ${error.message}`);
        }
      },
    })
  );

  // Assign test mutation - improved
  const assignTestMutation = useMutation(
    trpc.assignTestToCandidate.mutationOptions({
      onSuccess: (data) => {
        refetch();
        setShowTestAssignment(false);
        setSelectedCandidate(null);
        toast.success('Test assigned successfully!');
      },
      onError: (error) => {
        console.error('Test assignment error:', error);
        if (error.message.includes('Invalid or expired token')) {
          localStorage.removeItem('admin-token');
          window.location.reload();
        } else {
          toast.error(`Failed to assign test: ${error.message}`);
        }
      },
    })
  );

  // Delete candidate mutation
  const deleteCandidateMutation = useMutation(
    trpc.deleteCandidate.mutationOptions({
      onSuccess: (data) => {
        refetch();
        setDeleteConfirmation(null);
        toast.success(data.message);
      },
      onError: (error) => {
        console.error('Delete candidate error:', error);
        if (error.message.includes('Invalid or expired token')) {
          localStorage.removeItem('admin-token');
          window.location.reload();
        } else {
          toast.error(`Failed to delete candidate: ${error.message}`);
        }
      },
    })
  );

  const downloadCV = async (cvUrl: string, candidateName: string) => {
    try {
      const response = await fetch(cvUrl);
      if (!response.ok) throw new Error('Failed to download CV');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidateName.replace(/\s+/g, '_')}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(cvUrl, '_blank');
    }
  };

  const handleStatusUpdate = (candidateId: string, newStatus: string) => {
    updateStatusMutation.mutate({
      token,
      candidateId,
      status: newStatus as any,
    });
  };

  const handleTestAssignment = (testId: string) => {
    if (selectedCandidate) {
      assignTestMutation.mutate({
        token,
        candidateId: selectedCandidate,
        testId,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUBMITTED: { 
        bg: "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30", 
        text: "text-blue-800 dark:text-blue-400", 
        label: "Submitted",
        ring: "ring-2 ring-blue-200 dark:ring-blue-800/50 ring-opacity-50"
      },
      UNDER_REVIEW: { 
        bg: "bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30", 
        text: "text-yellow-800 dark:text-yellow-400", 
        label: "Under Review",
        ring: "ring-2 ring-yellow-200 dark:ring-yellow-800/50 ring-opacity-50"
      },
      APPROVED: { 
        bg: "bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30", 
        text: "text-green-800 dark:text-green-400", 
        label: "Approved",
        ring: "ring-2 ring-green-200 dark:ring-green-800/50 ring-opacity-50"
      },
      REJECTED: { 
        bg: "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30", 
        text: "text-red-800 dark:text-red-400", 
        label: "Rejected",
        ring: "ring-2 ring-red-200 dark:ring-red-800/50 ring-opacity-50"
      },
      TEST_ASSIGNED: { 
        bg: "bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30", 
        text: "text-purple-800 dark:text-purple-400", 
        label: "Test Assigned",
        ring: "ring-2 ring-purple-200 dark:ring-purple-800/50 ring-opacity-50"
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SUBMITTED;
    
    return (
      <span className={cn(
        "inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105",
        config.bg, 
        config.text,
        config.ring
      )}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading candidates...</p>
      </div>
    );
  }

  if (error && error.message.includes('Invalid or expired token')) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Authentication Error</h3>
        <p className="text-gray-600 dark:text-gray-400">Your session has expired. Please refresh the page to log in again.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header with filters */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
              <span className="hidden sm:inline">Candidate Management</span>
              <span className="sm:hidden">Candidates</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                ({candidatesData?.pagination.total || 0})
              </span>
            </h3>
            
            {/* Connection status and refresh button */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors duration-200",
                connectionStatus === 'connected' ? "bg-green-500 animate-pulse" :
                connectionStatus === 'refreshing' ? "bg-yellow-500" :
                "bg-red-500"
              )} />
              <button
                onClick={handleManualRefresh}
                disabled={connectionStatus === 'refreshing'}
                className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors duration-200 disabled:opacity-50"
                title="Refresh candidate data"
              >
                <RefreshCw className={cn(
                  "h-3 w-3 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200",
                  connectionStatus === 'refreshing' && "animate-spin"
                )} />
              </button>
              {connectionStatus === 'error' && (
                <span className="text-xs text-red-600 dark:text-red-400 hidden sm:inline">
                  Connection issues
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            
            {/* Sort by */}
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [typeof sortField, typeof sortOrder];
                setSortField(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="createdAt-desc">Latest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="firstName-asc">Name A-Z</option>
              <option value="firstName-desc">Name Z-A</option>
            </select>
            
            {/* Candidates per page */}
            <select
              value={candidatesPerPage}
              onChange={(e) => {
                setCandidatesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="TEST_ASSIGNED">Test Assigned</option>
            </select>

            {/* Vacancy filter */}
            <select
              value={vacancyFilter}
              onChange={(e) => {
                setVacancyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Vacancies</option>
              <option value="general">General Applications</option>
              {vacancies?.map((vacancy) => (
                <option key={vacancy.id} value={vacancy.id}>
                  {vacancy.title}
                </option>
              ))}
            </select>
            
            {/* Clear filters button */}
            {(searchTerm || statusFilter || vacancyFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setVacancyFilter("");
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                Candidate
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                Contact
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Application Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Experience
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Salary
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44">
                Test Results
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                CV
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Social Link
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-80">
                Comment / Motivation
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {candidatesData?.candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-blue-900/20 transition-all duration-200 hover:shadow-sm">
                <td className="px-3 py-2 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {candidate.firstName} {candidate.lastName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Applied: {new Date(candidate.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[140px]" title={candidate.email}>{candidate.email}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{candidate.phoneNumber}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {candidate.vacancy ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-700 shrink-0">
                        🎯 Specific Role
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[120px]" title={candidate.vacancy.title}>
                        {candidate.vacancy.title}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                      📝 General Application
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {candidate.yearsOfQualification} years
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {candidate.salary ? `$${candidate.salary}` : "N/A"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {getStatusBadge(candidate.applicationStatus)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {candidate.submissions && candidate.submissions.length > 0 ? (
                    <div className="space-y-1">
                      {candidate.submissions.slice(0, 2).map((submission) => (
                        <div key={submission.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[60px]" title={submission.testName}>{submission.testName}:</span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full shrink-0",
                            submission.finalResult === "PASS" 
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                              : submission.finalResult === "FAIL"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                          )}>
                            {submission.finalResult || "Pending"}
                          </span>
                          {submission.finalPercentScore && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                              ({submission.finalPercentScore}%)
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission.id);
                              setShowSubmissionReview(true);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline shrink-0"
                          >
                            View
                          </button>
                        </div>
                      ))}
                      {candidate.submissions.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{candidate.submissions.length - 2} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No tests</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {candidate.cvUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={candidate.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 text-sm"
                      >
                        View CV
                      </a>
                      <button
                        onClick={() => downloadCV(candidate.cvUrl!, `${candidate.firstName}_${candidate.lastName}`)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-200 group"
                        title="Download CV"
                      >
                        <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No CV</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {candidate.socialLink ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={candidate.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 group flex items-center gap-1 text-sm"
                        title={candidate.socialLink}
                      >
                        View Profile
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No link</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {(candidate.comment || candidate.hrComment) ? (
                    <div className="space-y-1">
                      {/* User Comment */}
                      {candidate.comment && (
                        <div className="group relative">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 shrink-0 w-10">
                              User:
                            </span>
                            <p className="text-xs text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                              {candidate.comment}
                            </p>
                          </div>
                          {/* Hover tooltip */}
                          {candidate.comment.length > 100 && (
                            <div className="absolute left-0 top-full mt-2 max-w-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                {candidate.comment}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* HR Comment */}
                      {candidate.hrComment && (
                        <div className="group relative">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0 w-10">
                              HR:
                            </span>
                            <p className="text-xs text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                              {candidate.hrComment}
                            </p>
                          </div>
                          {/* Hover tooltip */}
                          {candidate.hrComment.length > 100 && (
                            <div className="absolute left-0 top-full mt-2 max-w-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-72 overflow-y-auto">
                                {candidate.hrComment}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* View/Edit button */}
                      <button
                        onClick={() => {
                          setSelectedCommentCandidate({
                            id: candidate.id,
                            name: `${candidate.firstName} ${candidate.lastName}`,
                            userComment: candidate.comment,
                            hrComment: candidate.hrComment,
                          });
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
                      >
                        {candidate.hrComment ? "View / Edit" : "Add HR Comment"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCommentCandidate({
                          id: candidate.id,
                          name: `${candidate.firstName} ${candidate.lastName}`,
                          userComment: null,
                          hrComment: null,
                        });
                      }}
                      className="text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      Add HR Comment
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                  <div className="flex items-center gap-2">
                    {/* Status update dropdown */}
                    <select
                      value={candidate.applicationStatus}
                      onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={updateStatusMutation.isPending}
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="TEST_ASSIGNED">Test Assigned</option>
                    </select>
                    
                    {/* Assign test button */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedCandidate(candidate.id);
                        setShowTestAssignment(true);
                      }}
                      disabled={assignTestMutation.isPending}
                      className="text-xs px-2 py-1"
                    >
                      Assign Test
                    </Button>

                    {/* Delete button */}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setDeleteConfirmation({
                          candidateId: candidate.id,
                          candidateName: `${candidate.firstName} ${candidate.lastName}`,
                          candidateEmail: candidate.email,
                          submissionCount: candidate.submissions?.length || 0,
                        });
                      }}
                      disabled={deleteCandidateMutation.isPending}
                      className="text-xs px-2 py-1"
                      title="Delete candidate permanently"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="lg:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {candidatesData?.candidates.map((candidate) => (
            <div key={candidate.id} className="p-4 sm:p-6 bg-white dark:bg-gray-800">
              <div className="space-y-4">
                {/* Header with name and status */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {candidate.firstName} {candidate.lastName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Applied: {new Date(candidate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(candidate.applicationStatus)}
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">Email:</span>
                    <a href={`mailto:${candidate.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">
                      {candidate.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">Phone:</span>
                    <a href={`tel:${candidate.phoneNumber}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {candidate.phoneNumber}
                    </a>
                  </div>
                </div>

                {/* Application Type */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Application Type:</span>
                  {candidate.vacancy ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-700">
                        🎯 Specific Role
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {candidate.vacancy.title}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                      📝 General Application
                    </span>
                  )}
                </div>

                {/* Experience and Salary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{candidate.yearsOfQualification} years</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Salary:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{candidate.salary ? `$${candidate.salary}` : "N/A"}</p>
                  </div>
                </div>

                {/* Test Results */}
                {candidate.submissions && candidate.submissions.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Results:</span>
                    <div className="mt-2 space-y-2">
                      {candidate.submissions.slice(0, 2).map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{submission.testName}</span>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              submission.finalResult === "PASS" 
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                : submission.finalResult === "FAIL"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                            )}>
                              {submission.finalResult || "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.finalPercentScore && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {submission.finalPercentScore}%
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setSelectedSubmission(submission.id);
                                setShowSubmissionReview(true);
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                      {candidate.submissions.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{candidate.submissions.length - 2} more tests
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CV and Social Links */}
                <div className="flex flex-wrap gap-4">
                  {candidate.cvUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={candidate.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                      >
                        View CV
                      </a>
                      <button
                        onClick={() => downloadCV(candidate.cvUrl!, `${candidate.firstName}_${candidate.lastName}`)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-200"
                        title="Download CV"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {candidate.socialLink && (
                    <a
                      href={candidate.socialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline flex items-center gap-1"
                    >
                      View Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Comment / Motivation Letter - moved after CV and Social Links */}
                {(candidate.comment || candidate.hrComment) && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Comment / Motivation:</span>
                    <div className="mt-2 space-y-2">
                      {candidate.comment && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">User Comment:</p>
                          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap line-clamp-4">
                            {candidate.comment}
                          </p>
                        </div>
                      )}
                      {candidate.hrComment && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">HR Comment:</p>
                          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap line-clamp-4">
                            {candidate.hrComment}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCommentCandidate({
                            id: candidate.id,
                            name: `${candidate.firstName} ${candidate.lastName}`,
                            userComment: candidate.comment,
                            hrComment: candidate.hrComment,
                          });
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
                      >
                        View full comments / Add HR comment
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status:</label>
                    <select
                      value={candidate.applicationStatus}
                      onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={updateStatusMutation.isPending}
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="TEST_ASSIGNED">Test Assigned</option>
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Actions:</label>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedCandidate(candidate.id);
                        setShowTestAssignment(true);
                      }}
                      disabled={assignTestMutation.isPending}
                      className="w-full"
                    >
                      Assign Test
                    </Button>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danger Zone:</label>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setDeleteConfirmation({
                          candidateId: candidate.id,
                          candidateName: `${candidate.firstName} ${candidate.lastName}`,
                          candidateEmail: candidate.email,
                          submissionCount: candidate.submissions?.length || 0,
                        });
                      }}
                      disabled={deleteCandidateMutation.isPending}
                      className="w-full"
                    >
                      Delete Candidate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {candidatesData?.pagination && candidatesData.pagination.totalPages > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              Showing {((candidatesData.pagination.page - 1) * candidatesData.pagination.limit) + 1} to{" "}
              {Math.min(candidatesData.pagination.page * candidatesData.pagination.limit, candidatesData.pagination.total)} of{" "}
              {candidatesData.pagination.total} results
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                <span className="hidden sm:inline">Page {currentPage} of {candidatesData.pagination.totalPages}</span>
                <span className="sm:hidden">{currentPage}/{candidatesData.pagination.totalPages}</span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= candidatesData.pagination.totalPages}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Test Assignment Modal */}
      {showTestAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Test</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose a test to assign to the candidate</p>
              </div>
            </div>

            {testsError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error loading tests: {testsError.message}
                </p>
              </div>
            ) : !tests || tests.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No tests available. Please create a test first.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => handleTestAssignment(test.id)}
                    disabled={assignTestMutation.isPending}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                          {test.name}
                        </div>
                        {test.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {test.description}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{test.durationMinutes} min</span>
                          <span>{test.passThresholdPercent}% pass</span>
                          <span className={cn(
                            "px-2 py-1 rounded-full",
                            test.type === "INTERNAL" 
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" 
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          )}>
                            {test.type}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTestAssignment(false);
                  setSelectedCandidate(null);
                }}
                disabled={assignTestMutation.isPending}
              >
                Cancel
              </Button>
            </div>

            {assignTestMutation.isPending && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Assigning test...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Candidate Confirmation Modal */}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Candidate</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Are you sure you want to permanently delete <strong>{deleteConfirmation.candidateName}</strong>?
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
                  <li>• Email: {deleteConfirmation.candidateEmail}</li>
                  <li>• All personal information will be permanently deleted</li>
                  <li>• {deleteConfirmation.submissionCount} test submission{deleteConfirmation.submissionCount !== 1 ? 's' : ''} will be deleted</li>
                  <li>• All associated test answers will be deleted</li>
                  <li>• This email address can be reused after deletion</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1"
                disabled={deleteCandidateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (deleteConfirmation) {
                    deleteCandidateMutation.mutate({
                      token,
                      candidateId: deleteConfirmation.candidateId,
                    });
                  }
                }}
                isLoading={deleteCandidateMutation.isPending}
                className="flex-1"
              >
                Delete Permanently
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
          }}
        />
      )}

      {/* Comment Review Modal */}
      {selectedCommentCandidate && (
        <CommentReviewModal
          token={token}
          candidateId={selectedCommentCandidate.id}
          candidateName={selectedCommentCandidate.name}
          userComment={selectedCommentCandidate.userComment}
          hrComment={selectedCommentCandidate.hrComment}
          onClose={() => setSelectedCommentCandidate(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
