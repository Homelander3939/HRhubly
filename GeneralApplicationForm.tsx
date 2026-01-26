import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";

const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  yearsOfQualification: z.number().min(0, "Years of qualification must be 0 or more"),
  salary: z.number().min(0, "Salary expectation must be 0 or more"),
  socialLink: z.string().url("Valid URL is required").optional().or(z.literal('')),
  comment: z.string().optional().or(z.literal('')),
  vacancyId: z.string().optional(), // Add vacancy selection
  cv: z
    .custom<FileList>((val) => val instanceof FileList, "Please select a file")
    .refine((files) => files.length > 0, "CV file is required")
    .transform((files) => files[0])
    .refine((file) => file instanceof File, "Invalid file selected")
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type),
      "File must be PDF, DOC, or DOCX format"
    ),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

interface GeneralApplicationFormProps {
  businessName?: string;
  vacancyId?: string;
  vacancy?: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
  };
  availableVacancies?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  onSuccess?: () => void;
}

export function GeneralApplicationForm({ businessName, vacancyId, vacancy, availableVacancies, onSuccess }: GeneralApplicationFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const trpc = useTRPC();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      vacancyId: vacancyId || '', // Pre-select if coming from vacancy page
    },
  });

  const selectedVacancyId = watch('vacancyId');

  const generateUploadUrlMutation = useMutation(
    trpc.generateCvUploadUrl.mutationOptions()
  );

  const submitApplicationMutation = useMutation(
    trpc.submitGeneralApplication.mutationOptions({
      onSuccess: () => {
        setSubmitSuccess(true);
        onSuccess?.();
      },
    })
  );

  const onSubmit = async (data: ApplicationForm) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Get presigned URL for CV upload with retry logic
      let uploadUrlResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          uploadUrlResponse = await generateUploadUrlMutation.mutateAsync({
            fileName: data.cv.name,
            fileType: data.cv.type,
            hostname: window.location.hostname, // Keep hostname for CV upload
          });
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to generate upload URL after ${maxRetries} attempts: ${error.message}`);
          }
          // Wait a bit before retrying to avoid immediate collisions
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      if (!uploadUrlResponse) {
        throw new Error('Failed to generate upload URL');
      }

      setUploadProgress(25);

      // Step 2: Upload CV to MinIO
      const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
        method: 'PUT',
        body: data.cv,
        headers: {
          'Content-Type': data.cv.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload CV');
      }

      setUploadProgress(75);

      // Step 3: Submit application with CV URL
      await submitApplicationMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        yearsOfQualification: data.yearsOfQualification,
        salary: data.salary,
        socialLink: data.socialLink || undefined,
        comment: data.comment || undefined,
        cvUrl: uploadUrlResponse.fileUrl,
        vacancyId: data.vacancyId || vacancyId || undefined, // Use form selection or prop vacancyId
        businessName: businessName, // Use businessName instead of hostname
      });

      setUploadProgress(100);
    } catch (error) {
      console.error('Application submission failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted Successfully!</h2>
        <p className="text-gray-600 mb-6">
          {selectedVacancyId && availableVacancies ? 
            (() => {
              const selectedVacancy = availableVacancies.find(v => v.id === selectedVacancyId);
              return selectedVacancy 
                ? `Thank you for applying for the ${selectedVacancy.title} position. Our HR team will review your application and contact you soon.`
                : 'Thank you for your general application. Our HR team will review your information and contact you soon.';
            })()
            : vacancy 
              ? `Thank you for applying for the ${vacancy.title} position. Our HR team will review your application and contact you soon.`
              : 'Thank you for your general application. Our HR team will review your information and contact you soon.'
          }
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>What's next?</strong><br />
            • Our HR team will review your application<br />
            • You may be assigned a skills assessment test<br />
            • We'll notify you via email about the next steps
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {selectedVacancyId && availableVacancies ? 
            (() => {
              const selectedVacancy = availableVacancies.find(v => v.id === selectedVacancyId);
              return selectedVacancy ? `Apply for ${selectedVacancy.title}` : 'Submit Your Application';
            })()
            : vacancy 
              ? `Apply for ${vacancy.title}` 
              : 'Submit Your Application'
          }
        </h2>
        <p className="text-gray-600">
          {selectedVacancyId && availableVacancies ? 
            (() => {
              const selectedVacancy = availableVacancies.find(v => v.id === selectedVacancyId);
              return selectedVacancy 
                ? `Fill out the form below to apply for the ${selectedVacancy.title} position.`
                : 'Fill out the form below to apply for positions at our company.';
            })()
            : vacancy 
              ? `Fill out the form below to apply for the ${vacancy.title} position.`
              : 'Fill out the form below to apply for positions at our company.'
          } All fields are required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Vacancy Selection */}
        <div>
          <label htmlFor="vacancyId" className="block text-sm font-medium text-gray-700 mb-2">
            Position *
          </label>
          <select
            {...register("vacancyId")}
            id="vacancyId"
            className={cn(
              "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
              errors.vacancyId ? "border-red-300" : "border-gray-300"
            )}
          >
            <option value="">General Application</option>
            {availableVacancies && availableVacancies.length > 0 ? (
              availableVacancies.map((vacancy) => (
                <option key={vacancy.id} value={vacancy.id}>
                  {vacancy.title}
                </option>
              ))
            ) : null}
          </select>
          {errors.vacancyId && (
            <p className="mt-1 text-sm text-red-600">{errors.vacancyId.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {availableVacancies && availableVacancies.length > 0 
              ? "Select a specific position or leave as 'General Application'"
              : "No specific positions available - submitting as general application"
            }
          </p>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              {...register("firstName")}
              type="text"
              id="firstName"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
                errors.firstName ? "border-red-300" : "border-gray-300"
              )}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              {...register("lastName")}
              type="text"
              id="lastName"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
                errors.lastName ? "border-red-300" : "border-gray-300"
              )}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
                errors.email ? "border-red-300" : "border-gray-300"
              )}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              {...register("phone")}
              type="tel"
              id="phone"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
                errors.phone ? "border-red-300" : "border-gray-300"
              )}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Social Link */}
        <div>
          <label htmlFor="socialLink" className="block text-sm font-medium text-gray-700 mb-2">
            Social Link (LinkedIn, Portfolio, etc.)
          </label>
          <input
            {...register("socialLink")}
            type="url"
            id="socialLink"
            className={cn(
              "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
              errors.socialLink ? "border-red-300" : "border-gray-300"
            )}
            placeholder="https://linkedin.com/in/yourprofile"
          />
          {errors.socialLink && (
            <p className="mt-1 text-sm text-red-600">{errors.socialLink.message}</p>
          )}
        </div>

        {/* Professional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="yearsOfQualification" className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience *
            </label>
            <input
              {...register("yearsOfQualification", { valueAsNumber: true })}
              type="number"
              id="yearsOfQualification"
              min="0"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
                errors.yearsOfQualification ? "border-red-300" : "border-gray-300"
              )}
              placeholder="0"
            />
            {errors.yearsOfQualification && (
              <p className="mt-1 text-sm text-red-600">{errors.yearsOfQualification.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
              Salary Expectation (USD) *
            </label>
            <input
              {...register("salary", { valueAsNumber: true })}
              type="number"
              id="salary"
              min="0"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500",
                errors.salary ? "border-red-300" : "border-gray-300"
              )}
              placeholder="50000"
            />
            {errors.salary && (
              <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
            )}
          </div>
        </div>

        {/* CV Upload */}
        <div>
          <label htmlFor="cv" className="block text-sm font-medium text-gray-700 mb-2">
            Upload CV/Resume *
          </label>
          <input
            {...register("cv")}
            type="file"
            id="cv"
            accept=".pdf,.doc,.docx"
            className={cn(
              "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100",
              errors.cv ? "border-red-300" : "border-gray-300"
            )}
          />
          {errors.cv && (
            <p className="mt-1 text-sm text-red-600">{errors.cv.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Accepted formats: PDF, DOC, DOCX (max 10MB)
          </p>
        </div>

        {/* Comment / Motivation Letter */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comments or Motivation Letter
          </label>
          <textarea
            {...register("comment")}
            id="comment"
            rows={6}
            className={cn(
              "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder-gray-500 resize-y",
              errors.comment ? "border-red-300" : "border-gray-300"
            )}
            placeholder="Enter your comments or motivation letter here..."
          />
          {errors.comment && (
            <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional: Share your motivation, relevant experience, or any additional information you'd like us to know.
          </p>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Uploading application...</span>
              <span className="text-sm text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full text-lg"
          disabled={isUploading || submitApplicationMutation.isPending}
          isLoading={isUploading || submitApplicationMutation.isPending}
        >
          {isUploading ? "Uploading CV..." : "Submit Application"}
        </Button>

        {submitApplicationMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">
              {submitApplicationMutation.error.message || "Failed to submit application. Please try again."}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
