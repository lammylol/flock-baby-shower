import { deleteField, FieldValue, Timestamp } from 'firebase/firestore';
import OpenAiService from '../ai/openAIService';
import { PrayerPoint } from '@shared/types/firebaseTypes';
import { getDateString } from '@/utils/dateUtils';

type ContextFields = {
  contextAsEmbeddings?: number[] | FieldValue;
  contextAsStrings?: string | FieldValue;
};

export interface ISharedPrayerServices {
  getContextFieldsIfEmbeddingsExist(
    embeddings: number[] | undefined,
    contextString: string | undefined,
    isNewPrayerPoint: boolean,
  ): ContextFields;
  getEmbeddings(prayerPoint: PrayerPoint): Promise<ContextFields>;
}

class SharedPrayerServices implements ISharedPrayerServices {
  getContextFieldsIfEmbeddingsExist(
    embeddings: number[] | undefined,
    contextString: string | undefined,
    isNewPrayerPoint: boolean,
  ): ContextFields {
    if (embeddings == undefined || embeddings.length === 0) {
      return {
        // deleteField() is used to remove the field from Firestore. if not, undefined doesn't load anything.
        contextAsEmbeddings: isNewPrayerPoint ? undefined : deleteField(),
        contextAsStrings: isNewPrayerPoint ? undefined : deleteField(),
      };
    }
    return {
      contextAsEmbeddings: embeddings,
      contextAsStrings:
        typeof contextString === 'string' && contextString.trim()
          ? contextString.trim()
          : deleteField(),
    };
  }

  async getEmbeddings(prayerPoint: PrayerPoint): Promise<ContextFields> {
    const openAiService = OpenAiService.getInstance();

    let contextAsEmbeddings =
      (prayerPoint.contextAsEmbeddings as number[]) || undefined;
    let contextAsStrings = prayerPoint.contextAsStrings || undefined;

    if (!contextAsEmbeddings) {
      const dateStr = prayerPoint.createdAt
        ? getDateString(prayerPoint.createdAt)
        : getDateString(Timestamp.now());

      contextAsStrings =
        `${dateStr}, ${prayerPoint.title}, ${prayerPoint.content}`.trim();

      contextAsEmbeddings =
        await openAiService.getVectorEmbeddings(contextAsStrings);

      // You may want to persist this back into the prayerPoint object
      return {
        contextAsEmbeddings,
        contextAsStrings,
      };
    }

    // Return existing values if embeddings already exist
    return {
      contextAsEmbeddings,
      contextAsStrings,
    };
  }
}

export const sharedPrayerServices = new SharedPrayerServices();
