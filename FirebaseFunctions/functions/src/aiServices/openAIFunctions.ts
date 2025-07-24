import * as functions from "firebase-functions";
import OpenAI from "openai";
import { getApiKey, openAISecret } from "../config.js";

// Constants
export const validTags = [
  "family",
  "health",
  "finances",
  "career",
  "friends",
  "personal",
];
export const validPrayerTypes = ["request", "praise", "repentance"];

// Initialize OpenAI client
const initializeOpenAI = async () => {
  const apiKey = getApiKey(); // Could be string | SecretParam | undefined

  if (typeof apiKey === "string") {
    return new OpenAI({ apiKey });
  }

  if (apiKey && "value" in apiKey && typeof apiKey.value === "function") {
    return new OpenAI({ apiKey: apiKey.value() });
  }

  throw new Error("OpenAI API key is not set or invalid");
};

/**
 * Cloud Function to analyze prayer content using OpenAI
 * This replaces the client-side analyzePrayerContent function
 */
export const analyzePrayerContent = functions.https.onCall(
  { secrets: [openAISecret] },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const {
      content,
      hasTranscription = false,
      maxPrayerPoints = 10,
    } = request.data;

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No prayer content provided"
      );
    }

    try {
      const openai = await initializeOpenAI();

      const titlePrompt =
        "Title: A concise title for the prayer, with a maximum character limit of 10.";

      const hasTranscriptionPrompt = `Please correct transcription errors in punctuation or misheard words. Use line breaks only for clear paragraph shifts. Do not paraphrase or summarize.`;

      const tagPrompt = `Tags: A list of up to 4 relevant tags for the prayer, selected from this list: ${validTags.join(", ")}`;

      const prayerPointPrompt = `Prayer Points:
      From the prayer text below, extract the **smallest number of distinct prayer points** possible, with max ${maxPrayerPoints} points, following these rules:

      - GENERAL STRATEGY:
        - Focus on **thematic grouping**. Most prayers only contain one or two core themes.
        - Do NOT create new topics unless the speaker radically shifts focus.
        - Group emotionally and contextually connected sentences together.

      - GROUPING GUIDELINES:
        - If a speaker lists items under a life context (e.g., "this summer"), treat the list and related reflections as **one topic**.
        - Merge lines that refer to the same person or situation.
        - Do NOT split based on punctuation, bullets, or formatting.

      - FILTERING:
        - Ignore generic prayers without context or action (e.g., "Bless everyone", "Thank you for today").

      Return each prayer point in this JSON format:
      {
        "title": string, // ≤25 words
        "prayerType": one of ['request', 'praise', 'repentance'],
        "content": string // Up to 7 original sentences
      }`;

      const example = {
        title: "string",
        ...(hasTranscription && { content: "string" }),
        tags: ["string"],
        prayerPoints: [
          {
            title: "string",
            prayerType: "string",
            content: "string",
          },
        ],
      };

      const rules = `
      - No offensive or fabricated content.
      - Respond only in valid JSON format as shown:
        ${JSON.stringify(example, null, 2)}
      `;

      let cleanedTranscript = content;

      if (hasTranscription) {
        const fixResult = await openai.chat.completions.create({
          model: "gpt-4o-mini", // cheaper and faster.
          messages: [
            { role: "system", content: "You are a careful copy editor." },
            { role: "user", content: `${hasTranscriptionPrompt}\n\n${content}` },
          ],
          temperature: 0.1,
        });

        cleanedTranscript = fixResult.choices?.[0]?.message?.content?.trim() || content;
        cleanedTranscript = cleanedTranscript.replace(/^[-\u2022]\s*/gm, '');
      }

      const systemPrompt = `You are a prayer analysis assistant that extracts meaningful prayer topics from transcribed user prayers. Prayers are often emotional, repetitive, or nonlinear. 
      Your job is to extract the fewest possible topics by identifying emotional or thematic unity.

      ${titlePrompt}
      ${tagPrompt}
      ${prayerPointPrompt}
      ##Rules:
      ${rules}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // better for analysis and emotion + themes.
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this prayer: ${cleanedTranscript}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      if (!result.title || !Array.isArray(result.tags)) {
        throw new Error("Invalid response structure");
      }

      const processedTags = result.tags
        .filter((tag: string) => validTags.includes(tag))
        .slice(0, 2);

      const processedPrayerPoints = result.prayerPoints.map(
        (prayerPoint: any) => {
          let prayerType = prayerPoint.prayerType;
          if (!validPrayerTypes.includes(prayerType)) {
            prayerType = "request";
          }

          return {
            title: prayerPoint.title.trim(),
            prayerType: prayerType,
            content: prayerPoint.content.trim(),
          };
        }
      );

      console.log(`Prayer analysis completed for user: ${request.auth.uid}`);

      return {
        title: result.title.trim(),
        cleanedTranscription: hasTranscription
          ? cleanedTranscript.replace(/\r\n/g, "\n")
          : undefined,
        tags: processedTags,
        prayerPoints: processedPrayerPoints,
      };
    } catch (error: any) {
      console.error("Error in analyzePrayerContent:", error);

      if (error.status === 429) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "AI service is temporarily unavailable. Please try again later."
        );
      } else if (error.status === 401) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Authentication error with AI service. Please try again later."
        );
      } else {
        throw new functions.https.HttpsError(
          "internal",
          error.message || "AI service error. Please try again later."
        );
      }
    }
  }
);

export async function getVectorEmbeddingFromOpenAI(
  input: string
): Promise<number[]> {
  const apiKey = getApiKey();
  const openai = new OpenAI({
    apiKey: typeof apiKey === "string" ? apiKey : apiKey.value(),
  });

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
    encoding_format: "float",
    dimensions: 250,
  });

  const embedding = response.data?.[0]?.embedding;

  if (
    !Array.isArray(embedding) ||
    embedding.length === 0 ||
    embedding.every((val) => val === 0)
  ) {
    throw new Error("Invalid vector embedding response");
  }

  return embedding;
}

/**
 * Cloud Function to get vector embeddings using OpenAI
 * This replaces the client-side getVectorEmbeddings function
 */
export const getVectorEmbeddings = functions.https.onCall(
  { secrets: [openAISecret] },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be called while authenticated."
      );
    }

    const { input } = request.data;

    if (!input || typeof input !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Invalid input");
    }

    try {
      const embedding = await getVectorEmbeddingFromOpenAI(input);
      return { embedding };
    } catch (error: any) {
      console.error("Error in getVectorEmbeddings:", error);
      throw new functions.https.HttpsError(
        "internal",
        error.message || "Unknown error"
      );
    }
  }
);

export default {
  analyzePrayerContent,
  getVectorEmbeddings,
};
