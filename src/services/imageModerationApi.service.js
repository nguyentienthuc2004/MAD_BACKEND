const MODERATION_API_URL =
  process.env.MODERATION_API_URL || "http://localhost:3001/moderate-images";
const MODERATION_TIMEOUT_MS = Number(process.env.MODERATION_TIMEOUT_MS || 15000);
const NSFW_THRESHOLD = Number(process.env.NSFW_THRESHOLD || 0.7);

const parseModerationResponse = (payload) => {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const flags = Array.isArray(payload?.flags) ? payload.flags : [];

  const isSensitiveFromPayload = typeof payload?.isSensitive === "boolean" ? payload.isSensitive : null;
  const isSensitiveFromResults = results.some((item) => Boolean(item?.isSensitive));

  return {
    isSensitive:
      isSensitiveFromPayload !== null ? isSensitiveFromPayload : isSensitiveFromResults,
    flags,
    results,
  };
};

export const moderateImagesWithAiService = async ({
  files = [],
  threshold = NSFW_THRESHOLD,
}) => {
  if (!files.length) {
    return {
      isSensitive: false,
      flags: [],
      results: [],
    };
  }

  const form = new FormData();

  files.forEach((file, index) => {
    const filename = file.originalname || `image-${index + 1}.jpg`;
    const blob = new Blob([file.buffer], {
      type: file.mimetype || "image/jpeg",
    });

    form.append("files", blob, filename);
  });

  form.append("threshold", String(threshold));

  const timeoutSignal = AbortSignal.timeout(MODERATION_TIMEOUT_MS);
  const response = await fetch(MODERATION_API_URL, {
    method: "POST",
    body: form,
    signal: timeoutSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `AI moderation request failed (${response.status}): ${errorText || "No response body"}`,
    );
  }

  const payload = await response.json();
  return parseModerationResponse(payload);
};

export default {
  moderateImagesWithAiService,
};
