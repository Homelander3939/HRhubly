import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";
import { CheckCircle, XCircle, Clock, User, FileText, Target, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface TestSubmissionReviewProps {
  token: string;
  submissionId: string;
  onClose: () => void;
}

const scoringSchema = z.object({
  scores: z.record(z.number().min(0)),
});

type ScoringForm = z.infer<typeof scoringSchema>;

export function TestSubmissionReview({ token, submissionId, onClose }: TestSubmissionReviewProps) {
  const [isScoring, setIsScoring] = useState(false);
  const trpc = useTRPC();

  // Fetch submission details
  const { data: submission, isLoading, refetch } = useQuery(
    trpc.getSubmissionDetails.queryOptions({ token, submissionId })
  );

  // Manual scoring mutation
  const updateScoresMutation = useMutation(
    trpc.updateManualScores.mutationOptions({
      onSuccess: () => {
        refetch();
        setIsScoring(false);
        toast.success('Scores updated successfully!', {
          icon: '🎯',
        });
      },
      onError: (error) => {
        toast.error(`Failed to update scores: ${error.message}`);
      },
    })
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScoringForm>({
    resolver: zodResolver(scoringSchema),
  });

  // Reset form when submission data loads
  useEffect(() => {
    if (submission?.submissionAnswers) {
      const scores = submission.submissionAnswers.reduce((acc, answer) => {
        if (answer.question.type === "OPEN_TEXT") {
          acc[answer.id] = answer.assignedScore;
        }
        return acc;
      }, {} as Record<string, number>);
      
      reset({ scores });
    }
  }, [submission, reset]);

  const onSubmitScores = (data: ScoringForm) => {
    updateScoresMutation.mutate({
      token,
      submissionId,
      scores: data.scores,
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      COMPLETED: { icon: CheckCircle, bg: "bg-gradient-to-r from-green-100 to-green-200", text: "text-green-800", label: "Completed", ring: "ring-2 ring-green-200 ring-opacity-50" },
      EVALUATED: { icon: CheckCircle, bg: "bg-gradient-to-r from-blue-100 to-blue-200", text: "text-blue-800", label: "Evaluated", ring: "ring-2 ring-blue-200 ring-opacity-50" },
      IN_PROGRESS: { icon: Clock, bg: "bg-gradient-to-r from-yellow-100 to-yellow-200", text: "text-yellow-800", label: "In Progress", ring: "ring-2 ring-yellow-200 ring-opacity-50" },
    };
    
    const statusConfig = config[status as keyof typeof config] || config.COMPLETED;
    const IconComponent = statusConfig.icon;
    
    return (
      <span className={cn(
        "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm",
        statusConfig.bg, 
        statusConfig.text,
        statusConfig.ring
      )}>
        <IconComponent className="h-4 w-4 mr-2" />
        {statusConfig.label}
      </span>
    );
  };

  const getResultBadge = (result: string | null, score: number | null, threshold: number) => {
    if (!result || score === null) return null;
    
    const isPassed = result === "PASS";
    return (
      <span className={cn(
        "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm",
        isPassed 
          ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 ring-2 ring-green-200 ring-opacity-50" 
          : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 ring-2 ring-red-200 ring-opacity-50"
      )}>
        {isPassed ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
        <span className="font-semibold">{result}</span>
        <span className="ml-2 bg-white bg-opacity-50 px-2 py-0.5 rounded-full text-xs">
          {score.toFixed(1)}% (Required: {threshold}%)
        </span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Submission Not Found</h3>
          <p className="text-gray-600 mb-4">The requested submission could not be loaded.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  // Add validation for submission data
  const hasValidData = submission.submissionAnswers && submission.submissionAnswers.length > 0;

  if (!hasValidData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Submission Data</h3>
          <p className="text-gray-600 mb-4">This submission does not contain any answer data to review.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        {/* Enhanced Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                Test Submission Review
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{submission.user.firstName} {submission.user.lastName}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{submission.test.name}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(submission.status)}
              {submission.finalResult && submission.finalPercentScore && (
                <div className="mt-2">
                  {getResultBadge(submission.finalResult, submission.finalPercentScore, submission.test.passThresholdPercent)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Test Details */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: "Started",
                value: submission.startTime ? new Date(submission.startTime).toLocaleString() : 'N/A',
                icon: Clock,
                color: "text-blue-500"
              },
              {
                label: "Completed",
                value: submission.endTime ? new Date(submission.endTime).toLocaleString() : 'N/A',
                icon: CheckCircle,
                color: "text-green-500"
              },
              {
                label: "Duration",
                value: submission.startTime && submission.endTime 
                  ? `${Math.round((new Date(submission.endTime).getTime() - new Date(submission.startTime).getTime()) / 60000)} min`
                  : 'N/A',
                icon: Clock,
                color: "text-purple-500"
              },
              {
                label: "Score",
                value: submission.finalRawScore !== null ? `${submission.finalRawScore}/${submission.totalPossibleScore}` : 'Pending',
                icon: Target,
                color: "text-orange-500"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm font-medium text-gray-600">{item.label}</span>
                </div>
                <div className="text-base font-semibold text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Questions and Answers */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Questions & Answers
              <span className="ml-2 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                {submission.submissionAnswers.length} questions
              </span>
            </h4>
            {!isScoring && (
              <Button
                onClick={() => setIsScoring(true)}
                variant="secondary"
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
              >
                <Target className="h-4 w-4" />
                Score Manually
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmitScores)}>
            <div className="space-y-6">
              {submission.submissionAnswers.map((answer, index) => (
                <div key={answer.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 animate-fade-in group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                          Question {index + 1}
                        </h5>
                      </div>
                      <p className="text-gray-800 mt-2 leading-relaxed">{answer.question.title}</p>
                      {answer.question.descriptionText && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed bg-gray-50 p-3 rounded-lg">
                          {answer.question.descriptionText}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="bg-gray-100 px-3 py-1 rounded-full">
                        <span className="text-sm text-gray-600">Max Score: </span>
                        <span className="font-semibold text-gray-900">{answer.question.maxScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Question Type Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full gap-1",
                      answer.question.type === "OPEN_TEXT" 
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    )}>
                      {answer.question.type === "OPEN_TEXT" ? (
                        <FileText className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {answer.question.type.replace('_', ' ')}
                    </span>
                    {answer.isReviewed && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Reviewed
                      </span>
                    )}
                  </div>

                  {/* Enhanced Answer Display */}
                  {answer.question.type === "OPEN_TEXT" ? (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg mb-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Candidate's Answer:</span>
                      </div>
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {answer.openTextAnswer || (
                          <span className="text-gray-400 italic">No answer provided</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Answer Options:</span>
                      </div>
                      {answer.question.answers.map((option) => (
                        <div key={option.id} className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm",
                          answer.selectedAnswerIds.includes(option.id) 
                            ? option.isCorrect 
                              ? "bg-green-50 border-2 border-green-300 shadow-sm" 
                              : "bg-red-50 border-2 border-red-300 shadow-sm"
                            : option.isCorrect
                              ? "bg-yellow-50 border-2 border-yellow-300 shadow-sm"
                              : "bg-gray-50 border border-gray-200"
                        )}>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                            answer.selectedAnswerIds.includes(option.id) 
                              ? "bg-blue-500 border-blue-500 shadow-sm" 
                              : "border-gray-300"
                          )}>
                            {answer.selectedAnswerIds.includes(option.id) && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-sm flex-1 leading-relaxed">{option.answerText}</span>
                          {option.isCorrect && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Correct</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enhanced Scoring Section */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Current Score:</span>
                        <span className={cn(
                          "font-semibold px-2 py-1 rounded-full text-sm",
                          answer.assignedScore > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        )}>
                          {answer.assignedScore}
                        </span>
                      </div>
                      {answer.question.type === "OPEN_TEXT" && isScoring && (
                        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200">
                          <label className="text-sm font-medium text-gray-700">Manual Score:</label>
                          <input
                            {...register(`scores.${answer.id}`, { valueAsNumber: true })}
                            type="number"
                            min="0"
                            max={answer.question.maxScore}
                            className="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          />
                          <span className="text-sm text-gray-500">/ {answer.question.maxScore}</span>
                        </div>
                      )}
                    </div>
                    {answer.question.type !== "OPEN_TEXT" && (
                      <span className={cn(
                        "text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1",
                        answer.assignedScore > 0 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {answer.assignedScore > 0 ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Incorrect
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              {isScoring ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsScoring(false)}
                    className="hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={updateScoresMutation.isPending}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Save className="h-4 w-4" />
                    {updateScoresMutation.isPending ? 'Saving...' : 'Save Scores'}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={onClose}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
                >
                  Close Review
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
