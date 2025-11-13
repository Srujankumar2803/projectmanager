"use client";

import { useState, useEffect } from "react";
import { useAuth, requireAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  message: string;
  created_at: string;
}

function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTaskAndComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const fetchTaskAndComments = async () => {
    try {
      // Fetch task details
      const taskResponse = await fetch(`http://localhost:8000/api/v1/tasks/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!taskResponse.ok) {
        throw new Error("Failed to fetch task");
      }

      const allTasks = await taskResponse.json();
      const currentTask = allTasks.find((t: Task) => t.id === taskId);
      
      if (!currentTask) {
        toast({
          title: "Error",
          description: "Task not found",
          variant: "destructive",
        });
        router.push("/tasks");
        return;
      }

      setTask(currentTask);

      // Fetch comments
      const commentsResponse = await fetch(
        `http://localhost:8000/api/v1/comments/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(commentsData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load task";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/comments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: taskId,
          message: newComment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add comment");
      }

      const addedComment = await response.json();
      setComments([...comments, addedComment]);
      setNewComment("");
      
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add comment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Task not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Project Manager
              </h1>
              <nav className="flex gap-4 mt-2">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link href="/teams" className="text-gray-600 hover:text-gray-900">
                  Teams
                </Link>
                <Link href="/projects" className="text-gray-600 hover:text-gray-900">
                  Projects
                </Link>
                <Link href="/tasks" className="text-blue-600 font-medium">
                  Tasks
                </Link>
              </nav>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user?.username}</span>
              <span className="text-gray-500 ml-2">({user?.role})</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
            ← Back to Tasks
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Task Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{task.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {task.description || "No description"}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                      task.status
                    )}`}
                  >
                    {formatStatus(task.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Due Date</h3>
                    <p className="text-gray-900">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "No due date"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Created</h3>
                    <p className="text-gray-900">{formatDate(task.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Comments ({comments.length})</CardTitle>
                <CardDescription>Discussion about this task</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Comments List */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-b border-gray-200 pb-3 last:border-0"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="space-y-3">
                  <div>
                    <Label htmlFor="comment">Add a comment</Label>
                    <textarea
                      id="comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your comment here..."
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? "Adding..." : "Add Comment"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default requireAuth(TaskDetailPage);
