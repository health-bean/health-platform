/**
 * API Route: GET /api/reintroductions/notifications
 *
 * Fetch reintroduction notifications for the current user
 */

import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { generateReintroductionNotifications, shouldShowNotification, getNotificationSummary } from "@/lib/notifications/reintroduction";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate notifications
    const allNotifications = await generateReintroductionNotifications(session.userId);

    // TODO: Get user preferences from database
    // For now, using defaults (all enabled)
    const userPreferences = {
      enableTestingReminders: true,
      enableObservationReminders: true,
      enableMissedDaysWarnings: true,
    };

    // Filter notifications based on preferences
    const notifications = allNotifications.filter((notification) =>
      shouldShowNotification(notification, userPreferences)
    );

    // Get summary
    const summary = getNotificationSummary(notifications);

    return NextResponse.json({
      notifications,
      summary,
      preferences: userPreferences,
    });
  } catch (error) {
    console.error("Error fetching reintroduction notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
