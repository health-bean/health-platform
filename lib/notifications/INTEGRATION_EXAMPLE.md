# Reintroduction Notifications - Integration Example

This document shows how to integrate the notification system into the Pico Health application.

## Step 1: Add Notifications to Dashboard

```tsx
// app/(app)/dashboard/page.tsx
import { ReintroductionNotifications } from "@/components/reintroductions/ReintroductionNotifications";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Notifications Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reintroduction Updates</h2>
        <ReintroductionNotifications />
      </section>

      {/* Other dashboard content */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {/* Timeline, insights, etc. */}
      </section>
    </div>
  );
}
```

## Step 2: Add Notification Badge to Navigation

```tsx
// components/layout/Navigation.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Navigation() {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    fetchNotificationCount();
    
    // Poll every hour
    const interval = setInterval(fetchNotificationCount, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch("/api/reintroductions/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.summary.actionRequired);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  return (
    <nav className="flex items-center space-x-6">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/timeline">Timeline</Link>
      <Link href="/insights">Insights</Link>
      <Link href="/reintroductions" className="relative">
        Reintroductions
        {notificationCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
```

## Step 3: Set Up Daily Cron Job (Vercel Cron)

```typescript
// app/api/cron/daily-reintroduction-updates/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reintroductionLog, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateReintroductionDays } from "@/lib/notifications/reintroduction";
import { updateMissedDays } from "@/lib/reintroductions/tracking";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all users with active reintroductions
    const activeReintroductions = await db
      .select({ userId: reintroductionLog.userId })
      .from(reintroductionLog)
      .where(eq(reintroductionLog.status, "active"))
      .groupBy(reintroductionLog.userId);

    const userIds = activeReintroductions.map((r) => r.userId);

    // Update day counters and missed days for each user
    for (const userId of userIds) {
      await updateReintroductionDays(userId);
      await updateMissedDays(userId);
    }

    return NextResponse.json({
      success: true,
      usersUpdated: userIds.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in daily reintroduction updates:", error);
    return NextResponse.json(
      { error: "Failed to update reintroductions" },
      { status: 500 }
    );
  }
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-reintroduction-updates",
      "schedule": "0 8 * * *"
    }
  ]
}
```

```env
# .env.local
CRON_SECRET=your-secret-key-here
```

## Step 4: Add Notification Preferences to Settings

```tsx
// app/(app)/settings/notifications/page.tsx
"use client";

import { useState } from "react";

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState({
    enableTestingReminders: true,
    enableObservationReminders: true,
    enableMissedDaysWarnings: true,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        alert("Preferences saved!");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h3 className="font-semibold">Testing Phase Reminders</h3>
            <p className="text-sm text-gray-600">
              Daily reminders to log reintroduction food (days 1-3)
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.enableTestingReminders}
            onChange={() => handleToggle("enableTestingReminders")}
            className="w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h3 className="font-semibold">Observation Phase Reminders</h3>
            <p className="text-sm text-gray-600">
              Daily reminders to avoid food and monitor symptoms (days 4-7)
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.enableObservationReminders}
            onChange={() => handleToggle("enableObservationReminders")}
            className="w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h3 className="font-semibold">Missed Days Warnings</h3>
            <p className="text-sm text-gray-600">
              Alerts when you miss logging for 2+ days
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.enableMissedDaysWarnings}
            onChange={() => handleToggle("enableMissedDaysWarnings")}
            className="w-5 h-5"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Save Preferences
      </button>
    </div>
  );
}
```

## Step 5: Handle Notification Actions

```tsx
// components/reintroductions/NotificationActionHandler.tsx
"use client";

import { useRouter } from "next/navigation";

interface NotificationActionHandlerProps {
  reintroductionId: string;
  notificationType: string;
  onComplete?: () => void;
}

export function NotificationActionHandler({
  reintroductionId,
  notificationType,
  onComplete,
}: NotificationActionHandlerProps) {
  const router = useRouter();

  const handleViewAnalysis = () => {
    router.push(`/reintroductions/${reintroductionId}/analysis`);
    onComplete?.();
  };

  const handleExtendTrial = async () => {
    try {
      const response = await fetch(`/api/reintroductions/${reintroductionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend" }),
      });

      if (response.ok) {
        alert("Trial extended by 3 days");
        onComplete?.();
      }
    } catch (error) {
      console.error("Failed to extend trial:", error);
    }
  };

  const handleCancelTrial = async () => {
    if (!confirm("Are you sure you want to cancel this reintroduction?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reintroductions/${reintroductionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });

      if (response.ok) {
        alert("Trial cancelled");
        onComplete?.();
      }
    } catch (error) {
      console.error("Failed to cancel trial:", error);
    }
  };

  if (notificationType === "analysis_ready") {
    return (
      <button
        onClick={handleViewAnalysis}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        View Analysis
      </button>
    );
  }

  if (notificationType === "missed_days_action") {
    return (
      <div className="flex space-x-2">
        <button
          onClick={handleExtendTrial}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Extend Trial
        </button>
        <button
          onClick={handleCancelTrial}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Cancel Trial
        </button>
      </div>
    );
  }

  return null;
}
```

## Step 6: Add Real-time Updates (Optional)

```tsx
// hooks/useReintroductionNotifications.ts
"use client";

import { useEffect, useState } from "react";
import type { ReintroductionNotification } from "@/lib/notifications/reintroduction";

export function useReintroductionNotifications() {
  const [notifications, setNotifications] = useState<ReintroductionNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/reintroductions/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchNotifications();
  };

  return { notifications, loading, refresh };
}
```

## Testing the Integration

### Manual Testing Checklist

1. **Create a reintroduction**
   - Start a new reintroduction trial
   - Verify notification appears on dashboard

2. **Test daily reminders**
   - Day 1-3: Should see "Log Your Reintroduction Food"
   - Day 4-7: Should see "Avoid Reintroduction Food"

3. **Test missed days**
   - Don't log food for 2 days → Warning notification
   - Don't log food for 3 days → Action required notification

4. **Test day 7 completion**
   - Advance to day 7 → "Analysis Ready" notification
   - Click "View Analysis" → Navigate to analysis page

5. **Test preferences**
   - Disable testing reminders → Should not see testing notifications
   - Critical notifications should always appear

### Automated Testing

```typescript
// e2e/reintroduction-notifications.spec.ts
import { test, expect } from "@playwright/test";

test("displays reintroduction notifications", async ({ page }) => {
  await page.goto("/dashboard");
  
  // Should see notification for active reintroduction
  await expect(page.locator('[data-testid="notification"]')).toBeVisible();
  
  // Should show correct notification type
  await expect(page.locator("text=Log Your Reintroduction Food")).toBeVisible();
});

test("handles notification actions", async ({ page }) => {
  await page.goto("/dashboard");
  
  // Click "View Analysis" button
  await page.click("text=View Analysis");
  
  // Should navigate to analysis page
  await expect(page).toHaveURL(/\/reintroductions\/.*\/analysis/);
});
```

## Monitoring and Debugging

### Check Notification Generation

```typescript
// In browser console or API testing tool
const response = await fetch("/api/reintroductions/notifications", {
  headers: { "x-user-id": "your-user-id" }
});
const data = await response.json();
console.log(data);
```

### Check Database State

```sql
-- View active reintroductions
SELECT 
  id,
  food_name,
  current_day,
  current_phase,
  missed_days,
  last_log_date
FROM reintroduction_log
WHERE user_id = 'your-user-id' AND status = 'active';
```

### Verify Cron Job Execution

```bash
# Check Vercel logs
vercel logs --follow

# Or test locally
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/daily-reintroduction-updates
```
