import { Fragment, useState } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { 
  X, 
  User, 
  Building2, 
  BarChart3, 
  Lock, 
  Mail, 
  Calendar,
  Users,
  FileText,
  Briefcase,
  Target
} from "lucide-react";
import { cn } from "~/lib/utils";
import toast from "react-hot-toast";

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  profileData: {
    admin: {
      id: string;
      username: string;
      email: string | null;
      createdAt: Date;
    };
    business: {
      id: number;
      name: string;
      displayName: string;
      email: string;
      createdAt: Date;
      updatedAt: Date;
    };
    statistics: {
      candidateCount: number;
      testCount: number;
      vacancyCount: number;
      submissionCount: number;
      adminCount: number;
    };
  };
}

const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;

export function AdminProfileModal({ isOpen, onClose, token, profileData }: AdminProfileModalProps) {
  const trpc = useTRPC();
  const [selectedTab, setSelectedTab] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const passwordChangeMutation = useMutation(
    trpc.updateAdminPassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password updated successfully!", {
          icon: "🔒",
          duration: 4000,
        });
        resetForm();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update password", {
          icon: "❌",
          duration: 4000,
        });
      },
    })
  );

  const onPasswordChangeSubmit = (data: PasswordChangeForm) => {
    passwordChangeMutation.mutate({
      token,
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const tabs = [
    { name: "Profile", icon: User },
    { name: "Company", icon: Building2 },
    { name: "Statistics", icon: BarChart3 },
    { name: "Security", icon: Lock },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-500" />
                    Admin Profile
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                  <Tab.List className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                    {tabs.map((tab) => (
                      <Tab
                        key={tab.name}
                        className={({ selected }) =>
                          cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none",
                            selected
                              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          )
                        }
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.name}
                      </Tab>
                    ))}
                  </Tab.List>

                  <Tab.Panels className="p-6">
                    {/* Profile Tab */}
                    <Tab.Panel>
                      <ProfileTab admin={profileData.admin} />
                    </Tab.Panel>

                    {/* Company Tab */}
                    <Tab.Panel>
                      <CompanyTab business={profileData.business} />
                    </Tab.Panel>

                    {/* Statistics Tab */}
                    <Tab.Panel>
                      <StatisticsTab statistics={profileData.statistics} />
                    </Tab.Panel>

                    {/* Security Tab */}
                    <Tab.Panel>
                      <SecurityTab
                        register={register}
                        handleSubmit={handleSubmit}
                        onSubmit={onPasswordChangeSubmit}
                        errors={errors}
                        isLoading={passwordChangeMutation.isPending}
                      />
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ProfileTab({ admin }: { admin: AdminProfileModalProps["profileData"]["admin"] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
          {admin.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {admin.username}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Administrator</p>
        </div>
      </div>

      <div className="space-y-3">
        <InfoRow
          icon={User}
          label="Username"
          value={admin.username}
        />
        <InfoRow
          icon={Mail}
          label="Email"
          value={admin.email || "Not set"}
        />
        <InfoRow
          icon={Calendar}
          label="Member Since"
          value={new Date(admin.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
      </div>
    </div>
  );
}

function CompanyTab({ business }: { business: AdminProfileModalProps["profileData"]["business"] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
          <Building2 className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {business.displayName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{business.name}</p>
        </div>
      </div>

      <div className="space-y-3">
        <InfoRow
          icon={Building2}
          label="Business Name"
          value={business.name}
        />
        <InfoRow
          icon={Briefcase}
          label="Display Name"
          value={business.displayName}
        />
        <InfoRow
          icon={Mail}
          label="Business Email"
          value={business.email}
        />
        <InfoRow
          icon={Calendar}
          label="Created"
          value={new Date(business.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
        <InfoRow
          icon={Calendar}
          label="Last Updated"
          value={new Date(business.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
      </div>
    </div>
  );
}

function StatisticsTab({ statistics }: { statistics: AdminProfileModalProps["profileData"]["statistics"] }) {
  const stats = [
    {
      label: "Candidates",
      value: statistics.candidateCount,
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Vacancies",
      value: statistics.vacancyCount,
      icon: Briefcase,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Tests",
      value: statistics.testCount,
      icon: FileText,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Submissions",
      value: statistics.submissionCount,
      icon: Target,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Platform Overview</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              You have {statistics.candidateCount} candidates, {statistics.testCount} tests, and {statistics.vacancyCount} vacancies.
              {statistics.submissionCount > 0 && ` ${statistics.submissionCount} test submissions have been recorded.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityTab({
  register,
  handleSubmit,
  onSubmit,
  errors,
  isLoading,
}: {
  register: any;
  handleSubmit: any;
  onSubmit: (data: PasswordChangeForm) => void;
  errors: any;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <div>
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Change Password</h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Update your password to keep your account secure
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Password
          </label>
          <input
            {...register("oldPassword")}
            type="password"
            id="oldPassword"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter your current password"
          />
          {errors.oldPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.oldPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            {...register("newPassword")}
            type="password"
            id="newPassword"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter your new password (min. 8 characters)"
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            {...register("confirmNewPassword")}
            type="password"
            id="confirmNewPassword"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Confirm your new password"
          />
          {errors.confirmNewPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmNewPassword.message}</p>
          )}
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}
