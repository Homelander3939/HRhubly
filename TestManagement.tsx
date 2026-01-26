import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";
import { Plus, Edit, Trash2, Eye, Users, Clock, Target, Sparkles, Minus, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface TestManagementProps {
  token: string;
}

const testSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  description: z.string().optional(),
  type: z.enum(["INTERNAL", "EXTERNAL"]),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  passThresholdPercent: z.number().min(0).max(100, "Pass threshold must be between 0 and 100"),
  showResultsToCandidate: z.boolean().default(false),
  questions: z.array(z.object({
    title: z.string().min(1, "Question title is required"),
    descriptionText: z.string().optional(),
    mediaUrl: z.string().optional(), // Add image URL field for questions
    type: z.enum(["SINGLE_CHOICE_TEXT", "MULTIPLE_CHOICE_TEXT", "SINGLE_CHOICE_IMAGE", "MULTIPLE_CHOICE_IMAGE", "OPEN_TEXT"]),
    maxScore: z.number().min(1, "Max score must be at least 1"),
    answers: z.array(z.object({
      answerText: z.string().min(1, "Answer text is required"),
      answerImageUrl: z.string().optional(), // Add image URL field for answers
      isCorrect: z.boolean().default(false),
    })).optional().default([]),
  })).default([]),
});

type TestForm = z.infer<typeof testSchema>;

function QuestionEditor({
  questionIndex,
  register,
  control,
  watch,
  setValue,
  errors,
  isExpanded,
  onToggleExpanded,
  onRemove,
  uploadingImages,
  onImageUpload,
}: {
  questionIndex: number;
  register: any;
  control: any;
  watch: any;
  setValue: any;
  errors: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onRemove: () => void;
  uploadingImages: Record<string, boolean>;
  onImageUpload: (file: File, questionIndex: number, type: 'question' | 'answer', answerIndex?: number) => void;
}) {
  const { fields: answerFields, append: appendAnswer, remove: removeAnswer } = useFieldArray({
    control,
    name: `questions.${questionIndex}.answers`,
  });

  const questionType = watch(`questions.${questionIndex}.type`);
  const isClosedType = ['SINGLE_CHOICE_TEXT', 'MULTIPLE_CHOICE_TEXT', 'SINGLE_CHOICE_IMAGE', 'MULTIPLE_CHOICE_IMAGE'].includes(questionType);

  // Add effect to handle question type changes
  useEffect(() => {
    const questionType = watch(`questions.${questionIndex}.type`);
    if (questionType === 'OPEN_TEXT') {
      // Clear answers for open text questions
      setValue(`questions.${questionIndex}.answers`, []);
    } else {
      // Ensure closed questions have at least 2 answers
      const currentAnswers = watch(`questions.${questionIndex}.answers`) || [];
      if (currentAnswers.length < 2) {
        setValue(`questions.${questionIndex}.answers`, [
          { answerText: "", isCorrect: true },
          { answerText: "", isCorrect: false },
        ]);
      }
    }
  }, [watch(`questions.${questionIndex}.type`), setValue, questionIndex, watch]);

  const addAnswer = () => {
    if (answerFields.length < 6) {
      appendAnswer({ answerText: "", isCorrect: false });
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Question {questionIndex + 1}</span>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Question Title *
            </label>
            <input
              {...register(`questions.${questionIndex}.title`)}
              type="text"
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter question title"
            />
            {errors.questions?.[questionIndex]?.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.questions[questionIndex].title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Description
            </label>
            <textarea
              {...register(`questions.${questionIndex}.descriptionText`)}
              rows={2}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Additional question details (optional)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Question Type *
              </label>
              <select
                {...register(`questions.${questionIndex}.type`)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="SINGLE_CHOICE_TEXT">Single Choice (Text)</option>
                <option value="MULTIPLE_CHOICE_TEXT">Multiple Choice (Text)</option>
                <option value="SINGLE_CHOICE_IMAGE">Single Choice (Image)</option>
                <option value="MULTIPLE_CHOICE_IMAGE">Multiple Choice (Image)</option>
                <option value="OPEN_TEXT">Open Text</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Max Score *
              </label>
              <input
                {...register(`questions.${questionIndex}.maxScore`, { valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="1"
              />
              {errors.questions?.[questionIndex]?.maxScore && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.questions[questionIndex].maxScore.message}</p>
              )}
            </div>
          </div>

          {/* Image Upload for Question */}
          {(questionType === 'SINGLE_CHOICE_IMAGE' || questionType === 'MULTIPLE_CHOICE_IMAGE') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Question Image
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImageUpload(file, questionIndex, 'question');
                    }
                  }}
                  className="block w-full text-xs sm:text-sm text-gray-500 dark:text-gray-400 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                />
                {uploadingImages[`${questionIndex}-question-0`] && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload an image for this question (JPG, PNG, GIF)</p>
              
              {/* Show uploaded question image preview */}
              {watch(`questions.${questionIndex}.mediaUrl`) && (
                <div className="mt-2">
                  <img
                    src={watch(`questions.${questionIndex}.mediaUrl`)}
                    alt="Question image preview"
                    className="max-w-full sm:max-w-xs h-auto rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Answers Section for Closed Questions */}
          {isClosedType && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Answers ({answerFields.length})
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addAnswer}
                  disabled={answerFields.length >= 6}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Answer
                </Button>
              </div>

              {answerFields.map((answerField, answerIndex) => (
                <div key={answerField.id} className="space-y-2 sm:space-y-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/30 rounded-md">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                    {questionType.includes('MULTIPLE') ? (
                      <input
                        {...register(`questions.${questionIndex}.answers.${answerIndex}.isCorrect`)}
                        type="checkbox"
                        className="h-4 w-4 mt-0.5 sm:mt-0 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded flex-shrink-0"
                      />
                    ) : (
                      <input
                        type="radio"
                        name={`question_${questionIndex}_correct`}
                        checked={watch(`questions.${questionIndex}.answers.${answerIndex}.isCorrect`)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // For single choice, uncheck all other answers and check this one
                            const currentAnswers = watch(`questions.${questionIndex}.answers`) || [];
                            currentAnswers.forEach((_, idx) => {
                              setValue(`questions.${questionIndex}.answers.${idx}.isCorrect`, idx === answerIndex);
                            });
                          }
                        }}
                        className="h-4 w-4 mt-0.5 sm:mt-0 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 flex-shrink-0"
                      />
                    )}
                    <input
                      {...register(`questions.${questionIndex}.answers.${answerIndex}.answerText`)}
                      type="text"
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={`Answer ${answerIndex + 1}`}
                    />
                    {answerFields.length > 2 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeAnswer(answerIndex)}
                        className="flex-shrink-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Image Upload for Answer Images (for image-based questions) */}
                  {(questionType === 'SINGLE_CHOICE_IMAGE' || questionType === 'MULTIPLE_CHOICE_IMAGE') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                        Answer {answerIndex + 1} Image
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onImageUpload(file, questionIndex, 'answer', answerIndex);
                            }
                          }}
                          className="block w-full text-xs sm:text-sm text-gray-500 dark:text-gray-400 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                        />
                        {uploadingImages[`${questionIndex}-answer-${answerIndex}`] && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0"></div>
                        )}
                      </div>
                      {/* Show uploaded image preview */}
                      {watch(`questions.${questionIndex}.answers.${answerIndex}.answerImageUrl`) && (
                        <div className="mt-2">
                          <img
                            src={watch(`questions.${questionIndex}.answers.${answerIndex}.answerImageUrl`)}
                            alt={`Answer ${answerIndex + 1} preview`}
                            className="max-w-full sm:max-w-xs h-auto rounded border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {answerFields.length < 2 && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">At least 2 answers are required for closed questions.</p>
              )}
            </div>
          )}

          {/* Open Text Note */}
          {questionType === 'OPEN_TEXT' && (
            <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                This is an open text question. Candidates will provide written answers that require manual scoring by HR.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TestManagement({ token }: TestManagementProps) {
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [createdTestLink, setCreatedTestLink] = useState<string | null>(null);
  const [showTestLinkModal, setShowTestLinkModal] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [editingTest, setEditingTest] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    testId: string;
    testName: string;
    submissionCount: number;
  } | null>(null);

  const trpc = useTRPC();

  // Fetch tests
  const { data: tests, isLoading, refetch, error } = useQuery(
    trpc.getAllTests.queryOptions({ token }, {
      retry: (failureCount, error) => {
        if (error.message.includes('Invalid or expired token')) {
          return false;
        }
        return failureCount < 2;
      },
    })
  );

  // Get test for editing
  const { data: editTestData } = useQuery(
    editingTest ? trpc.getTestById.queryOptions({ token, testId: editingTest }) : { enabled: false }
  );

  // Get test for viewing (with questions and answers)
  const { data: viewTestData } = useQuery(
    selectedTest ? trpc.getTestById.queryOptions({ token, testId: selectedTest }) : { enabled: false }
  );

  // Merge view test data into tests array when viewing
  const testsWithViewData = tests?.map(test => {
    if (test.id === selectedTest && viewTestData) {
      return {
        ...test,
        questions: viewTestData.questions,
      };
    }
    return test;
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue, // Add setValue for programmatically setting form values
    formState: { errors },
  } = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "INTERNAL",
      durationMinutes: 60,
      passThresholdPercent: 70,
      showResultsToCandidate: false,
      questions: [],
    },
  });

  const resetForm = () => {
    reset({
      name: "",
      description: "",
      type: "INTERNAL",
      durationMinutes: 60,
      passThresholdPercent: 70,
      showResultsToCandidate: false,
      questions: [],
    });
    setExpandedQuestions([]);
  };

  // Create test mutation
  const createTestMutation = useMutation(
    trpc.createTest.mutationOptions({
      onSuccess: (data) => {
        console.log("Create test mutation successful");
        toast.success("Test created successfully!");
        refetch();
        setShowCreateTest(false);
        resetForm();
        
        // Generate test link and show modal
        const testLink = `${window.location.origin}/test/${data.test.id}`;
        setCreatedTestLink(testLink);
        setShowTestLinkModal(true);
      },
      onError: (error) => {
        console.error("Create test mutation error:", error);
        toast.error(`Failed to create test: ${error.message}`);
        if (error.message.includes('Invalid or expired token')) {
          // Handle authentication error
          localStorage.removeItem('admin-token');
          window.location.reload();
        }
      },
    })
  );

  // Edit test mutation
  const editTestMutation = useMutation(
    trpc.updateTest.mutationOptions({
      onSuccess: () => {
        console.log("Edit test mutation successful");
        toast.success("Test updated successfully!");
        refetch();
        setShowCreateTest(false);
        setEditingTest(null);
        resetForm();
      },
      onError: (error) => {
        console.error("Edit test mutation error:", error);
        
        // Handle specific error about existing submissions
        if (error.message.includes('Cannot modify test with existing submissions')) {
          const match = error.message.match(/(\d+) submission/);
          const submissionCount = match ? match[1] : 'some';
          
          toast.error(
            `Cannot edit test with existing submissions (${submissionCount} submissions found). ` +
            `Please archive this test and create a new one to make changes.`,
            { duration: 6000 }
          );
          
          // Close the modal since editing is not possible
          setShowCreateTest(false);
          setEditingTest(null);
          resetForm();
        } else if (error.message.includes('Invalid or expired token')) {
          // Handle authentication error
          localStorage.removeItem('admin-token');
          window.location.reload();
        } else {
          toast.error(`Failed to update test: ${error.message}`);
        }
      },
    })
  );

  // Archive test mutation
  const archiveTestMutation = useMutation(
    trpc.archiveTest.mutationOptions({
      onSuccess: () => {
        refetch();
        setDeleteConfirmation(null);
        toast.success('Test archived successfully!');
      },
      onError: (error) => {
        if (error.message.includes('Invalid or expired token')) {
          localStorage.removeItem('admin-token');
          window.location.reload();
        } else {
          toast.error(`Error archiving test: ${error.message}`);
        }
      },
    })
  );

  // Delete test mutation - improved
  const deleteTestMutation = useMutation(
    trpc.deleteTest.mutationOptions({
      onSuccess: (data) => {
        refetch();
        setDeleteConfirmation(null);
        toast.success(data.message);
      },
      onError: (error) => {
        if (error.message.includes('Invalid or expired token')) {
          localStorage.removeItem('admin-token');
          window.location.reload();
        } else {
          // Don't show alert, let the UI handle it
          console.error('Delete test error:', error.message);
        }
      },
    })
  );

  // Image upload mutation
  const uploadImageMutation = useMutation(
    trpc.getPresignedUploadUrl.mutationOptions({
      onError: (error) => {
        console.error('Failed to get upload URL:', error);
      },
    })
  );

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "questions",
  });

  const watchedQuestions = watch("questions");

  const handleEditTest = (testId: string) => {
    const test = tests?.find(t => t.id === testId);
    if (!test) return;
    
    // Check if test has submissions - if so, show warning instead of opening edit modal
    if (test.submissionCount > 0) {
      const shouldProceed = confirm(
        `This test has ${test.submissionCount} submission${test.submissionCount !== 1 ? 's' : ''} and cannot be edited to maintain data integrity.\n\n` +
        `Would you like to:\n` +
        `• Click "OK" to archive this test and create a new one based on it\n` +
        `• Click "Cancel" to keep the test as-is\n\n` +
        `Note: Archived tests preserve all existing submission data.`
      );
      
      if (shouldProceed) {
        // Archive the existing test and create a new one based on it
        handleArchiveAndDuplicate(testId);
      }
      return;
    }
    
    // If no submissions, proceed with normal edit
    setEditingTest(testId);
    setShowCreateTest(true);
  };

  const handleArchiveAndDuplicate = async (testId: string) => {
    try {
      // First archive the existing test
      await archiveTestMutation.mutateAsync({ token, testId });
      
      // Set editing state to trigger the query for this test
      setEditingTest(testId);
      
      toast.success(`Test archived successfully! Loading test data for duplication...`);
    } catch (error) {
      console.error('Failed to archive test:', error);
      toast.error(`Failed to archive test: ${error.message}`);
    }
  };

  const handleDeleteTest = (testId: string, forceDelete: boolean = false) => {
    deleteTestMutation.mutate({ token, testId, forceDelete });
  };

  const handleArchiveTest = (testId: string) => {
    archiveTestMutation.mutate({ token, testId });
  };

  const copyTestLink = (testId: string) => {
    const testLink = `${window.location.origin}/test/${testId}`;
    navigator.clipboard.writeText(testLink);
    alert('Test link copied to clipboard!');
  };

  const addQuestion = () => {
    const newQuestion = {
      title: "",
      descriptionText: "",
      type: "SINGLE_CHOICE_TEXT" as const,
      maxScore: 1,
      answers: [
        { answerText: "", isCorrect: true },
        { answerText: "", isCorrect: false },
      ],
    };
    
    appendQuestion(newQuestion);
    setExpandedQuestions(prev => [...prev, questionFields.length]);
  };

  const toggleQuestionExpanded = (questionIndex: number) => {
    setExpandedQuestions(prev => 
      prev.includes(questionIndex) 
        ? prev.filter(i => i !== questionIndex)
        : [...prev, questionIndex]
    );
  };

  const handleImageUpload = async (file: File, questionIndex: number, type: 'question' | 'answer', answerIndex?: number) => {
    const uploadKey = `${questionIndex}-${type}-${answerIndex || 0}`;
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      // Generate unique filename using crypto.randomUUID() to avoid collisions
      const uniqueId = crypto.randomUUID();
      const extension = file.name.split('.').pop();
      const objectName = `test-images/${uniqueId}.${extension}`;
      
      // Get presigned URL using tRPC
      const uploadUrlData = await uploadImageMutation.mutateAsync({
        token,
        objectName,
        contentType: file.type,
      });
      
      // Upload file to MinIO
      const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!uploadResponse.ok) throw new Error('Failed to upload image');
      
      // Update form with image URL
      if (type === 'question') {
        // Set the mediaUrl for the question
        setValue(`questions.${questionIndex}.mediaUrl`, uploadUrlData.publicUrl);
      } else if (type === 'answer' && answerIndex !== undefined) {
        // Set the answerImageUrl for the specific answer
        setValue(`questions.${questionIndex}.answers.${answerIndex}.answerImageUrl`, uploadUrlData.publicUrl);
      }
      
      console.log(`${type} image uploaded successfully:`, uploadUrlData.publicUrl);
      
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const onSubmit = (data: TestForm) => {
    console.log("Form submitted with data:", data);
    
    // Validate that we have at least one question
    if (!data.questions || data.questions.length === 0) {
      toast.error("Please add at least one question to the test.");
      return;
    }

    // Validate each question
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];
      
      // Check if question has required fields
      if (!question.title.trim()) {
        toast.error(`Question ${i + 1}: Title is required.`);
        return;
      }

      // For closed questions, ensure we have at least 2 answers and at least one correct answer
      const isClosedQuestion = ['SINGLE_CHOICE_TEXT', 'MULTIPLE_CHOICE_TEXT', 'SINGLE_CHOICE_IMAGE', 'MULTIPLE_CHOICE_IMAGE'].includes(question.type);
      
      if (isClosedQuestion) {
        if (!question.answers || question.answers.length < 2) {
          toast.error(`Question ${i + 1}: Closed questions must have at least 2 answers.`);
          return;
        }

        const hasCorrectAnswer = question.answers.some(answer => answer.isCorrect);
        if (!hasCorrectAnswer) {
          toast.error(`Question ${i + 1}: At least one answer must be marked as correct.`);
          return;
        }

        // Validate that all answers have text
        for (let j = 0; j < question.answers.length; j++) {
          if (!question.answers[j].answerText.trim()) {
            toast.error(`Question ${i + 1}, Answer ${j + 1}: Answer text is required.`);
            return;
          }
        }
      }
    }

    // Clean up data for OPEN_TEXT questions - ensure they have empty answers array
    const cleanedData = {
      ...data,
      questions: data.questions.map(question => {
        if (question.type === 'OPEN_TEXT') {
          return {
            ...question,
            answers: [], // Explicitly set empty answers array for OPEN_TEXT questions
          };
        }
        return question;
      }),
    };

    console.log("Cleaned test data:", cleanedData);

    try {
      if (editingTest) {
        console.log("Calling editTestMutation with testId:", editingTest);
        editTestMutation.mutate({
          token,
          testId: editingTest,
          ...cleanedData,
        });
      } else {
        console.log("Calling createTestMutation");
        createTestMutation.mutate({
          token,
          ...cleanedData,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while submitting the form. Please try again.");
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (editTestData && editingTest) {
      reset({
        name: editTestData.name,
        description: editTestData.description || "",
        type: editTestData.type,
        durationMinutes: editTestData.durationMinutes,
        passThresholdPercent: typeof editTestData.passThresholdPercent === 'number' 
          ? editTestData.passThresholdPercent 
          : editTestData.passThresholdPercent?.toNumber?.() || 70,
        showResultsToCandidate: editTestData.showResultsToCandidate,
        questions: editTestData.questions.map((question) => ({
          title: question.title,
          descriptionText: question.descriptionText || "",
          mediaUrl: question.mediaUrl || "",
          type: question.type,
          maxScore: question.maxScore,
          answers: question.answers.map((answer) => ({
            answerText: answer.answerText || "",
            answerImageUrl: answer.answerImageUrl || "",
            isCorrect: answer.isCorrect,
          })),
        })),
      });
      setExpandedQuestions(editTestData.questions.map((_, index) => index));
    }
  }, [editTestData, editingTest, reset]);

  // Handle duplication after test data is loaded for archiving scenario
  useEffect(() => {
    if (editTestData && editingTest && !showCreateTest) {
      // This means we just loaded test data for duplication (archive scenario)
      // Check if this test was just archived by looking for [ARCHIVED] in the name
      const testInList = tests?.find(t => t.id === editingTest);
      const wasJustArchived = testInList?.name.startsWith('[ARCHIVED]');
      
      if (wasJustArchived) {
        // Create new test with same data but new name
        const duplicatedTest = {
          name: `${editTestData.name.replace('[ARCHIVED] ', '')} (Copy)`,
          description: editTestData.description?.replace('[ARCHIVED] ', '') || "",
          type: editTestData.type,
          durationMinutes: editTestData.durationMinutes,
          passThresholdPercent: typeof editTestData.passThresholdPercent === 'number' 
            ? editTestData.passThresholdPercent 
            : editTestData.passThresholdPercent?.toNumber?.() || 70,
          showResultsToCandidate: editTestData.showResultsToCandidate,
          questions: editTestData.questions.map((question) => ({
            title: question.title,
            descriptionText: question.descriptionText || "",
            mediaUrl: question.mediaUrl || "",
            type: question.type,
            maxScore: question.maxScore,
            answers: question.answers.map((answer) => ({
              answerText: answer.answerText || "",
              answerImageUrl: answer.answerImageUrl || "",
              isCorrect: answer.isCorrect,
            })),
          })),
        };
        
        // Populate form with duplicated data and open create modal
        reset(duplicatedTest);
        setExpandedQuestions(duplicatedTest.questions.map((_, index) => index));
        setShowCreateTest(true);
        setEditingTest(null); // Clear editing state since we're creating new
        
        toast.success(`New editable copy created based on archived test!`);
      }
    }
  }, [editTestData, editingTest, showCreateTest, tests, reset]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tests...</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 animate-pulse" />
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Test Management</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Create and manage assessment tests for candidates</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateTest(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {tests?.map((test) => (
          <div
            key={test.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 overflow-hidden border hover:border-blue-200 dark:hover:border-blue-700 group"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                    {test.name}
                  </h4>
                  {test.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0",
                  test.type === "INTERNAL" 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" 
                    : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                )}>
                  {test.type}
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{test.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Target className="h-4 w-4 flex-shrink-0" />
                  <span>{test.passThresholdPercent}% pass threshold</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>{test.submissionCount} submissions</span>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedTest(test.id)}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyTestLink(test.id)}
                  className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 text-xs"
                  title="Copy test link"
                >
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Copy Link</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
                {test.submissionCount > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditTest(test.id)}
                    className="hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
                    title={`This test has ${test.submissionCount} submission${test.submissionCount !== 1 ? 's' : ''}. Clicking Edit will archive this test and create a new editable copy.`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditTest(test.id)}
                    className="hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors duration-200"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setDeleteConfirmation({
                      testId: test.id,
                      testName: test.name,
                      submissionCount: test.submissionCount
                    });
                  }}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tests && tests.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Created</h3>
          <p className="text-gray-600 mb-6">Create your first assessment test to get started.</p>
          <Button
            onClick={() => setShowCreateTest(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Test
          </Button>
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                {editingTest ? 'Edit Test' : 'Create New Test'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                {editingTest 
                  ? 'Update the test configuration and questions'
                  : 'Set up a new assessment test with questions for candidates'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Basic Test Information */}
              <div className="space-y-4 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm sm:text-md font-medium text-gray-900 dark:text-gray-100">Test Information</h4>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Name *
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter test name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    id="description"
                    rows={3}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter test description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Type *
                    </label>
                    <select
                      {...register("type")}
                      id="type"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="INTERNAL">Internal</option>
                      <option value="EXTERNAL">External</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      {...register("durationMinutes", { valueAsNumber: true })}
                      type="number"
                      id="durationMinutes"
                      min="1"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="60"
                    />
                    {errors.durationMinutes && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.durationMinutes.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="passThresholdPercent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pass Threshold (%) *
                    </label>
                    <input
                      {...register("passThresholdPercent", { valueAsNumber: true })}
                      type="number"
                      id="passThresholdPercent"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="70"
                    />
                    {errors.passThresholdPercent && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.passThresholdPercent.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    {...register("showResultsToCandidate")}
                    type="checkbox"
                    id="showResultsToCandidate"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="showResultsToCandidate" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                    Show results to candidate after completion
                  </label>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <h4 className="text-sm sm:text-md font-medium text-gray-900 dark:text-gray-100">Questions ({questionFields.length})</h4>
                </div>

                {questionFields.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                    <Target className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">No questions added yet. Click "Add Question" to get started.</p>
                  </div>
                )}

                {questionFields.map((field, questionIndex) => (
                  <QuestionEditor
                    key={field.id}
                    questionIndex={questionIndex}
                    register={register}
                    control={control}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    isExpanded={expandedQuestions.includes(questionIndex)}
                    onToggleExpanded={() => toggleQuestionExpanded(questionIndex)}
                    onRemove={() => removeQuestion(questionIndex)}
                    uploadingImages={uploadingImages}
                    onImageUpload={handleImageUpload}
                  />
                ))}

                {/* Add Question Button - moved to bottom */}
                <div className="flex justify-center sm:justify-end pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addQuestion}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateTest(false);
                    setEditingTest(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={editingTest ? editTestMutation.isPending : createTestMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto"
                >
                  {editingTest ? 'Update Test' : 'Create Test'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Delete/Archive Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Test</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete "<strong>{deleteConfirmation.testName}</strong>"?
              </p>
              
              {deleteConfirmation.submissionCount > 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-medium text-yellow-800">
                      Warning: {deleteConfirmation.submissionCount} submission{deleteConfirmation.submissionCount !== 1 ? 's' : ''} exist
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    This test has {deleteConfirmation.submissionCount} candidate submission{deleteConfirmation.submissionCount !== 1 ? 's' : ''}. 
                    We recommend archiving instead of deleting to preserve data.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-700">
                    All associated questions, answers, and any future submissions will be permanently deleted.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              {deleteConfirmation.submissionCount > 0 && (
                <Button
                  onClick={() => handleArchiveTest(deleteConfirmation.testId)}
                  isLoading={archiveTestMutation.isPending}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Archive Test (Recommended)
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {deleteConfirmation.submissionCount > 0 ? (
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteTest(deleteConfirmation.testId, true)}
                    isLoading={deleteTestMutation.isPending}
                    className="flex-1"
                  >
                    Force Delete
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteTest(deleteConfirmation.testId, false)}
                    isLoading={deleteTestMutation.isPending}
                    className="flex-1"
                  >
                    Delete Test
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Link Modal */}
      {showTestLinkModal && createdTestLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Test Created Successfully!</h3>
              <p className="text-gray-600 mb-4">Share this link with candidates to take the test:</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={createdTestLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdTestLink);
                    alert('Test link copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setShowTestLinkModal(false);
                  setCreatedTestLink(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Test View Modal - Show Full Test Details */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 z-10">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Test Details</h3>
            </div>
            <div className="p-6">
              {(() => {
                const test = testsWithViewData?.find(t => t.id === selectedTest);
                if (!test) return <p>Test not found</p>;
                
                return (
                  <div className="space-y-6">
                    {/* Basic Test Information */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Name</label>
                        <p className="text-base text-gray-900 dark:text-gray-100 font-semibold">{test.name}</p>
                      </div>
                      {test.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{test.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              test.type === "INTERNAL" 
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" 
                                : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            )}>
                              {test.type}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{test.durationMinutes} min</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pass Threshold</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{test.passThresholdPercent}%</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Submissions</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{test.submissionCount}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Show Results to Candidate</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{test.showResultsToCandidate ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    {/* Test Link */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Link</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/test/${test.id}`}
                          readOnly
                          className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyTestLink(test.id)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    {/* Questions Section */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        Questions ({test.questions?.length || 0})
                      </h4>
                      
                      {(!test.questions || test.questions.length === 0) ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                          <p className="text-sm">No questions have been added to this test yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {test.questions.map((question, qIndex) => (
                            <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
                              {/* Question Header */}
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold">
                                      {qIndex + 1}
                                    </span>
                                    <h5 className="font-semibold text-gray-900 dark:text-gray-100">{question.title}</h5>
                                  </div>
                                  {question.descriptionText && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">{question.descriptionText}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">
                                    {question.type.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Max Score: {question.maxScore}
                                  </span>
                                </div>
                              </div>

                              {/* Question Image (if exists) */}
                              {question.mediaUrl && (
                                <div className="ml-8 mb-3">
                                  <img 
                                    src={question.mediaUrl} 
                                    alt="Question image" 
                                    className="max-w-md h-auto rounded border border-gray-300 dark:border-gray-600"
                                  />
                                </div>
                              )}

                              {/* Answers Section */}
                              {question.type !== 'OPEN_TEXT' && question.answers && question.answers.length > 0 && (
                                <div className="ml-8 mt-3 space-y-2">
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Answers ({question.answers.length})
                                  </label>
                                  {question.answers.map((answer, aIndex) => (
                                    <div 
                                      key={answer.id} 
                                      className={cn(
                                        "flex items-start gap-3 p-2 rounded border",
                                        answer.isCorrect 
                                          ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" 
                                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                      )}
                                    >
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {question.type.includes('MULTIPLE') ? (
                                          <input 
                                            type="checkbox" 
                                            checked={answer.isCorrect} 
                                            readOnly 
                                            className="h-4 w-4 text-green-600 rounded"
                                          />
                                        ) : (
                                          <input 
                                            type="radio" 
                                            checked={answer.isCorrect} 
                                            readOnly 
                                            className="h-4 w-4 text-green-600"
                                          />
                                        )}
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{String.fromCharCode(65 + aIndex)}</span>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{answer.answerText}</p>
                                        {answer.answerImageUrl && (
                                          <img 
                                            src={answer.answerImageUrl} 
                                            alt={`Answer ${aIndex + 1}`} 
                                            className="mt-2 max-w-xs h-auto rounded border border-gray-300 dark:border-gray-600"
                                          />
                                        )}
                                      </div>
                                      {answer.isCorrect && (
                                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Open Text Question Note */}
                              {question.type === 'OPEN_TEXT' && (
                                <div className="ml-8 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                                  <p className="text-xs text-blue-700 dark:text-blue-400">
                                    This is an open text question. Candidates will provide written answers that require manual scoring.
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button
                onClick={() => setSelectedTest(null)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
