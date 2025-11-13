"use client";

import { useAuth, requireAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProjectStats {
  active: number;
  completed: number;
  total: number;
}

interface TaskStats {
  todo: number;
  in_progress: number;
  done: number;
  total: number;
}

interface StatsOverview {
  projects: ProjectStats;
  tasks: TaskStats;
  teams: number;
  users: number;
}

function UserDashboard() {
  const { user, logout, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not normal user
  useEffect(() => {
    if (user && user.role !== 'member') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'manager') {
        router.push('/manager/dashboard');
      }
    }
  }, [user, router, toast]);

  useEffect(() => {
    if (user?.role === 'member') {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/stats/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load statistics";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'member') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">
                My Dashboard
              </h1>
              <nav className="flex gap-4">
                <Link href="/user/dashboard" className="text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/tasks" className="text-gray-600 hover:text-gray-900">
                  My Tasks
                </Link>
                <Link href="/projects" className="text-gray-600 hover:text-gray-900">
                  Projects
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.username}</span>
                <span className="text-purple-600 ml-2 font-semibold">({user?.role})</span>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-2">View and update your assigned tasks.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-900">Loading your tasks...</div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {/* My Tasks Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>My Tasks</CardTitle>
                  <CardDescription>Tasks assigned to you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">
                    {stats?.tasks.total || 0}
                  </div>
                  <div className="flex flex-col gap-1 mt-2 text-sm">
                    <span className="text-gray-600">
                      Todo: {stats?.tasks.todo || 0}
                    </span>
                    <span className="text-blue-600">
                      In Progress: {stats?.tasks.in_progress || 0}
                    </span>
                    <span className="text-green-600">
                      Done: {stats?.tasks.done || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Projects I'm In */}
              <Card>
                <CardHeader>
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>Projects with your tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">
                    {stats?.projects.total || 0}
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-green-600">
                      Active: {stats?.projects.active || 0}
                    </span>
                    <span className="text-gray-600">
                      Done: {stats?.projects.completed || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Teams */}
              <Card>
                <CardHeader>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>Total teams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">
                    {stats?.teams || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>My Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email</p>
                    <p className="text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Role</p>
                    <p className="text-sm text-gray-900 capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">User ID</p>
                    <p className="text-sm text-gray-900 font-mono text-xs">
                      {user?.id.substring(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Member since</p>
                    <p className="text-sm text-gray-900">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Navigate to common tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Link href="/tasks">
                    <Button>View My Tasks</Button>
                  </Link>
                  <Link href="/projects">
                    <Button variant="outline">View Projects</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

export default requireAuth(UserDashboard);
