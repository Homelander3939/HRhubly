import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { RichTextEditor } from "~/components/ui/RichTextEditor";
import { cn } from "~/lib/utils";
import { X, MessageSquare, User } from "lucide-react";
import toast from "react-hot-toast";

interface CommentReviewModalProps {
  token: string;
  candidateId: string;
  candidateName: string;
  userComment: string | null;
  hrComment: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CommentReviewModal({
  token,
  candidateId,
  candidateName,
  userComment,
  hrComment,
  onClose,
  onSuccess,
}: CommentReviewModalProps) {
  const [hrCommentText, setHrCommentText] = useState(hrComment || "");
  const trpc = useTRPC();

  const addHrCommentMutation = useMutation(
    trpc.addHrCounterComment.mutationOptions({
      onSuccess: () => {
        toast.success("HR comment saved successfully!");
        onSuccess();
        onClose();
      },
      onError: (error) => {
        console.error("Error saving HR comment:", error);
        toast.error(`Failed to save comment: ${error.message}`);
      },
    })
  );

  const handleSave = () => {
    if (!hrCommentText.trim()) {
      toast.error("Please enter a comment before saving");
      return;
    }

    addHrCommentMutation.mutate({
      token,
      candidateId,
      hrComment: hrCommentText,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Comments & Motivation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {candidateName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={addHrCommentMutation.isPending}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* User Comment Section */}
          {userComment && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Candidate's Comment / Motivation Letter
                </h4>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {userComment}
                </p>
              </div>
            </div>
          )}

          {/* HR Comment Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                HR Counter-Comment
              </h4>
            </div>
            <div className="space-y-2">
              <RichTextEditor
                value={hrCommentText}
                onChange={setHrCommentText}
                placeholder="Add your HR notes, feedback, or counter-comment here..."
                className="min-h-[300px]"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This comment is visible only to HR administrators and will be displayed alongside the candidate's comment.
              </p>
            </div>
          </div>

          {/* Existing HR Comment Display (if exists and we're not editing) */}
          {hrComment && hrComment !== hrCommentText && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Current HR Comment:
              </p>
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-sm">
                {hrComment}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={addHrCommentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={addHrCommentMutation.isPending}
            disabled={!hrCommentText.trim() || hrCommentText === hrComment}
          >
            Save Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
