import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { Building2, User, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

const loginSchema = z.object({
  businessName: z.string().optional(), // Made optional - backend will determine from username/email
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login/")({
  component: BusinessLogin,
});

function BusinessLogin() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [detectedBusinessName, setDetectedBusinessName] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState(true);

  // Initialize form
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = form;

  // Initialize mutation
  const loginMutation = useMutation(
    trpc.businessLogin.mutationOptions({
      onSuccess: (data) => {
        try {
          localStorage.setItem('admin-token', data.token);
          toast.success(`Welcome back to ${data.business.displayName}!`);
          
          // Always use router navigation to preserve browser history
          navigate({ to: "/admin" });
        } catch (error) {
          console.error('Error handling login success:', error);
          toast.error('Login successful but there was an error redirecting');
        }
      },
      onError: (error) => {
        console.error('Login error:', error);
        toast.error(error.message || 'Login failed');
      },
    })
  );

  // Initialize resend verification mutation
  const resendVerificationMutation = useMutation(
    trpc.resendVerificationLink.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message || 'Verification email sent! Please check your inbox.');
      },
      onError: (error) => {
        console.error('Resend verification error:', error);
        toast.error(error.message || 'Failed to send verification email. Please try again.');
      },
    })
  );

  // Helper function to check if error is about email verification
  const isVerificationError = (errorMessage: string) => {
    return errorMessage.toLowerCase().includes('email verification required');
  };

  // Helper function to extract email from error message
  const extractEmailFromError = (errorMessage: string) => {
    const emailMatch = errorMessage.match(/\(([^)]+@[^)]+)\)/);
    return emailMatch ? emailMatch[1] : null;
  };

  // Handle resend verification link
  const handleResendVerification = () => {
    const { username } = form.getValues();
    if (!username) {
      toast.error('Please enter your username or email');
      return;
    }

    resendVerificationMutation.mutate({
      username,
      businessName: detectedBusinessName || undefined,
    });
  };

  // Detect business name from subdomain or localStorage
  useEffect(() => {
    let isMounted = true;
    
    const detectBusinessName = () => {
      try {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        let detectedName = '';
        
        // Check if we're in a preview environment (preview-xxx.codapt.app or similar)
        const isPreviewEnvironment = hostname.includes('preview-') || hostname.includes('codapt.app');
        const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
        
        if (isPreviewEnvironment || isLocalhost) {
          // For preview environments and localhost, check localStorage for the business name
          const signupBusinessName = localStorage.getItem('signup-business-name');
          if (signupBusinessName) {
            detectedName = signupBusinessName;
            // Keep it in localStorage for subsequent logins in preview environments
          }
          // REMOVED: No longer default to 'demo' - user must enter business name
        } else {
          // Check if we're on a business subdomain (for production environments)
          if (parts.length >= 3) {
            const subdomain = parts[0];
            if (subdomain !== 'www' && subdomain !== 'api' && !subdomain.startsWith('preview-')) {
              detectedName = subdomain;
            }
          }
          
          // If no subdomain detected, check if user just completed signup
          if (!detectedName) {
            const signupBusinessName = localStorage.getItem('signup-business-name');
            if (signupBusinessName) {
              detectedName = signupBusinessName;
              // Clear the stored business name after first use for non-preview environments
              localStorage.removeItem('signup-business-name');
            }
          }
        }
        
        // Set both the state and form value if we detected a business name
        if (isMounted) {
          if (detectedName) {
            setDetectedBusinessName(detectedName);
            setValue("businessName", detectedName);
          } else {
            setDetectedBusinessName('');
          }
          setIsDetecting(false);
        }
      } catch (error) {
        console.error('Error detecting business name:', error);
        if (isMounted) {
          setDetectedBusinessName('');
          setIsDetecting(false);
        }
      }
    };

    // Run detection after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(detectBusinessName, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [setValue]);

  const onSubmit = (data: LoginForm) => {
    try {
      console.log('Submitting login form:', { 
        businessName: data.businessName || detectedBusinessName || undefined, 
        username: data.username 
      });
      loginMutation.mutate({
        ...data,
        businessName: data.businessName || detectedBusinessName || undefined,
      });
    } catch (error) {
      console.error('Error submitting login form:', error);
      toast.error('Error submitting login form');
    }
  };

  // Show loading state while detecting business name
  if (isDetecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate({ to: "/" })}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                type="button"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </button>
              <ThemeToggle size="sm" />
            </div>
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Login</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in to your HR Assessment Platform
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Username or Email
              </label>
              <input
                {...register("username")}
                type="text"
                id="username"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter your username or email"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                id="password"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => navigate({ to: "/forgot-password" })}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                type="button"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={loginMutation.isPending}
              disabled={loginMutation.isPending}
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {loginMutation.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                {isVerificationError(loginMutation.error.message) ? (
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                      Email verification required. Please check your email{' '}
                      {extractEmailFromError(loginMutation.error.message) && (
                        <span className="font-semibold">
                          ({extractEmailFromError(loginMutation.error.message)})
                        </span>
                      )}{' '}
                      and click the verification link before logging in.
                    </p>
                    <button
                      onClick={handleResendVerification}
                      disabled={resendVerificationMutation.isPending}
                      type="button"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendVerificationMutation.isPending
                        ? 'Sending...'
                        : 'Send verification link again'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {loginMutation.error.message || 'Login failed. Please try again.'}
                  </p>
                )}
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have a business account?{" "}
              <button
                onClick={() => navigate({ to: "/signup" })}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                type="button"
              >
                Create one here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
