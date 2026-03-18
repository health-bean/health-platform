/**
 * USDA FoodData Central API client.
 * Searches Foundation + SR Legacy datasets only (whole foods, no processed/branded).
 *
 * Docs: https://fdc.nal.usda.gov/api-guide
 */

import { log } from "@/lib/logger";
import { cacheGet, cacheSet } from "@/lib/cache/insights";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const SEARCH_CACHE_TTL = 300; // 5 minutes

export interface UsdaFoodResult {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: string;
}

interface UsdaSearchResponse {
  foods: Array<{
    fdcId: number;
    description: string;
    dataType: string;
    foodCategory?: string;
  }>;
  totalHits: number;
}

/**
 * Search USDA FoodData Central for whole foods.
 * Returns up to `pageSize` results from Foundation + SR Legacy datasets.
 */
export async function searchUsda(
  query: string,
  pageSize: number = 10
): Promise<UsdaFoodResult[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    log.warn("USDA_API_KEY not configured, skipping USDA search");
    return [];
  }

  // Check cache first
  const cacheKey = `usda:search:${query.toLowerCase().trim()}:${pageSize}`;
  const cached = await cacheGet<UsdaFoodResult[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    query: query.trim(),
    dataType: "Foundation,SR Legacy",
    pageSize: String(pageSize),
    api_key: apiKey,
  });

  try {
    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      log.warn("USDA API returned non-200", { status: res.status });
      return [];
    }

    const data: UsdaSearchResponse = await res.json();

    const results: UsdaFoodResult[] = data.foods.map((f) => ({
      fdcId: f.fdcId,
      description: f.description,
      dataType: f.dataType,
      foodCategory: f.foodCategory,
    }));

    await cacheSet(cacheKey, results, SEARCH_CACHE_TTL);
    return results;
  } catch (err) {
    log.warn("USDA API search failed", { error: err });
    return [];
  }
}
