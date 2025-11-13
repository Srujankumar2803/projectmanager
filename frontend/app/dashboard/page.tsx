"use client";

import { useAuth, requireAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function DashboardRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect to role-specific dashboard
      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'manager':
          router.push('/manager/dashboard');
          break;
        case 'member':
          router.push('/user/dashboard');
          break;
        default:
          // Default to user dashboard
          router.push('/user/dashboard');
      }
    }
  }, [user, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-600 font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

export default requireAuth(DashboardRedirect);
