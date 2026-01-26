import { useState, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/Button";
import { RichTextEditor } from "~/components/ui/RichTextEditor";
import { cn } from "~/lib/utils";
import { Plus, Edit, Trash2, ExternalLink, Copy, Users, Eye, EyeOff, Building2 } from "lucide-react";
import toast from "react-hot-toast";

const vacancySchema = z.object({
  title: z.string().min(1, "Vacancy title is required"),
  description: z.string().optional(),
  image: z
    .custom<FileList>((val) => val instanceof FileList, "Please select a file")
    .refine((files) => files.length === 0 || files.length === 1, "Please select only one file or none")
    .transform((files) => files.length > 0 ? files[0] : null)
    .refine((file) => file === null || file instanceof File, "Invalid file selected")
    .refine((file) => file === null || file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) => file === null || file.type.startsWith('image/'),
      "File must be an image"
    )
    .optional(),
});

type VacancyForm = z.infer<typeof vacancySchema>;

interface VacancyManagementProps {
  token: string;
}

interface VacancyCardProps {
  vacancy: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
    applicationCount: number;
  };
  token: string;
  onEdit: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
  getVacancyUrl: (vacancyId: string) => string;
}

interface VacancyFormModalProps {
  token: string;
  vacancyId?: string | null;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; imageUrl?: string }) => void;
  isLoading: boolean;
}

function VacancyCard({ vacancy, onEdit, onDelete, onCopyUrl, getVacancyUrl }: VacancyCardProps) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Vacancy Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            {vacancy.imageUrl && (
              <img
                src={vacancy.imageUrl}
                alt={vacancy.title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {vacancy.title}
                </h4>
                <div className="flex items-center gap-2">
                  {vacancy.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      <Eye className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                    <Users className="w-3 h-3 mr-1" />
                    {vacancy.applicationCount} Applications
                  </span>
                </div>
              </div>
              
              {vacancy.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {vacancy.description}
                </p>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Created: {new Date(vacancy.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Application URL */}
        <div className="lg:w-80">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Application URL:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={getVacancyUrl(vacancy.id)}
              readOnly
              className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={onCopyUrl}
              className="flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(getVacancyUrl(vacancy.id), '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:flex-col lg:gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onEdit}
            className="flex items-center gap-1 flex-1 lg:flex-none"
          >
            <Edit className="h-4 w-4" />
            <span className="lg:hidden">Edit</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-1 flex-1 lg:flex-none"
          >
            <Trash2 className="h-4 w-4" />
            <span className="lg:hidden">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function VacancyFormModal({ token, vacancyId, onClose, onSubmit, isLoading }: VacancyFormModalProps) {
  const trpc = useTRPC();
  const isEditing = !!vacancyId;
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<VacancyForm>({
    resolver: zodResolver(vacancySchema),
  });

  const selectedImage = watch('image');

  // Image upload mutation
  const uploadImageMutation = useMutation(
    trpc.getPresignedUploadUrl.mutationOptions()
  );

  // Handle image preview
  useEffect(() => {
    if (selectedImage && selectedImage instanceof File) {
      const url = URL.createObjectURL(selectedImage);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [selectedImage]);

  // Fetch existing vacancy data if editing
  const existingVacancyQuery = useQuery(
    vacancyId 
      ? trpc.getVacancyById.queryOptions(
          { token, vacancyId },
          {
            enabled: !!vacancyId,
          }
        )
      : { queryKey: ['disabled'], queryFn: () => null, enabled: false }
  );

  // Handle setting form values when data is loaded
  useEffect(() => {
    if (existingVacancyQuery.data) {
      setValue('title', existingVacancyQuery.data.title);
      setValue('description', existingVacancyQuery.data.description || '');
      // For existing vacancy with imageUrl, we show it as preview but don't set the file input
      if (existingVacancyQuery.data.imageUrl && !imagePreview) {
        setImagePreview(existingVacancyQuery.data.imageUrl);
      }
    }
  }, [existingVacancyQuery.data, setValue, imagePreview]);

  const handleFormSubmit = async (data: VacancyForm) => {
    try {
      let imageUrl: string | undefined = undefined;

      // Upload image if provided
      if (data.image) {
        setIsUploadingImage(true);
        
        // Generate unique filename using crypto.randomUUID() to avoid collisions
        const uniqueId = crypto.randomUUID();
        const extension = data.image.name.split('.').pop();
        const objectName = `vacancy-${uniqueId}.${extension}`;

        // Get presigned URL
        const uploadUrlResponse = await uploadImageMutation.mutateAsync({
          token,
          objectName,
          contentType: data.image.type,
        });

        // Upload to MinIO
        const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
          method: 'PUT',
          body: data.image,
          headers: {
            'Content-Type': data.image.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        imageUrl = uploadUrlResponse.publicUrl;
        setIsUploadingImage(false);
      } else if (isEditing && existingVacancyQuery.data?.imageUrl) {
        // Keep existing image if no new image is uploaded
        imageUrl = existingVacancyQuery.data.imageUrl;
      }

      // Submit form with image URL
      onSubmit({
        title: data.title,
        description: data.description,
        imageUrl,
      });
    } catch (error) {
      setIsUploadingImage(false);
      console.error('Form submission failed:', error);
      toast.error('Failed to upload image. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isEditing ? 'Edit Vacancy' : 'Create New Vacancy'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditing ? 'Update vacancy information' : 'Add a new job vacancy with a unique application link'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vacancy Title *
            </label>
            <input
              {...register("title")}
              type="text"
              id="title"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                errors.title ? "border-red-300" : "border-gray-300 dark:border-gray-600"
              )}
              placeholder="e.g., Senior Software Developer"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Describe the role, requirements, and benefits... Use the toolbar to format your text with headings, lists, bold text, and more!"
                  error={!!errors.description}
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Use the formatting toolbar to create a well-structured job description with headings, lists, and emphasis.
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vacancy Image
            </label>
            <input
              {...register("image")}
              type="file"
              id="image"
              accept="image/*"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50",
                errors.image ? "border-red-300" : "border-gray-300 dark:border-gray-600"
              )}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
            )}
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                <div className="w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <p className="mt-1 text-sm text-gray-500">
              Optional: Upload an image to make your vacancy more attractive (max 5MB)
            </p>
          </div>

          {/* Upload Progress */}
          {isUploadingImage && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Uploading image...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading || isUploadingImage}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading || isUploadingImage}
              className="flex-1"
            >
              {isUploadingImage ? 'Uploading Image...' : isEditing ? 'Update Vacancy' : 'Create Vacancy'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VacancyManagement({ token }: VacancyManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    vacancyId: string;
    vacancyTitle: string;
    applicationCount: number;
  } | null>(null);
  const [businessContext, setBusinessContext] = useState<{
    businessId: number;
    businessName: string;
  } | null>(null);

  const trpc = useTRPC();

  // Extract business context from token
  useEffect(() => {
    if (token) {
      try {
        // Decode JWT token to extract business context
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.businessId && payload.businessName) {
          setBusinessContext({
            businessId: payload.businessId,
            businessName: payload.businessName,
          });
        }
      } catch (error) {
        console.error('Failed to extract business context from token:', error);
      }
    }
  }, [token]);

  // Fetch vacancies
  const { data: vacancies, isLoading, refetch, error } = useQuery(
    trpc.getAllVacancies.queryOptions({ token }, {
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchIntervalInBackground: false,
      retry: (failureCount, error) => {
        if (error.message.includes('Invalid or expired token')) {
          return false;
        }
        return failureCount < 2;
      },
    })
  );

  // Create vacancy mutation
  const createVacancyMutation = useMutation(
    trpc.createVacancy.mutationOptions({
      onSuccess: () => {
        refetch();
        setShowCreateForm(false);
        toast.success('Vacancy created successfully!');
      },
      onError: (error) => {
        console.error('Create vacancy error:', error);
        toast.error(`Failed to create vacancy: ${error.message}`);
      },
    })
  );

  // Update vacancy mutation
  const updateVacancyMutation = useMutation(
    trpc.updateVacancy.mutationOptions({
      onSuccess: () => {
        refetch();
        setEditingVacancy(null);
        toast.success('Vacancy updated successfully!');
      },
      onError: (error) => {
        console.error('Update vacancy error:', error);
        toast.error(`Failed to update vacancy: ${error.message}`);
      },
    })
  );

  // Delete vacancy mutation
  const deleteVacancyMutation = useMutation(
    trpc.deleteVacancy.mutationOptions({
      onSuccess: (data) => {
        refetch();
        setDeleteConfirmation(null);
        toast.success(data.message);
      },
      onError: (error) => {
        console.error('Delete vacancy error:', error);
        toast.error(`Failed to delete vacancy: ${error.message}`);
      },
    })
  );

  // Generate vacancy application URL using current business context
  const getVacancyUrl = (vacancyId: string) => {
    const currentUrl = new URL(window.location.href);
    const currentDomain = currentUrl.hostname;
    const protocol = currentUrl.protocol;
    const port = currentUrl.port ? `:${currentUrl.port}` : '';
    
    // For preview environments or localhost, use path-based routing with current business
    const isPreviewEnvironment = currentDomain.includes('preview-') || currentDomain.includes('codapt.app');
    const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
    
    if (isPreviewEnvironment || isLocalhost) {
      // Use the actual business context from the admin token
      const businessName = businessContext?.businessName || 'demo';
      return `${protocol}//${currentDomain}${port}/${businessName}/vacancy/${vacancyId}`;
    }
    
    // Handle production subdomains
    const parts = currentDomain.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'api') {
        // Already on a business subdomain, use vacancy path directly
        return `${protocol}//${currentDomain}${port}/vacancy/${vacancyId}`;
      }
    }
    
    // Fallback: use business context or demo
    const businessName = businessContext?.businessName || 'demo';
    return `${protocol}//${currentDomain}${port}/${businessName}/vacancy/${vacancyId}`;
  };

  // Copy URL to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy URL');
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Vacancy Management</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Create and manage job vacancies with unique application links.</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Vacancy
          </Button>
        </div>
      </div>

      {/* General Application Link Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow-sm p-4 sm:p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">General Application Link</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Share this link to receive general applications. Candidates applying through this link will be marked as "General" applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={(() => {
                    const currentUrl = new URL(window.location.href);
                    const currentDomain = currentUrl.hostname;
                    const protocol = currentUrl.protocol;
                    const port = currentUrl.port ? `:${currentUrl.port}` : '';
                    
                    // For preview environments or localhost, use path-based routing with current business
                    const isPreviewEnvironment = currentDomain.includes('preview-') || currentDomain.includes('codapt.app');
                    const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
                    
                    if (isPreviewEnvironment || isLocalhost) {
                      // Use the actual business context from the admin token
                      const businessName = businessContext?.businessName || 'demo';
                      return `${protocol}//${currentDomain}${port}/${businessName}`;
                    }
                    
                    // Handle production subdomains
                    const parts = currentDomain.split('.');
                    if (parts.length >= 3) {
                      const subdomain = parts[0];
                      if (subdomain !== 'www' && subdomain !== 'api') {
                        return `${protocol}//${currentDomain}${port}`;
                      }
                    }
                    
                    // Fallback: use business context or demo
                    const businessName = businessContext?.businessName || 'demo';
                    return `${protocol}//${currentDomain}${port}/${businessName}`;
                  })()}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const currentUrl = new URL(window.location.href);
                    const currentDomain = currentUrl.hostname;
                    const protocol = currentUrl.protocol;
                    const port = currentUrl.port ? `:${currentUrl.port}` : '';
                    
                    const isPreviewEnvironment = currentDomain.includes('preview-') || currentDomain.includes('codapt.app');
                    const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
                    
                    let url;
                    if (isPreviewEnvironment || isLocalhost) {
                      // Use the actual business context from the admin token
                      const businessName = businessContext?.businessName || 'demo';
                      url = `${protocol}//${currentDomain}${port}/${businessName}`;
                    } else {
                      const parts = currentDomain.split('.');
                      if (parts.length >= 3) {
                        const subdomain = parts[0];
                        if (subdomain !== 'www' && subdomain !== 'api') {
                          url = `${protocol}//${currentDomain}${port}`;
                        } else {
                          const businessName = businessContext?.businessName || 'demo';
                          url = `${protocol}//${currentDomain}${port}/${businessName}`;
                        }
                      } else {
                        const businessName = businessContext?.businessName || 'demo';
                        url = `${protocol}//${currentDomain}${port}/${businessName}`;
                      }
                    }
                    
                    copyToClipboard(url);
                  }}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const currentUrl = new URL(window.location.href);
                    const currentDomain = currentUrl.hostname;
                    const protocol = currentUrl.protocol;
                    const port = currentUrl.port ? `:${currentUrl.port}` : '';
                    
                    const isPreviewEnvironment = currentDomain.includes('preview-') || currentDomain.includes('codapt.app');
                    const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
                    
                    let url;
                    if (isPreviewEnvironment || isLocalhost) {
                      // Use the actual business context from the admin token
                      const businessName = businessContext?.businessName || 'demo';
                      url = `${protocol}//${currentDomain}${port}/${businessName}`;
                    } else {
                      const parts = currentDomain.split('.');
                      if (parts.length >= 3) {
                        const subdomain = parts[0];
                        if (subdomain !== 'www' && subdomain !== 'api') {
                          url = `${protocol}//${currentDomain}${port}`;
                        } else {
                          const businessName = businessContext?.businessName || 'demo';
                          url = `${protocol}//${currentDomain}${port}/${businessName}`;
                        }
                      } else {
                        const businessName = businessContext?.businessName || 'demo';
                        url = `${protocol}//${currentDomain}${port}/${businessName}`;
                      }
                    }
                    
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vacancies List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading vacancies...</p>
        </div>
      ) : !vacancies || vacancies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Vacancies Created</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first vacancy to start receiving targeted applications.</p>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create First Vacancy
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {vacancies.length} Vacancy{vacancies.length !== 1 ? 'ies' : ''}
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {vacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                token={token}
                onEdit={() => setEditingVacancy(vacancy.id)}
                onDelete={() => setDeleteConfirmation({
                  vacancyId: vacancy.id,
                  vacancyTitle: vacancy.title,
                  applicationCount: vacancy.applicationCount,
                })}
                onCopyUrl={() => copyToClipboard(getVacancyUrl(vacancy.id))}
                getVacancyUrl={getVacancyUrl}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Vacancy Modal */}
      {(showCreateForm || editingVacancy) && (
        <VacancyFormModal
          token={token}
          vacancyId={editingVacancy}
          onClose={() => {
            setShowCreateForm(false);
            setEditingVacancy(null);
          }}
          onSubmit={(data) => {
            if (editingVacancy) {
              updateVacancyMutation.mutate({
                token,
                vacancyId: editingVacancy,
                ...data,
                isActive: true,
              });
            } else {
              createVacancyMutation.mutate({
                token,
                ...data,
              });
            }
          }}
          isLoading={createVacancyMutation.isPending || updateVacancyMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Vacancy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action may affect existing applications</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Are you sure you want to delete <strong>{deleteConfirmation.vacancyTitle}</strong>?
              </p>
              
              {deleteConfirmation.applicationCount > 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-medium text-yellow-800 dark:text-yellow-400">
                      {deleteConfirmation.applicationCount} Application{deleteConfirmation.applicationCount !== 1 ? 's' : ''} Found
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This vacancy will be deactivated instead of deleted to preserve existing applications.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    This vacancy has no applications and will be permanently deleted.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1"
                disabled={deleteVacancyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (deleteConfirmation) {
                    deleteVacancyMutation.mutate({
                      token,
                      vacancyId: deleteConfirmation.vacancyId,
                    });
                  }
                }}
                isLoading={deleteVacancyMutation.isPending}
                className="flex-1"
              >
                {deleteConfirmation.applicationCount > 0 ? 'Deactivate' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
