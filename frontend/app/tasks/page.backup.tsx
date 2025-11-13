"use client";

import { useState, useEffect } from "react";
import { useAuth, requireAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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

function TasksPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchTasks = async () => {
    try {
      const url = statusFilter === "all" 
        ? "http://localhost:8000/api/v1/tasks/"
        : `http://localhost:8000/api/v1/tasks/?status_filter=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update task status");
      }

      toast({
        title: "Success",
        description: "Task status updated successfully",
      });

      // Refresh tasks
      fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>
                  View and manage your assigned tasks
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "todo" ? "default" : "outline"}
                  onClick={() => setStatusFilter("todo")}
                  size="sm"
                >
                  To Do
                </Button>
                <Button
                  variant={statusFilter === "in_progress" ? "default" : "outline"}
                  onClick={() => setStatusFilter("in_progress")}
                  size="sm"
                >
                  In Progress
                </Button>
                <Button
                  variant={statusFilter === "done" ? "default" : "outline"}
                  onClick={() => setStatusFilter("done")}
                  size="sm"
                >
                  Done
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No tasks found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900">Title</TableHead>
                    <TableHead className="text-gray-900">Description</TableHead>
                    <TableHead className="text-gray-900">Status</TableHead>
                    <TableHead className="text-gray-900">Due Date</TableHead>
                    <TableHead className="text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-gray-900">
                        <Link 
                          href={`/tasks/${task.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {task.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            task.status
                          )}`}
                        >
                          {formatStatus(task.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {formatDate(task.due_date)}
                      </TableCell>
                      <TableCell>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default requireAuth(TasksPage);
