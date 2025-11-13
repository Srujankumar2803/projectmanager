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
  description: string | null;
  created_by: string;
  created_at: string;
}

function TeamsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
  });

  const isAdmin = user?.role === "admin";

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/teams/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }

      const data = await response.json();
      setTeams(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load teams";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/teams/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTeam),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create team");
      }

      const createdTeam = await response.json();
      setTeams([...teams, createdTeam]);
      setNewTeam({ name: "", description: "" });
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Team created successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create team";
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
                <Link href="/teams" className="text-blue-600 font-medium">
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
                <CardTitle>Teams</CardTitle>
                <CardDescription>
                  Manage your organization&apos;s teams
                </CardDescription>
              </div>
              {isAdmin && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Create Team</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateTeam}>
                      <DialogHeader>
                        <DialogTitle>Create New Team</DialogTitle>
                        <DialogDescription>
                          Add a new team to your organization
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Team Name</Label>
                          <Input
                            id="name"
                            value={newTeam.name}
                            onChange={(e) =>
                              setNewTeam({ ...newTeam, name: e.target.value })
                            }
                            placeholder="Engineering, Marketing, etc."
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={newTeam.description}
                            onChange={(e) =>
                              setNewTeam({
                                ...newTeam,
                                description: e.target.value,
                              })
                            }
                            placeholder="Team description (optional)"
                            disabled={isSubmitting}
                          />
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
                          {isSubmitting ? "Creating..." : "Create Team"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-600">
                Loading teams...
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No teams found. {isAdmin && "Create your first team!"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {team.description || (
                          <span className="text-gray-400">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(team.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {!isAdmin && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only administrators can create, update, or
              delete teams.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default requireAuth(TeamsPage);
