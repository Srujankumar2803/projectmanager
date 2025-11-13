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

function ManagerDashboard() {
  const { user, logout, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not manager
  useEffect(() => {
    if (user && user.role !== 'manager') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [user, router, toast]);

  useEffect(() => {
    if (user?.role === 'manager') {
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

  if (user?.role !== 'manager') {
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
                Manager Dashboard
              </h1>
              <nav className="flex gap-4">
                <Link href="/manager/dashboard" className="text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/teams" className="text-gray-600 hover:text-gray-900">
                  My Teams
                </Link>
                <Link href="/projects" className="text-gray-600 hover:text-gray-900">
                  My Projects
                </Link>
                <Link href="/tasks" className="text-gray-600 hover:text-gray-900">
                  Tasks
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.username}</span>
                <span className="text-green-600 ml-2 font-semibold">({user?.role})</span>
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
          <h2 className="text-3xl font-bold text-gray-900">Welcome, Manager!</h2>
          <p className="text-gray-600 mt-2">Manage your assigned teams, projects, and assign tasks to team members.</p>
        </div>

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
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>Projects you manage</CardDescription>
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
                  <CardTitle>Project Tasks</CardTitle>
                  <CardDescription>Tasks in your projects</CardDescription>
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
                  <CardDescription>Available teams</CardDescription>
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
                  <CardDescription>Users in system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">
                    {stats?.users || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manager Actions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Manager Actions</CardTitle>
                <CardDescription>
                  Manage your teams and projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Link href="/projects">
                    <Button>View My Projects</Button>
                  </Link>
                  <Link href="/tasks">
                    <Button variant="outline">Assign Tasks</Button>
                  </Link>
                  <Link href="/teams">
                    <Button variant="outline">Manage Teams</Button>
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

export default requireAuth(ManagerDashboard);
