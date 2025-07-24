/**
 * OpenAiService - Cloud Functions implementation
 * This replaces the direct OpenAI API usage with Firebase Cloud Functions
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { PrayerType } from '@/types/PrayerSubtypes';
import { FirebaseError, getApp } from '@firebase/app';
import { PrayerPoint } from '@shared/types/firebaseTypes';

interface AIAnalysis {
  title: string;
  cleanedTranscription?: string;
  tags: PrayerType[];
  prayerPoints: PrayerPoint[];
}

interface VectorEmbeddingsResponse {
  embedding: number[];
}

export default class OpenAiService {
  private static instance: OpenAiService;
  private functions: ReturnType<typeof getFunctions>;

  // Private constructor ensures that this class cannot be instantiated directly
  private constructor() {
    // Get the Firebase Functions instance
    this.functions = getFunctions(getApp());
  }

  // Method to get the singleton instance
  public static getInstance(): OpenAiService {
    if (!OpenAiService.instance) {
      OpenAiService.instance = new OpenAiService();
    }
    return OpenAiService.instance;
  }

  /**
   * Analyze prayer content using OpenAI via Cloud Functions
   * @param content - The prayer content to analyze
   * @param hasTranscription - Whether the content is a transcription that needs cleaning
   * @param isAiEnabled - Whether AI features are enabled
   * @returns Analysis result
   */
  async analyzePrayerContent(
    content: string,
    hasTranscription: boolean = false,
    isAiEnabled: boolean = true,
    maxPrayerPoints: number = 10,
  ): Promise<AIAnalysis> {
    if (!isAiEnabled) {
      console.warn(
        'AI service is disabled. Please fill in the details manually.',
      );
      return {
        title: '',
        cleanedTranscription: hasTranscription ? '' : undefined,
        tags: [],
        prayerPoints: [],
      };
    }

    if (!content?.trim()) {
      throw new Error('No prayer content provided');
    }

    try {
      const analyzePrayer = httpsCallable<
        { content: string; hasTranscription: boolean; maxPrayerPoints: number },
        AIAnalysis
      >(this.functions, 'analyzePrayerContent');

      const result = await analyzePrayer({
        content,
        hasTranscription,
        maxPrayerPoints,
      });

      return result.data;
    } catch (error) {
      console.error('Error in analyzePrayerContent:', error);
      throw this.handleCloudFunctionError(error as FirebaseError, 'AI');
    }
  }

  /**
   * Get vector embeddings using OpenAI via Cloud Functions
   * @param input - The text to get embeddings for
   * @returns Vector embeddings
   */
  async getVectorEmbeddings(input: string): Promise<number[]> {
    if (!input?.trim()) {
      throw new Error('No input provided');
    }

    try {
      const getEmbeddings = httpsCallable<
        { input: string },
        VectorEmbeddingsResponse
      >(this.functions, 'getVectorEmbeddings');

      const result = await getEmbeddings({ input });
      return result.data.embedding;
    } catch (error) {
      console.error('Error while retrieving embeddings:', error);
      throw this.handleCloudFunctionError(error as FirebaseError, 'vector');
    }
  }

  /**
   * Handle errors from cloud functions in a consistent way
   * @param error - The error object
   * @param context - The context of the error ('AI' or 'vector')
   */
  private handleCloudFunctionError(
    error: FirebaseError,
    context: 'AI' | 'vector',
  ): Error {
    // Check for Firebase Functions specific error format
    if (error.code && typeof error.code === 'string') {
      // Handle Firebase function errors
      switch (error.code) {
        case 'functions/resource-exhausted':
          return new Error(
            `${context} service is temporarily unavailable. Please try again later.`,
          );
        case 'functions/unauthenticated':
          return new Error(
            `Authentication error with ${context} service. Please try again later.`,
          );
        case 'functions/invalid-argument':
          return new Error(`Invalid input provided to ${context} service.`);
        default:
          return new Error(
            `${context} service error. Please try again later. (${error.code})`,
          );
      }
    }

    // Extract Firebase message if available
    if (error.message) {
      return new Error(`${context} service error: ${error.message}`);
    }

    // If it's not a recognized Firebase error, return a generic error
    return new Error(`${context} service error. Please try again later.`);
  }
}
