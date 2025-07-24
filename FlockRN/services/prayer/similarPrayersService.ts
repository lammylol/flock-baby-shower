import {
  PartialLinkedPrayerEntity,
  PrayerPoint,
  PrayerTopic,
  SimilarPrayersPair,
} from '@shared/types/firebaseTypes';
import OpenAiService from '@/services/ai/openAIService';
import { getEntityType, validateContextFields } from '@/types/typeGuards';
import {
  ISharedPrayerServices,
  sharedPrayerServices,
} from './sharedPrayerServices';
import { Timestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface ISimilarPrayerServices {
  fetchSimilarPrayerPointsBatch(
    prayerPoints: PrayerPoint[],
    userId: string,
  ): Promise<SimilarPrayersPair[]>;

  findRelatedPrayers(
    embedding: number[],
    userId: string,
    sourcePrayerId?: string,
    topK?: number,
  ): Promise<PartialLinkedPrayerEntity[] | []>;

  findRelatedPrayersBatch(
    queryPrayerPoints: { id: string; embedding: number[] }[],
    userId: string,
    sourcePrayerId?: string,
    topK?: number,
  ): Promise<Record<string, PartialLinkedPrayerEntity[]>>;
}

class SimilarPrayersService implements ISimilarPrayerServices {
  private sharedPrayerServices: ISharedPrayerServices;

  constructor(sharedPrayerServices: ISharedPrayerServices) {
    this.sharedPrayerServices = sharedPrayerServices;
  }

  openService = OpenAiService.getInstance();

  // Search suggested prayer points
  async findRelatedPrayers(
    embedding: number[],
    userId: string,
    sourcePrayerId?: string,
    topK: number = 5,
  ): Promise<PartialLinkedPrayerEntity[] | []> {
    try {
      const functions = getFunctions(getApp());
      // Ensure the function is deployed and callable
      const findSimilarPrayers = httpsCallable(functions, 'findSimilarPrayers');
      console.log('fetching similar prayers');
      const result = await findSimilarPrayers({
        ...(sourcePrayerId && { sourcePrayerId }),
        queryEmbedding: embedding,
        topK: topK,
        userId: userId,
      });
      const data = (
        result.data as {
          result: {
            id: string;
            createdAt: Timestamp;
            similarity: number;
            title: string;
            prayerType: string;
            entityType: string;
          }[];
        }
      )?.result;

      return data.map(
        (prayer: {
          id: string;
          createdAt: Timestamp;
          title: string;
          similarity: number;
          prayerType: string;
          entityType: string;
        }) => {
          if (getEntityType(prayer.entityType) === 'prayerTopic') {
            return {
              id: prayer.id,
              createdAt: prayer.createdAt,
              title: prayer.title,
              entityType: prayer.entityType,
              similarity: prayer.similarity,
            } as Partial<PrayerTopic> & { similarity: number };
          } else {
            return {
              id: prayer.id,
              createdAt: prayer.createdAt,
              title: prayer.title,
              prayerType: prayer.prayerType,
              entityType: prayer.entityType,
              similarity: prayer.similarity,
            } as Partial<PrayerPoint> & { similarity: number };
          }
        },
      );
    } catch (error) {
      console.error('Error getting related prayer point:', error);
      return []; // Return an empty array in case of an error
    }
  }

  // Search suggested prayer points for a batch of query embeddings
  async findRelatedPrayersBatch(
    queryPrayerPoints: { id: string; embedding: number[] }[],
    userId: string,
    sourcePrayerId?: string,
    topK: number = 5,
  ): Promise<Record<string, PartialLinkedPrayerEntity[]>> {
    try {
      const functions = getFunctions(getApp());
      const findSimilarPrayers = httpsCallable(
        functions,
        'findSimilarPrayersBatch',
      );

      console.log('Fetching similar prayers (batch)...');

      const response = await findSimilarPrayers({
        userId,
        queryPrayerPoints,
        topK,
        ...(sourcePrayerId && { sourcePrayerId }),
      });

      type MatchResult = {
        queryPrayerPointId: string;
        matches: {
          id: string;
          createdAt: Timestamp;
          similarity: number;
          title: string;
          prayerType: string;
          entityType: string;
        }[];
      };

      const responseData = response.data as {
        result: MatchResult[];
      };

      const rawResults = responseData.result;

      const parsedResults: Record<string, PartialLinkedPrayerEntity[]> = {};

      for (const { queryPrayerPointId, matches } of rawResults) {
        parsedResults[queryPrayerPointId] = matches.map((match) => {
          if (getEntityType(match.entityType) === 'prayerTopic') {
            return {
              id: match.id,
              createdAt: match.createdAt,
              title: match.title,
              entityType: match.entityType,
              similarity: match.similarity,
            } as Partial<PrayerTopic> & { similarity: number };
          } else {
            return {
              id: match.id,
              title: match.title,
              createdAt: match.createdAt,
              prayerType: match.prayerType,
              entityType: match.entityType,
              similarity: match.similarity,
            } as Partial<PrayerPoint> & { similarity: number };
          }
        });
      }
      return parsedResults;
    } catch (error) {
      console.error('Error getting related prayer points batch:', error);
      return {};
    }
  }

  fetchSimilarPrayerPointsBatch = async (
    prayerPoints: PrayerPoint[],
    userId: string,
  ): Promise<SimilarPrayersPair[]> => {
    try {
      // Get embeddings for all prayer points
      const pointsWithEmbeddingData = await Promise.all(
        prayerPoints.map(async (point) => {
          const { contextAsEmbeddings, contextAsStrings } =
            await this.sharedPrayerServices.getEmbeddings(point);

          const isValid = validateContextFields(
            { contextAsEmbeddings, contextAsStrings },
            'update',
          );

          const updatedPoint: PrayerPoint = isValid
            ? {
                ...point,
                ...(contextAsEmbeddings && { contextAsEmbeddings }),
                ...(contextAsStrings && { contextAsStrings }),
              }
            : point;

          return {
            point: updatedPoint,
            embedding: contextAsEmbeddings as number[],
          };
        }),
      );

      // Filter out any with missing embeddings
      const queryPoints = pointsWithEmbeddingData
        .filter((p) => p.embedding?.length)
        .map(({ point, embedding }) => ({
          id: point.id,
          embedding,
        }));
      // Run batch similarity search
      const batchResults = await this.findRelatedPrayersBatch(
        queryPoints,
        userId,
      );

      // Map results back to prayer points
      const results: SimilarPrayersPair[] = [];

      for (const { point } of pointsWithEmbeddingData) {
        const similarPrayers = batchResults[point.id] || [];

        const sorted = similarPrayers.sort(
          (a, b) => (b.similarity ?? 0) - (a.similarity ?? 0),
        );

        sorted.forEach((similarPrayer) => {
          results.push({
            prayerPoint: point,
            similarPrayer,
            similarity: similarPrayer.similarity,
          });
        });
      }

      return results;
    } catch (error) {
      console.error('Error in fetchSimilarPrayerPointsBatch:', error);
      return [];
    }
  };
}

export const similarPrayersService = new SimilarPrayersService(
  sharedPrayerServices,
);
