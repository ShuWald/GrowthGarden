export type PromptMetrics = {
  prompt: string;
  source: string;
  prompt_timestamp: string;
  recorded_at: string;
  final_score: number;
  total_score: number;
  penalties: Record<string, number>;
  criteria_scores: Record<string, number>;
};

export type PromptAnalysis = PromptMetrics & {
  tags: string[];
};

export type FrontendMetricsSnapshot = {
  total_score: number;
  latest_prompt_metrics: PromptMetrics | null;
  latest_prompt_analysis: PromptAnalysis | null;
};

export type RecentPromptResponse = {
  count: number;
  limit: number;
  max_limit: number;
  prompts: PromptAnalysis[];
};

const DEFAULT_BACKEND_URL = "http://localhost:8000";

export function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

export async function fetchFrontendMetrics(): Promise<FrontendMetricsSnapshot> {
  const response = await fetch(`${getBackendBaseUrl()}/api/frontend`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load frontend metrics: ${response.status}`);
  }

  return response.json();
}

export async function fetchRecentPromptMetrics(
  limit = 10,
): Promise<RecentPromptResponse> {
  const response = await fetch(
    `${getBackendBaseUrl()}/api/prompts/recent?n=${limit}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load recent prompts: ${response.status}`);
  }

  return response.json();
}
