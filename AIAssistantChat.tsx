import { useState, useRef, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";
import { 
  MessageCircle, 
  X, 
  Send, 
  FileText, 
  Users, 
  ClipboardCheck,
  Sparkles,
  Minimize2,
  Maximize2,
  Paperclip,
  Upload,
  Image,
  File,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface AIAssistantChatProps {
  token: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIAssistantChat({ token }: AIAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. I can help you with:\n\n• Analyzing candidate CVs\n• Evaluating test submissions\n• Ranking candidates\n• Analyzing uploaded documents (PDFs, images)\n• Navigating the platform\n\n**Note:** AI requests are queued to ensure reliable service. You may experience a short wait during high demand.\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [requestCooldown, setRequestCooldown] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trpc = useTRPC();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Cooldown timer
  useEffect(() => {
    if (requestCooldown > 0) {
      const timer = setInterval(() => {
        setRequestCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [requestCooldown]);

  // Platform guidance mutation for general chat
  const guidanceMutation = useMutation(
    trpc.getPlatformGuidance.mutationOptions({
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.guidance,
            timestamp: new Date(),
          },
        ]);
      },
      onError: (error) => {
        console.error("AI chat error:", error);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        
        const errorMessage = error.message || "Unknown error occurred";
        
        // Check for specific error types
        let userFriendlyMessage = errorMessage;
        let suggestions = [
          "Try the direct query buttons below (List Candidates, List Tests, List Submissions)",
          "Use the quick action buttons for specific tasks",
          "Navigate to the relevant section in the admin panel",
        ];
        
        // Check if it's a "Not Found" or AI service error
        if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
          userFriendlyMessage = "AI service is currently unavailable";
          suggestions = [
            "✅ Use the direct query buttons below - they work without AI:",
            "   • 'List Candidates' - Get all candidate information",
            "   • 'List Tests' - View all tests and assessments", 
            "   • 'List Submissions' - See test results and scores",
            "These buttons query the database directly and always work!",
            "",
            "Or navigate to the admin panel sections:",
            "   • Candidates section for applicant details",
            "   • Test Management for test information",
            "   • Test Submissions for results",
          ];
        } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          userFriendlyMessage = "The request took too long to complete";
          suggestions = [
            "✅ Use the direct query buttons below for instant results",
            "Try asking a simpler question",
            "Check your internet connection",
            "The AI service might be experiencing high load - try again in a moment",
          ];
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userFriendlyMessage = "Unable to connect to the AI service";
          suggestions = [
            "✅ Use the direct query buttons below - they work without AI",
            "Check your internet connection",
            "Try refreshing the page",
            "Contact support if the issue persists",
          ];
        } else if (errorMessage.includes('token') || errorMessage.includes('auth')) {
          userFriendlyMessage = "Authentication error";
          suggestions = [
            "Try logging out and logging back in",
            "Your session may have expired",
            "Contact support if the issue persists",
          ];
        }
        
        toast.error(`AI Error: ${userFriendlyMessage}`);
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ **Error**: ${userFriendlyMessage}

**What you can try:**
${suggestions.map((s, i) => `${s.startsWith('✅') || s.startsWith('   ') || s === '' ? s : `${i + 1}. ${s}`}`).join('\n')}

**Technical Details**: ${errorMessage}`,
            timestamp: new Date(),
          },
        ]);
      },
    })
  );

  // File upload for AI analysis
  const generateUploadUrlMutation = useMutation(
    trpc.generateAiDocumentUploadUrl.mutationOptions()
  );

  const analyzeDocumentMutation = useMutation(
    trpc.analyzeUploadedDocument.mutationOptions({
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `**Document Analysis Complete**\n\n${data.analysis}\n\n📎 File: [View Document](${data.fileUrl})`,
            timestamp: new Date(),
          },
        ]);
        toast.success("Document analyzed successfully!");
      },
      onError: (error) => {
        toast.error(`Document analysis failed: ${error.message}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Failed to analyze document: ${error.message}\n\nPlease try again or contact support if the issue persists.`,
            timestamp: new Date(),
          },
        ]);
      },
    })
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("File type not supported. Please upload an image, PDF, or Word document.");
        return;
      }

      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploadingFile(true);
    setUploadProgress(0);

    try {
      // Add user message about uploading file
      const uploadMessage: Message = {
        role: "user",
        content: `📎 Uploading file for analysis: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, uploadMessage]);

      // Step 1: Get presigned URL
      const uploadUrlResponse = await generateUploadUrlMutation.mutateAsync({
        token,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      setUploadProgress(25);

      // Step 2: Upload file to MinIO
      const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadProgress(50);

      // Step 3: Request AI analysis
      await analyzeDocumentMutation.mutateAsync({
        token,
        fileUrl: uploadUrlResponse.fileUrl,
        fileType: selectedFile.type,
        analysisPrompt: input.trim() || undefined,
      });

      setUploadProgress(100);
      
      // Clear file and input after successful upload
      setSelectedFile(null);
      setInput("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Failed to upload and analyze file. Please try again.');
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    // If there's a file selected, upload and analyze it
    if (selectedFile) {
      await handleFileUpload();
      return;
    }

    if (!input.trim() || isStreaming) return;

    // Check cooldown
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    const minInterval = 3000; // 3 seconds minimum between requests

    if (timeSinceLastRequest < minInterval) {
      const remainingCooldown = Math.ceil((minInterval - timeSinceLastRequest) / 1000);
      setRequestCooldown(remainingCooldown);
      toast.error(`Please wait ${remainingCooldown} seconds before sending another request`, {
        icon: '⏱️',
      });
      return;
    }

    console.log("[AI Chat] Sending message:", input.trim());
    console.log("[AI Chat] Token present:", !!token);
    console.log("[AI Chat] Token length:", token?.length || 0);

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setLastRequestTime(Date.now());

    try {
      console.log("[AI Chat] Calling getPlatformGuidance mutation...");
      const startTime = Date.now();
      
      await guidanceMutation.mutateAsync({
        token,
        question: userMessage.content,
      });
      
      const endTime = Date.now();
      console.log(`[AI Chat] Mutation completed successfully in ${endTime - startTime}ms`);
    } catch (error: any) {
      console.error("[AI Chat] Mutation failed:", error);
      console.error("[AI Chat] Error details:", {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick action mutations
  const analyzeCvMutation = useMutation(
    trpc.analyzeCv.mutationOptions({
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `**CV Analysis for ${data.candidateName}**\n\n${data.analysis}\n\n[View CV](${data.cvUrl})`,
            timestamp: new Date(),
          },
        ]);
        toast.success("CV analysis complete!");
      },
      onError: (error) => {
        toast.error(`CV analysis failed: ${error.message}`);
      },
    })
  );

  const evaluateTestMutation = useMutation(
    trpc.evaluateTestSubmission.mutationOptions({
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `**Test Evaluation: ${data.testName}**\n\nCandidate: ${data.candidateName}\nCurrent Score: ${data.currentScore}%\n\n${data.evaluation}`,
            timestamp: new Date(),
          },
        ]);
        toast.success("Test evaluation complete!");
      },
      onError: (error) => {
        toast.error(`Test evaluation failed: ${error.message}`);
      },
    })
  );

  const rankCandidatesMutation = useMutation(
    trpc.rankCandidates.mutationOptions({
      onSuccess: (data) => {
        let content = `**Candidate Ranking** (${data.totalCandidates} candidates)\n\n`;
        
        if ('text' in data.ranking) {
          content += data.ranking.text;
        } else if ('rankedCandidates' in data.ranking) {
          content += "**Rankings:**\n";
          data.ranking.rankedCandidates.forEach((c) => {
            content += `${c.rank}. ${c.candidateName} (Score: ${c.score})\n   ${c.justification}\n\n`;
          });
          
          content += "\n**Top Recommendations:**\n";
          data.ranking.topRecommendations.forEach((r, i) => {
            content += `${i + 1}. ${r}\n`;
          });
          
          if (data.ranking.concerns.length > 0) {
            content += "\n**Concerns:**\n";
            data.ranking.concerns.forEach((c) => {
              content += `• ${c}\n`;
            });
          }
        }
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            timestamp: new Date(),
          },
        ]);
        toast.success("Candidate ranking complete!");
      },
      onError: (error) => {
        console.error("Candidate ranking error:", error);
        
        let errorMessage = error.message;
        let helpfulContent = `❌ **Unable to Rank Candidates**\n\n`;
        
        if (errorMessage.includes("No candidates found") || errorMessage.includes("0 candidates")) {
          helpfulContent += `**Issue**: No candidates are available to rank.\n\n`;
          helpfulContent += `**What to do:**\n`;
          helpfulContent += `1. Make sure candidates have applied to your vacancies\n`;
          helpfulContent += `2. Check the "Candidates" section in the admin panel\n`;
          helpfulContent += `3. Candidates need to complete their applications before they can be ranked\n\n`;
          helpfulContent += `**Tip**: Once you have candidates who have taken tests, come back and try ranking again.`;
        } else if (errorMessage.includes("token") || errorMessage.includes("auth")) {
          helpfulContent += `**Issue**: Authentication error.\n\n`;
          helpfulContent += `**What to do:**\n`;
          helpfulContent += `1. Try logging out and logging back in\n`;
          helpfulContent += `2. Your session may have expired\n`;
          helpfulContent += `3. Contact support if the issue persists\n\n`;
          helpfulContent += `**Technical Details**: ${errorMessage}`;
        } else if (errorMessage.includes("AI") || errorMessage.includes("model")) {
          helpfulContent += `**Issue**: AI service error.\n\n`;
          helpfulContent += `**What to do:**\n`;
          helpfulContent += `1. Click "Test AI Connection" below to diagnose the issue\n`;
          helpfulContent += `2. Try again in a few moments\n`;
          helpfulContent += `3. Check if you can use other AI features\n\n`;
          helpfulContent += `**Technical Details**: ${errorMessage}`;
        } else {
          helpfulContent += `**Error**: ${errorMessage}\n\n`;
          helpfulContent += `**What to do:**\n`;
          helpfulContent += `1. Try again in a few moments\n`;
          helpfulContent += `2. Click "Test Basic Connection" to check system status\n`;
          helpfulContent += `3. Contact support if the issue persists`;
        }
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: helpfulContent,
            timestamp: new Date(),
          },
        ]);
        
        toast.error(`Ranking failed: ${errorMessage}`);
      },
    })
  );

  const testConnectionMutation = useMutation(
    trpc.testAiConnection.mutationOptions({
      onSuccess: (data) => {
        console.log("AI Connection Test Results:", data);
        
        let message = `🔍 **AI Connection Diagnostics**\n\n`;
        message += `**Status:** ${data.overallStatus}\n`;
        message += `**Time:** ${new Date(data.timestamp).toLocaleString()}\n\n`;
        
        if (data.checks) {
          message += `**Environment:**\n`;
          message += `- API Key Present: ${data.checks.apiKeyPresent ? '✓' : '✗'}\n`;
          message += `- API Key Length: ${data.checks.apiKeyLength} characters\n`;
          message += `- API Key Prefix: ${data.checks.apiKeyPrefix}\n\n`;
          
          if (data.checks.modelInitialized) {
            message += `**Model:** ✓ Initialized successfully\n\n`;
          }
          
          if (data.checks.textGeneration) {
            message += `**Simple Test:**\n`;
            message += `- Status: ${data.checks.textGeneration.success ? '✓ Success' : '✗ Failed'}\n`;
            message += `- Response Time: ${data.checks.textGeneration.responseTime}ms\n`;
            message += `- Response: "${data.checks.textGeneration.response}"\n\n`;
          }
          
          if (data.checks.complexPrompt) {
            message += `**Complex Test:**\n`;
            message += `- Status: ${data.checks.complexPrompt.success ? '✓ Success' : '✗ Failed'}\n`;
            message += `- Response Time: ${data.checks.complexPrompt.responseTime}ms\n`;
            message += `- Response: "${data.checks.complexPrompt.response}"\n\n`;
          }
        }
        
        if (data.error) {
          message += `\n**Error Details:**\n`;
          message += `- Type: ${data.error.name}\n`;
          message += `- Message: ${data.error.message}\n`;
          if (data.error.cause) {
            message += `- Cause: ${data.error.cause}\n`;
          }
        }
        
        message += `\n${data.message || 'Diagnostics complete'}`;
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: message,
            timestamp: new Date(),
          },
        ]);
        
        if (data.overallStatus === 'HEALTHY') {
          toast.success("AI connection is healthy!");
        } else {
          toast.error("AI connection has issues - see details above");
        }
      },
      onError: (error) => {
        console.error("AI connection test failed:", error);
        toast.error(`Connection test failed: ${error.message}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ **Connection Test Failed**\n\nError: ${error.message}\n\nPlease check the server logs for more details.`,
            timestamp: new Date(),
          },
        ]);
      },
    })
  );

  const simpleDiagnosticMutation = useMutation(
    trpc.simpleDiagnostic.mutationOptions({
      onSuccess: (data) => {
        console.log("Simple Diagnostic Results:", data);
        
        let message = `🔍 **Basic Connection Test**\n\n`;
        message += `**Status:** ✅ SUCCESS\n`;
        message += `**Timestamp:** ${data.timestamp}\n`;
        message += `**Business:** ${data.businessName}\n`;
        message += `**Business ID:** ${data.businessId}\n\n`;
        message += `**Echo Test:** "${data.echo}"\n\n`;
        message += `**Response:** ${data.message}\n\n`;
        message += `✅ **Result:** tRPC communication is working correctly!\n\n`;
        message += `This means:\n`;
        message += `• ✓ Token verification works\n`;
        message += `• ✓ Database access works\n`;
        message += `• ✓ Basic request/response flow works\n\n`;
        message += `If AI features are not working, the issue is specifically with the AI SDK or model configuration.`;
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: message,
            timestamp: new Date(),
          },
        ]);
        
        toast.success("Basic connection test passed!");
      },
      onError: (error) => {
        console.error("Simple diagnostic failed:", error);
        
        let message = `❌ **Basic Connection Test Failed**\n\n`;
        message += `**Error:** ${error.message}\n\n`;
        message += `This indicates a fundamental issue with:\n`;
        message += `• Network connectivity\n`;
        message += `• Token verification\n`;
        message += `• Database access\n`;
        message += `• Or basic tRPC setup\n\n`;
        message += `**Next Steps:**\n`;
        message += `1. Check your internet connection\n`;
        message += `2. Try refreshing the page\n`;
        message += `3. Check the browser console for errors\n`;
        message += `4. Check server logs for more details\n\n`;
        message += `**Technical Details:** ${error.message}`;
        
        toast.error(`Basic connection test failed: ${error.message}`);
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: message,
            timestamp: new Date(),
          },
        ]);
      },
    })
  );

  // Direct data query mutations (bypass AI)
  const directCandidatesMutation = useMutation(
    trpc.getDirectCandidateList.mutationOptions({
      onSuccess: (data) => {
        let content = `📋 **Candidate List** (${data.count} total)\n\n`;
        
        if (data.count === 0) {
          content += data.message;
        } else {
          data.candidates.forEach((c, index) => {
            content += `**${index + 1}. ${c.name}**\n`;
            content += `   • Email: ${c.email}\n`;
            content += `   • Phone: ${c.phone || 'N/A'}\n`;
            content += `   • Experience: ${c.experience}\n`;
            content += `   • Expected Salary: ${c.expectedSalary}\n`;
            content += `   • Status: ${c.status}\n`;
            content += `   • Applied For: ${c.appliedFor}\n`;
            content += `   • Tests Taken: ${c.testsTaken}\n`;
            if (c.testsTaken > 0) {
              content += `   • Average Score: ${c.averageScore}\n`;
              if (c.latestTest) {
                content += `   • Latest Test: ${c.latestTest.name} (${c.latestTest.score}%)\n`;
              }
            }
            content += `   • Applied: ${new Date(c.appliedAt).toLocaleDateString()}\n`;
            if (c.cvUrl) {
              content += `   • [View CV](${c.cvUrl})\n`;
            }
            content += `\n`;
          });
        }
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            timestamp: new Date(),
          },
        ]);
        
        toast.success(`Retrieved ${data.count} candidate${data.count === 1 ? '' : 's'}`);
      },
      onError: (error) => {
        toast.error(`Failed to get candidates: ${error.message}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Failed to retrieve candidate list: ${error.message}\n\nPlease try again or check the Candidates section in the admin panel.`,
            timestamp: new Date(),
          },
        ]);
      },
    })
  );

  const directTestsMutation = useMutation(
    trpc.getDirectTestList.mutationOptions({
      onSuccess: (data) => {
        let content = `📝 **Test List** (${data.count} total)\n\n`;
        
        if (data.count === 0) {
          content += data.message;
        } else {
          data.tests.forEach((t, index) => {
            content += `**${index + 1}. ${t.name}**\n`;
            content += `   • Type: ${t.type}\n`;
            content += `   • Questions: ${t.questionCount}\n`;
            content += `   • Submissions: ${t.submissionCount}\n`;
            content += `   • Pass Threshold: ${t.passThreshold}\n`;
            content += `   • Duration: ${t.duration}\n`;
            content += `   • Created: ${new Date(t.createdAt).toLocaleDateString()}\n\n`;
          });
        }
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            timestamp: new Date(),
          },
        ]);
        
        toast.success(`Retrieved ${data.count} test${data.count === 1 ? '' : 's'}`);
      },
      onError: (error) => {
        toast.error(`Failed to get tests: ${error.message}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Failed to retrieve test list: ${error.message}\n\nPlease try again or check the Test Management section in the admin panel.`,
            timestamp: new Date(),
          },
        ]);
      },
    })
  );

  const directSubmissionsMutation = useMutation(
    trpc.getDirectSubmissionList.mutationOptions({
      onSuccess: (data) => {
        let content = `📊 **Test Submissions** (${data.count} total)\n\n`;
        
        if (data.count === 0) {
          content += data.message;
        } else {
          data.submissions.forEach((s, index) => {
            content += `**${index + 1}. ${s.candidateName}** - ${s.testName}\n`;
            content += `   • Email: ${s.candidateEmail}\n`;
            content += `   • Status: ${s.status}\n`;
            content += `   • Score: ${s.score}\n`;
            content += `   • Pass Threshold: ${s.passThreshold}\n`;
            content += `   • Result: ${s.result}\n`;
            content += `   • Submitted: ${new Date(s.submittedAt).toLocaleDateString()}\n`;
            if (s.completedAt) {
              content += `   • Completed: ${new Date(s.completedAt).toLocaleDateString()}\n`;
            }
            content += `\n`;
          });
        }
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            timestamp: new Date(),
          },
        ]);
        
        toast.success(`Retrieved ${data.count} submission${data.count === 1 ? '' : 's'}`);
      },
      onError: (error) => {
        toast.error(`Failed to get submissions: ${error.message}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Failed to retrieve submission list: ${error.message}\n\nPlease try again or check the Test Submissions section in the admin panel.`,
            timestamp: new Date(),
          },
        ]);
      },
    })
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
        title="AI Assistant"
      >
        <Sparkles className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col transition-all duration-200",
        isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  )}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">AI is thinking...</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Quick Actions:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: `📋 **How to Analyze a CV:**

1. **From Admin Panel**: 
   - Go to the "Candidates" section
   - Click on a candidate's name
   - Click the "Analyze CV" button in their profile

2. **Using AI Chat**:
   - Upload a CV/Resume file using the 📎 attachment button below
   - The AI will automatically analyze the document

3. **Quick Analysis**:
   - Type: "Analyze the CV for [candidate name]"
   - Or: "Show me details about [candidate name]"

**Tip**: Make sure candidates have uploaded their CVs before requesting analysis.`,
                      timestamp: new Date(),
                    },
                  ]);
                }}
                className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                disabled={isStreaming}
              >
                <FileText className="h-3 w-3" />
                Analyze CV
              </button>
              <button
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: `📝 **How to Evaluate Test Submissions:**

1. **From Admin Panel**:
   - Go to the "Test Submissions" section
   - Click on a submission to view details
   - Use the "AI Evaluate" button for automatic evaluation

2. **Using AI Chat**:
   - Type: "Show me recent test submissions"
   - Type: "Evaluate the latest test submission"
   - Or ask about specific candidates' test results

3. **Manual Review**:
   - Navigate to "Test Submissions"
   - Review and score open-text answers manually
   - The AI can provide scoring suggestions

**Tip**: The AI can help evaluate open-text answers and provide insights on candidate performance.`,
                      timestamp: new Date(),
                    },
                  ]);
                }}
                className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                disabled={isStreaming}
              >
                <ClipboardCheck className="h-3 w-3" />
                Evaluate Test
              </button>
              <button
                onClick={async () => {
                  // Check cooldown
                  const timeSinceLastRequest = Date.now() - lastRequestTime;
                  const minInterval = 3000;

                  if (timeSinceLastRequest < minInterval) {
                    const remainingCooldown = Math.ceil((minInterval - timeSinceLastRequest) / 1000);
                    toast.error(`Please wait ${remainingCooldown} seconds`, { icon: '⏱️' });
                    return;
                  }

                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "user",
                      content: "🔄 Ranking all candidates...",
                      timestamp: new Date(),
                    },
                  ]);
                  setLastRequestTime(Date.now());
                  
                  try {
                    await rankCandidatesMutation.mutateAsync({ token });
                  } catch (error: any) {
                    console.error("Rank candidates error:", error);
                  }
                }}
                className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                disabled={isStreaming || rankCandidatesMutation.isPending || requestCooldown > 0}
              >
                <Users className="h-3 w-3" />
                {rankCandidatesMutation.isPending ? "Ranking..." : requestCooldown > 0 ? `Wait ${requestCooldown}s` : "Rank Candidates"}
              </button>
              <button
                onClick={async () => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "user",
                      content: "📋 Getting list of all candidates...",
                      timestamp: new Date(),
                    },
                  ]);
                  
                  try {
                    await directCandidatesMutation.mutateAsync({ token });
                  } catch (error: any) {
                    console.error("Direct candidates query error:", error);
                  }
                }}
                className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
                disabled={isStreaming || directCandidatesMutation.isPending}
                title="Get candidate list directly from database (no AI needed)"
              >
                <Users className="h-3 w-3" />
                {directCandidatesMutation.isPending ? "Loading..." : "List Candidates"}
              </button>
              <button
                onClick={async () => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "user",
                      content: "📝 Getting list of all tests...",
                      timestamp: new Date(),
                    },
                  ]);
                  
                  try {
                    await directTestsMutation.mutateAsync({ token });
                  } catch (error: any) {
                    console.error("Direct tests query error:", error);
                  }
                }}
                className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
                disabled={isStreaming || directTestsMutation.isPending}
                title="Get test list directly from database (no AI needed)"
              >
                <ClipboardCheck className="h-3 w-3" />
                {directTestsMutation.isPending ? "Loading..." : "List Tests"}
              </button>
              <button
                onClick={async () => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "user",
                      content: "📊 Getting list of all test submissions...",
                      timestamp: new Date(),
                    },
                  ]);
                  
                  try {
                    await directSubmissionsMutation.mutateAsync({ token });
                  } catch (error: any) {
                    console.error("Direct submissions query error:", error);
                  }
                }}
                className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
                disabled={isStreaming || directSubmissionsMutation.isPending}
                title="Get submission list directly from database (no AI needed)"
              >
                <FileText className="h-3 w-3" />
                {directSubmissionsMutation.isPending ? "Loading..." : "List Submissions"}
              </button>
              <button
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "user",
                      content: "🔍 Testing basic connection (no AI)...",
                      timestamp: new Date(),
                    },
                  ]);
                  simpleDiagnosticMutation.mutate({ 
                    token,
                    message: "Hello from the frontend!"
                  });
                }}
                className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
                disabled={isStreaming || simpleDiagnosticMutation.isPending}
                title="Test basic tRPC communication without AI"
              >
                <Sparkles className="h-3 w-3" />
                {simpleDiagnosticMutation.isPending ? "Testing..." : "Test Basic Connection"}
              </button>
              <button
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "user",
                      content: "🔍 Running AI connection diagnostics...",
                      timestamp: new Date(),
                    },
                  ]);
                  testConnectionMutation.mutate({ token });
                }}
                className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1"
                disabled={isStreaming || testConnectionMutation.isPending}
                title="Test AI connection and diagnose issues"
              >
                <Sparkles className="h-3 w-3" />
                {testConnectionMutation.isPending ? "Testing..." : "Test AI Connection"}
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          {selectedFile && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedFile.type.startsWith('image/') ? (
                    <Image className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <File className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearFile}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  disabled={isUploadingFile}
                >
                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
              {isUploadingFile && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-700 dark:text-blue-300">Uploading and analyzing...</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {requestCooldown > 0 && (
              <div className="mb-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded">
                <Clock className="h-4 w-4" />
                <span>Please wait {requestCooldown} seconds before sending another request (prevents rate limiting)</span>
              </div>
            )}
            <div className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* File upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || isUploadingFile || requestCooldown > 0}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload file for analysis"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  requestCooldown > 0 
                    ? `Wait ${requestCooldown}s...` 
                    : selectedFile 
                      ? "Add analysis instructions (optional)..." 
                      : "Ask me anything..."
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                disabled={isStreaming || isUploadingFile || requestCooldown > 0}
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !selectedFile) || isStreaming || isUploadingFile || requestCooldown > 0}
                size="sm"
                className="px-3"
              >
                {selectedFile ? <Upload className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {requestCooldown > 0 ? (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                ⏱️ Rate limit protection active - prevents "Too Many Requests" errors
              </p>
            ) : selectedFile ? (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                💡 Tip: Add specific instructions for the AI analysis, or click send to analyze with default settings.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
