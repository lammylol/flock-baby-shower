import { PrayerTopic } from '@shared/types/firebaseTypes';
import { IPrayerPointsService, prayerPointService } from './prayerPointService';
import { IPrayerService, prayerService } from './prayerService';
import OpenAiService from '@/services/ai/openAIService';
import { IPrayerTopicService, prayerTopicService } from './prayerTopicService';

export interface IComplexPrayerOperations {
  deletePrayerPointAndUnlinkPrayers(
    prayerPointId: string,
    authorId: string,
  ): Promise<void>;

  deletePrayerTopicAndUnlinkPrayers(
    prayerTopic: PrayerTopic,
    authorId: string,
  ): Promise<void>;
}

class ComplexPrayerOperations implements IComplexPrayerOperations {
  private prayerService: IPrayerService;
  private prayerPointService: IPrayerPointsService;
  private prayerTopicService: IPrayerTopicService;

  constructor(
    prayerService: IPrayerService,
    prayerPointService: IPrayerPointsService,
    prayerTopicService: IPrayerTopicService,
  ) {
    this.prayerService = prayerService;
    this.prayerPointService = prayerPointService;
    this.prayerTopicService = prayerTopicService;
  }

  openService = OpenAiService.getInstance();

  deletePrayerPointAndUnlinkPrayers = async (
    prayerPointId: string,
    authorId: string,
  ): Promise<void> => {
    try {
      const deletedPrayerPoint =
        await this.prayerPointService.deletePrayerPoint(
          prayerPointId,
          authorId,
        );

      if (deletedPrayerPoint.prayerId) {
        const prayerIds = Array.isArray(deletedPrayerPoint.prayerId)
          ? deletedPrayerPoint.prayerId
          : [deletedPrayerPoint.prayerId];

        for (const id of prayerIds) {
          const prayer = await this.prayerService.getPrayer(id);
          if (
            prayer &&
            prayer.prayerPoints &&
            prayer.prayerPoints.includes(prayerPointId)
          ) {
            const updatedPrayerPoints = prayer.prayerPoints.filter(
              (pid) => pid !== prayerPointId,
            );
            await this.prayerService.updatePrayer(id, {
              prayerPoints: updatedPrayerPoints,
            });
          }
        }
      }
    } catch (error) {
      console.error(
        'Error deleting prayer point and unlinking prayers:',
        error,
      );
      throw error;
    }
  };

  deletePrayerTopicAndUnlinkPrayers = async (
    prayerTopic: PrayerTopic,
    authorId: string,
  ): Promise<void> => {
    try {
      await this.prayerTopicService.deletePrayerTopic(prayerTopic, authorId);
    } catch (error) {
      console.error(
        'Error deleting prayer topic and unlinking prayers:',
        error,
      );
      throw error;
    }
  };
}

export const complexPrayerOperations = new ComplexPrayerOperations(
  prayerService,
  prayerPointService,
  prayerTopicService,
);
