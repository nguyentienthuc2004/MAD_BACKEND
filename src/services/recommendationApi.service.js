const RECOMMEND_API_URL =
  process.env.RECOMMEND_API_URL || "http://localhost:3001/recommend";
const RECOMMEND_TIMEOUT_MS = Number(process.env.RECOMMEND_TIMEOUT_MS || 5000);
const RECOMMEND_TOP_K = Number(process.env.RECOMMEND_TOP_K || 50);

const parseRecommendationResponse = (payload) => {
  const postIds = Array.isArray(payload?.post_ids)
    ? payload.post_ids
    : Array.isArray(payload?.postIds)
      ? payload.postIds
      : [];

  return postIds.map((id) => String(id)).filter(Boolean);
};

export const getRecommendedPostIds = async ({ userId, topK = RECOMMEND_TOP_K }) => {
  if (!userId) {
    return [];
  }

  const timeoutSignal = AbortSignal.timeout(RECOMMEND_TIMEOUT_MS);
  const response = await fetch(RECOMMEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: String(userId),
      top_k: Number(topK),
    }),
    signal: timeoutSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Recommendation request failed (${response.status}): ${errorText || "No response body"}`,
    );
  }

  const payload = await response.json();
  return parseRecommendationResponse(payload);
};

export default {
  getRecommendedPostIds,
};
