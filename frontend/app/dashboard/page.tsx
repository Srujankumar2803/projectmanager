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

function DashboardPage() {
  const { user, logout, token } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Project Manager
              </h1>
              <nav className="flex gap-4">
                <Link href="/dashboard" className="text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/teams" className="text-gray-600 hover:text-gray-900">
                  Teams
                </Link>
                <Link href="/projects" className="text-gray-600 hover:text-gray-900">
                  Projects
                </Link>
                <Link href="/tasks" className="text-gray-600 hover:text-gray-900">
                  Tasks
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.username}</span>
                <span className="text-gray-500 ml-2">({user?.role})</span>
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
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-900">Loading statistics...</div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Projects Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Projects</CardTitle>
                  <CardDescription>All projects</CardDescription>
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

              {/* Tasks Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Tasks</CardTitle>
                  <CardDescription>All tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">
                    {stats?.tasks.total || 0}
                  </div>
                  <div className="flex gap-2 mt-2 text-sm">
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

              {/* Teams Stats */}
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

              {/* Users Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Active users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">
                    {stats?.users || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Info Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Welcome back, {user?.username}!</CardTitle>
                <CardDescription>
                  Here&apos;s an overview of your project management dashboard
                </CardDescription>
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
                  <Link href="/projects">
                    <Button>View Projects</Button>
                  </Link>
                  <Link href="/tasks">
                    <Button variant="outline">View Tasks</Button>
                  </Link>
                  <Link href="/teams">
                    <Button variant="outline">View Teams</Button>
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

export default requireAuth(DashboardPage);
