/**
 * AI Content Moderation Service
 *
 * Pattern-based text moderation with configurable banned word lists,
 * spam detection, and severity classification.
 *
 * Severity levels:
 * - clean: Content is safe
 * - warning: Content has minor issues but is allowed (flagged for review)
 * - blocked: Content violates policies and is rejected
 */

// Banned words list (severe — content will be blocked)
const BLOCKED_WORDS = [
  "hate speech placeholder",
  "violence threat placeholder",
  "explicit content placeholder",
];

// Warning words list (content allowed but flagged)
const WARNING_WORDS = [
  "mild profanity placeholder",
  "borderline content placeholder",
];

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{10,}/i, // Repeated characters (e.g., "aaaaaaaaaaaa")
  /\b(buy now|click here|free money|act now|limited offer)\b/i, // Common spam phrases
  /(https?:\/\/[^\s]+){5,}/i, // Excessive URLs (5+)
  /(.{2,})\1{5,}/i, // Repeated phrases
];

// Contact/solicitation patterns
const SOLICITATION_PATTERNS = [
  /\b(whatsapp|telegram|signal)\s*:?\s*\+?\d{7,}/i,
  /\bDM\s+(me|for)\s+(prices?|deals?|offers?)\b/i,
];

/**
 * Moderate a text string
 * @param {string} text - The text to moderate
 * @returns {{ isClean: boolean, severity: string, flags: string[], details: string }}
 */
export const moderateText = (text) => {
  if (!text || typeof text !== "string") {
    return { isClean: true, severity: "clean", flags: [], details: "" };
  }

  const normalizedText = text.toLowerCase().trim();
  const flags = [];
  let severity = "clean";

  // Check blocked words
  for (const word of BLOCKED_WORDS) {
    if (normalizedText.includes(word.toLowerCase())) {
      flags.push(`blocked_word: "${word}"`);
      severity = "blocked";
    }
  }

  // Check warning words
  for (const word of WARNING_WORDS) {
    if (normalizedText.includes(word.toLowerCase())) {
      flags.push(`warning_word: "${word}"`);
      if (severity !== "blocked") {
        severity = "warning";
      }
    }
  }

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(normalizedText)) {
      flags.push(`spam_pattern: ${pattern.source}`);
      severity = "blocked";
    }
  }

  // Check solicitation patterns
  for (const pattern of SOLICITATION_PATTERNS) {
    if (pattern.test(normalizedText)) {
      flags.push(`solicitation: ${pattern.source}`);
      if (severity !== "blocked") {
        severity = "warning";
      }
    }
  }

  // Check for excessive caps (more than 70% uppercase in text > 10 chars)
  if (normalizedText.length > 10) {
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    if (letterCount > 0 && upperCount / letterCount > 0.7) {
      flags.push("excessive_caps");
      if (severity === "clean") {
        severity = "warning";
      }
    }
  }

  // Check text length (extremely long text)
  if (text.length > 5000) {
    flags.push("excessive_length");
    if (severity === "clean") {
      severity = "warning";
    }
  }

  return {
    isClean: severity === "clean",
    severity,
    flags,
    details:
      flags.length > 0
        ? `Content flagged: ${flags.join(", ")}`
        : "Content is clean",
  };
};

/**
 * Moderate multiple text fields at once
 * Returns the highest severity found across all fields.
 */
export const moderateContent = (fields) => {
  const results = {};
  let overallSeverity = "clean";
  const allFlags = [];

  for (const [key, text] of Object.entries(fields)) {
    const result = moderateText(text);
    results[key] = result;
    allFlags.push(...result.flags);

    if (result.severity === "blocked") {
      overallSeverity = "blocked";
    } else if (result.severity === "warning" && overallSeverity !== "blocked") {
      overallSeverity = "warning";
    }
  }

  return {
    isClean: overallSeverity === "clean",
    severity: overallSeverity,
    flags: allFlags,
    fieldResults: results,
  };
};

export default {
  moderateText,
  moderateContent,
};
