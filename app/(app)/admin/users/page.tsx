"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldOff, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  isAdmin: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(userId: string, currentIsAdmin: boolean) {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u
          )
        );
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">
            {users.length} registered {users.length === 1 ? "user" : "users"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Role</th>
              <th className="px-4 py-3 font-medium text-slate-600">Joined</th>
              <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {user.firstName}
                </td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      user.onboardingCompleted
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {user.onboardingCompleted ? "Active" : "Onboarding"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      user.isAdmin
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {user.isAdmin ? (
                      <>
                        <Shield className="h-3 w-3" /> Admin
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3" /> User
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAdmin(user.id, user.isAdmin)}
                    disabled={updating === user.id}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      user.isAdmin
                        ? "text-red-600 hover:bg-red-50"
                        : "text-indigo-600 hover:bg-indigo-50",
                      updating === user.id && "opacity-50"
                    )}
                  >
                    {updating === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : user.isAdmin ? (
                      <>
                        <ShieldOff className="h-3 w-3" /> Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3" /> Make Admin
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
