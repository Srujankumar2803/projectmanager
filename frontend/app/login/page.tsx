"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password, secretCode });
      // Redirect happens in the login function
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Project Manager
          </CardTitle>
          <CardDescription className="text-center">
            Enter any email and password to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretCode">
                Secret Code <span className="text-gray-500 text-xs">(Optional - for Manager access)</span>
              </Label>
              <Input
                id="secretCode"
                type="text"
                placeholder="Enter manager code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Enter &quot;manager&quot; to get manager permissions
              </p>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2 text-center">
                How to login:
              </p>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">👤</span>
                  <div>
                    <p className="font-semibold text-gray-900">New User:</p>
                    <p>Enter any email and password - your account will be created automatically!</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">👨‍💼</span>
                  <div>
                    <p className="font-semibold text-gray-900">Manager Access:</p>
                    <p>Enter &quot;manager&quot; in the secret code field</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">⚡</span>
                  <div>
                    <p className="font-semibold text-gray-900">Admin Access:</p>
                    <p>Use email: <span className="font-mono">admin@example.com</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
