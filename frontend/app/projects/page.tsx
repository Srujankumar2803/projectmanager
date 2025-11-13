"use client";

import { useState, useEffect } from "react";
import { useAuth, requireAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  team_id: string;
  manager_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

function ProjectsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    team_id: "",
    status: "active",
    start_date: "",
    end_date: "",
  });

  const canCreateProject = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    fetchProjects();
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchProjects = async () => {
    try {
      const url = statusFilter === "all" 
        ? "http://localhost:8000/api/v1/projects/"
        : `http://localhost:8000/api/v1/projects/?status_filter=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load projects";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/teams/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/projects/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newProject,
          start_date: newProject.start_date || null,
          end_date: newProject.end_date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create project");
      }

      const createdProject = await response.json();
      setProjects([createdProject, ...projects]);
      setNewProject({
        name: "",
        description: "",
        team_id: "",
        status: "active",
        start_date: "",
        end_date: "",
      });
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create project";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600">
                  Project Manager
                </h1>
              </Link>
              <nav className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link href="/teams" className="text-gray-600 hover:text-gray-900">
                  Teams
                </Link>
                <Link href="/projects" className="text-blue-600 font-medium">
                  Projects
                </Link>
                <Link href="/tasks" className="text-gray-600 hover:text-gray-900">
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
                <CardTitle>Projects</CardTitle>
                <CardDescription>
                  Manage and track your team&apos;s projects
                </CardDescription>
              </div>
              <div className="flex gap-4 items-center">
                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    onClick={() => setStatusFilter("all")}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "active" ? "default" : "outline"}
                    onClick={() => setStatusFilter("active")}
                    size="sm"
                  >
                    Active
                  </Button>
                  <Button
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    onClick={() => setStatusFilter("completed")}
                    size="sm"
                  >
                    Completed
                  </Button>
                </div>

                {canCreateProject && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Create Project</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <form onSubmit={handleCreateProject}>
                        <DialogHeader>
                          <DialogTitle>Create New Project</DialogTitle>
                          <DialogDescription>
                            Add a new project to your team
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                              id="name"
                              value={newProject.name}
                              onChange={(e) =>
                                setNewProject({ ...newProject, name: e.target.value })
                              }
                              placeholder="Website Redesign, Mobile App, etc."
                              required
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                              id="description"
                              value={newProject.description}
                              onChange={(e) =>
                                setNewProject({
                                  ...newProject,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Project description (optional)"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="team">Team</Label>
                            <select
                              id="team"
                              value={newProject.team_id}
                              onChange={(e) =>
                                setNewProject({
                                  ...newProject,
                                  team_id: e.target.value,
                                })
                              }
                              required
                              disabled={isSubmitting}
                              className="flex h-10 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select a team</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="start_date">Start Date</Label>
                              <Input
                                id="start_date"
                                type="date"
                                value={newProject.start_date}
                                onChange={(e) =>
                                  setNewProject({
                                    ...newProject,
                                    start_date: e.target.value,
                                  })
                                }
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="end_date">End Date</Label>
                              <Input
                                id="end_date"
                                type="date"
                                value={newProject.end_date}
                                onChange={(e) =>
                                  setNewProject({
                                    ...newProject,
                                    end_date: e.target.value,
                                  })
                                }
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                              id="status"
                              value={newProject.status}
                              onChange={(e) =>
                                setNewProject({
                                  ...newProject,
                                  status: e.target.value,
                                })
                              }
                              disabled={isSubmitting}
                              className="flex h-10 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Project"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-600">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No projects found. {canCreateProject && "Create your first project!"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        {project.description || (
                          <span className="text-gray-400">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {project.start_date
                          ? new Date(project.start_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {project.end_date
                          ? new Date(project.end_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {!canCreateProject && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only managers and administrators can create projects.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default requireAuth(ProjectsPage);
