import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  symptomsDatabase,
  supplementsDatabase,
  medicationsDatabase,
  detoxTypes,
} from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { getSessionFromCookies } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const table = url.searchParams.get("table");

    switch (table) {
      case "symptoms": {
        const rows = await db
          .select({
            id: symptomsDatabase.id,
            name: symptomsDatabase.name,
            category: symptomsDatabase.category,
            description: symptomsDatabase.description,
            isCommon: symptomsDatabase.isCommon,
          })
          .from(symptomsDatabase)
          .orderBy(asc(symptomsDatabase.category), asc(symptomsDatabase.name));
        return NextResponse.json({ items: rows });
      }
      case "supplements": {
        const rows = await db
          .select({
            id: supplementsDatabase.id,
            name: supplementsDatabase.name,
            category: supplementsDatabase.category,
            description: supplementsDatabase.description,
            commonDosage: supplementsDatabase.commonDosage,
          })
          .from(supplementsDatabase)
          .orderBy(asc(supplementsDatabase.category), asc(supplementsDatabase.name));
        return NextResponse.json({ items: rows });
      }
      case "medications": {
        const rows = await db
          .select({
            id: medicationsDatabase.id,
            name: medicationsDatabase.name,
            category: medicationsDatabase.category,
            description: medicationsDatabase.description,
          })
          .from(medicationsDatabase)
          .orderBy(asc(medicationsDatabase.category), asc(medicationsDatabase.name));
        return NextResponse.json({ items: rows });
      }
      case "detox_types": {
        const rows = await db
          .select({
            id: detoxTypes.id,
            name: detoxTypes.name,
            category: detoxTypes.category,
            description: detoxTypes.description,
          })
          .from(detoxTypes)
          .orderBy(asc(detoxTypes.category), asc(detoxTypes.name));
        return NextResponse.json({ items: rows });
      }
      default:
        return NextResponse.json(
          { error: "Invalid table parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("GET /api/admin/reference error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
