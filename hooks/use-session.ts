"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  userId: string;
  email: string;
  firstName: string;
  isAdmin: boolean;
}

interface UseSessionReturn {
  user: User | null;
  loading: boolean;
  mutate: () => void;
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/session");

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { user, loading, mutate: fetchSession };
}
