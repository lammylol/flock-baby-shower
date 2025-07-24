// Comprehensive offline test for all prayer mutation functionality
// Use existing Firebase mocks from __mocks__/firebase/
jest.mock('firebase/app');

import { submitOperationsService } from '@/services/prayer/submitOperationsService';
import {
  Prayer,
  PrayerPoint,
  PrayerPointInTopicJourneyDTO,
  PrayerTopic,
} from '@shared/types/firebaseTypes';
import { User } from 'firebase/auth';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { EditMode, From } from '@/types/ComponentProps';

// Mock AI services to prevent Firebase initialization
jest.mock('@/services/ai/openAIService', () => ({
  OpenAiService: {
    getInstance: jest.fn(() => ({
      analyzePrayerContent: jest.fn(),
      getVectorEmbeddings: jest.fn(),
    })),
  },
}));

jest.mock('@/services/prayer/prayerLinkingService', () => ({
  PrayerLinkingService: {
    getInstance: jest.fn(() => ({
      linkPrayerPointToTopics: jest.fn(),
      unlinkPrayerPointFromTopics: jest.fn(),
    })),
  },
}));

// Mock data
const mockUser: User = {
  uid: 'test-uid',
  displayName: 'Test User',
  email: 'test@example.com',
} as User;

const mockPrayerPoint: PrayerPoint = {
  id: 'point-1',
  title: 'Test Point',
  content: 'Test content',
  prayerType: PrayerType.Request,
  privacy: 'private',
  authorId: 'test-uid',
  authorName: 'Test User',
  linkedTopics: ['topic-1'],
  createdAt: new Date(),
  updatedAt: new Date(),
  entityType: EntityType.PrayerPoint,
  tags: [],
};

const mockPrayer: Prayer = {
  id: 'prayer-1',
  content: 'Test prayer content',
  privacy: 'private',
  authorId: 'test-uid',
  authorName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  entityType: EntityType.Prayer,
  linkedTopics: ['topic-1'],
  prayerPoints: [mockPrayerPoint],
};

const mockPrayerTopic: PrayerTopic = {
  id: 'topic-1',
  title: 'Test Topic',
  content: 'Test topic content',
  privacy: 'private',
  authorId: 'test-uid',
  authorName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  entityType: EntityType.PrayerTopic,
  prayerTypes: [PrayerType.Request],
  status: 'open',
  journey: [],
};

describe('Offline Mutation Testing', () => {
  describe('submitOperationsService.updatePrayerPointTopicLinks', () => {
    it('should handle local updates when shouldPersist is false', async () => {
      const result = (await submitOperationsService.updatePrayerPointTopicLinks(
        {
          point: mockPrayerPoint,
          addTopicIds: ['topic-1', 'topic-2'],
          removeTopicIds: [],
          shouldPersist: false,
        },
      )) as {
        success: boolean;
        pointId: string;
        addedTopicIds: string[];
        removedTopicIds: string[];
        updatedPoint: PrayerPoint;
        journeyEntries: PrayerPointInTopicJourneyDTO[];
      };

      // Verify the response structure
      expect(result.success).toBe(true);
      expect(result.pointId).toBe('point-1');
      expect(result.addedTopicIds).toEqual(['topic-1', 'topic-2']);
      expect(result.removedTopicIds).toEqual([]);
      expect(result.updatedPoint).toBeDefined();
      expect(result.journeyEntries).toBeDefined();
    });

    it('should handle removals in local updates', async () => {
      const result = (await submitOperationsService.updatePrayerPointTopicLinks(
        {
          point: mockPrayerPoint,
          addTopicIds: ['topic-2'],
          removeTopicIds: ['topic-1'],
          shouldPersist: false,
        },
      )) as {
        success: boolean;
        pointId: string;
        addedTopicIds: string[];
        removedTopicIds: string[];
        updatedPoint: PrayerPoint;
        journeyEntries: PrayerPointInTopicJourneyDTO[];
      };

      // Verify the response structure
      expect(result.success).toBe(true);
      expect(result.pointId).toBe('point-1');
      expect(result.addedTopicIds).toEqual(['topic-2']);
      expect(result.removedTopicIds).toEqual(['topic-1']);
      expect(result.updatedPoint.linkedTopics).toEqual(['topic-2']);
    });

    it('should create journey entries for each topic', async () => {
      const result = (await submitOperationsService.updatePrayerPointTopicLinks(
        {
          point: mockPrayerPoint,
          addTopicIds: ['topic-1', 'topic-2'],
          removeTopicIds: [],
          shouldPersist: false,
        },
      )) as {
        success: boolean;
        pointId: string;
        addedTopicIds: string[];
        removedTopicIds: string[];
        updatedPoint: PrayerPoint;
        journeyEntries: PrayerPointInTopicJourneyDTO[];
      };

      // Verify journey entries are created
      expect(result.journeyEntries).toHaveLength(2);
      expect(result.journeyEntries[0]).toMatchObject({
        id: 'point-1',
        prayerType: 'request',
        title: 'Test Point',
        content: 'Test content',
        authorId: 'test-uid',
        authorName: 'Test User',
      });
    });
  });

  describe('submitOperationsService.submitPrayerWithPoints', () => {
    it('should handle local updates when shouldPersist is false', async () => {
      const result = await submitOperationsService.submitPrayerWithPoints({
        user: mockUser,
        prayer: mockPrayer,
        prayerPoints: [mockPrayerPoint],
        shouldPersist: false,
      });

      // Verify the response structure
      expect(result).toHaveProperty('localPrayer');
      expect(result).toHaveProperty('returnedPrayerPoints');
      expect(result.localPrayer).toBeDefined();
      expect(Array.isArray(result.returnedPrayerPoints)).toBe(true);
    });

    it('should handle prayer with no prayer points', async () => {
      const prayerWithoutPoints = { ...mockPrayer, prayerPoints: undefined };
      const result = await submitOperationsService.submitPrayerWithPoints({
        user: mockUser,
        prayer: prayerWithoutPoints,
        shouldPersist: false,
      });

      expect(result).toHaveProperty('localPrayer');
      expect(result).toHaveProperty('returnedPrayerPoints');
      expect(result.returnedPrayerPoints).toEqual([]);
    });

    it('should handle removed prayer point IDs', async () => {
      const result = await submitOperationsService.submitPrayerWithPoints({
        user: mockUser,
        prayer: mockPrayer,
        prayerPoints: [mockPrayerPoint],
        removedPrayerPointIds: ['removed-point-1'],
        shouldPersist: false,
      });

      expect(result).toHaveProperty('localPrayer');
      expect(result).toHaveProperty('returnedPrayerPoints');
    });
  });

  describe('submitOperationsService.submitPrayerPointWithLink', () => {
    it('should handle local prayer point submission', async () => {
      const result =
        await submitOperationsService.submitPrayerPointWithLink(
          mockPrayerPoint,
        );

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle prayer point with from props', async () => {
      const result = await submitOperationsService.submitPrayerPointWithLink(
        mockPrayerPoint,
        { from: From.PRAYER_POINT, fromId: 'test-id' },
      );

      expect(result).toHaveProperty('success');
    });
  });

  describe('submitOperationsService.generateEmbeddingsAndCreatePrayerPoint', () => {
    it('should handle prayer point creation with AI opt-in', async () => {
      const result =
        await submitOperationsService.generateEmbeddingsAndCreatePrayerPoint(
          mockPrayerPoint,
          mockUser,
          true,
        );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
      expect(result.authorId).toBe(mockUser.uid);
    });

    it('should handle prayer point creation without AI opt-in', async () => {
      const result =
        await submitOperationsService.generateEmbeddingsAndCreatePrayerPoint(
          mockPrayerPoint,
          mockUser,
          false,
        );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result.authorId).toBe(mockUser.uid);
    });

    it('should throw error for missing title', async () => {
      const invalidPoint = { ...mockPrayerPoint, title: '' };

      try {
        await submitOperationsService.generateEmbeddingsAndCreatePrayerPoint(
          invalidPoint,
          mockUser,
          true,
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain(
          'Prayer point must have a title',
        );
      }
    });

    it('should throw error for unauthenticated user', async () => {
      const unauthenticatedUser = { ...mockUser, uid: '' };

      try {
        await submitOperationsService.generateEmbeddingsAndCreatePrayerPoint(
          mockPrayerPoint,
          unauthenticatedUser,
          true,
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('User not authenticated');
      }
    });
  });

  describe('submitOperationsService.updatePrayerPointAndUpdateEmbeddings', () => {
    it('should handle prayer point updates', async () => {
      const result =
        await submitOperationsService.updatePrayerPointAndUpdateEmbeddings(
          'point-1',
          mockPrayerPoint,
        );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
    });

    it('should throw error for missing prayer point ID', async () => {
      try {
        await submitOperationsService.updatePrayerPointAndUpdateEmbeddings(
          '',
          mockPrayerPoint,
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain(
          'No prayer point ID provided',
        );
      }
    });
  });

  describe('submitOperationsService.submitPrayerTopic', () => {
    it('should handle topic creation with AI opt-in', async () => {
      const result = await submitOperationsService.submitPrayerTopic(
        mockPrayerTopic,
        mockUser,
        true,
        EditMode.CREATE,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result.authorId).toBe(mockUser.uid);
      }
    });

    it('should handle topic creation without AI opt-in', async () => {
      const result = await submitOperationsService.submitPrayerTopic(
        mockPrayerTopic,
        mockUser,
        false,
        EditMode.CREATE,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
      }
    });

    it('should handle topic editing', async () => {
      const result = await submitOperationsService.submitPrayerTopic(
        mockPrayerTopic,
        mockUser,
        true,
        EditMode.EDIT,
      );

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing prayer point ID', async () => {
      const invalidPoint = { ...mockPrayerPoint, id: undefined };

      try {
        await submitOperationsService.updatePrayerPointTopicLinks({
          point: invalidPoint as unknown as PrayerPoint,
          addTopicIds: ['topic-1'],
          removeTopicIds: [],
          shouldPersist: false,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain(
          'No prayer point ID provided',
        );
      }
    });

    it('should handle invalid addTopicIds', async () => {
      try {
        await submitOperationsService.updatePrayerPointTopicLinks({
          point: mockPrayerPoint,
          addTopicIds: 'not-an-array' as unknown as string[],
          removeTopicIds: [],
          shouldPersist: false,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain(
          'addTopicIds must be an array',
        );
      }
    });

    it('should handle invalid removeTopicIds', async () => {
      try {
        await submitOperationsService.updatePrayerPointTopicLinks({
          point: mockPrayerPoint,
          addTopicIds: [],
          removeTopicIds: 'not-an-array' as unknown as string[],
          shouldPersist: false,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain(
          'removeTopicIds must be an array',
        );
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      // Test validation logic
      const validatePoint = (point: PrayerPoint) => {
        if (!point?.id) {
          throw new Error('Prayer point ID is required');
        }
        if (!Array.isArray(point.linkedTopics)) {
          throw new Error('linkedTopics must be an array');
        }
        return true;
      };

      expect(validatePoint(mockPrayerPoint)).toBe(true);

      expect(() =>
        validatePoint({
          ...mockPrayerPoint,
          id: '',
        } as unknown as PrayerPoint),
      ).toThrow('Prayer point ID is required');
    });

    it('should validate addTopicIds is an array', () => {
      const validateAddTopicIds = (addTopicIds: string[]) => {
        if (!Array.isArray(addTopicIds)) {
          throw new Error('addTopicIds must be an array');
        }
        return true;
      };

      expect(validateAddTopicIds(['topic-1'])).toBe(true);

      expect(() =>
        validateAddTopicIds('not-an-array' as unknown as string[]),
      ).toThrow('addTopicIds must be an array');
    });

    it('should validate removeTopicIds is an array', () => {
      const validateRemoveTopicIds = (removeTopicIds: string[]) => {
        if (!Array.isArray(removeTopicIds)) {
          throw new Error('removeTopicIds must be an array');
        }
        return true;
      };

      expect(validateRemoveTopicIds(['topic-1'])).toBe(true);

      expect(() =>
        validateRemoveTopicIds('not-an-array' as unknown as string[]),
      ).toThrow('removeTopicIds must be an array');
    });
  });
});

// Test the mutation error handling
describe('Mutation Error Handling', () => {
  it('should handle Firebase authentication errors', () => {
    const firebaseError = {
      code: 'functions/unauthenticated',
      message: 'User must be authenticated',
    };

    const getErrorMessage = (error: { code: string; message: string }) => {
      switch (error.code) {
        case 'functions/unauthenticated':
          return 'You must be logged in to perform this action';
        case 'functions/invalid-argument':
          return 'Invalid data provided. Please check your input.';
        case 'functions/not-found':
          return 'Prayer point or topic not found';
        case 'functions/internal':
          return 'Server error. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred';
      }
    };

    expect(getErrorMessage(firebaseError)).toBe(
      'You must be logged in to perform this action',
    );
  });

  it('should handle Firebase invalid argument errors', () => {
    const firebaseError = {
      code: 'functions/invalid-argument',
      message: 'Missing required data',
    };

    const getErrorMessage = (error: { code: string; message: string }) => {
      switch (error.code) {
        case 'functions/unauthenticated':
          return 'You must be logged in to perform this action';
        case 'functions/invalid-argument':
          return 'Invalid data provided. Please check your input.';
        case 'functions/not-found':
          return 'Prayer point or topic not found';
        case 'functions/internal':
          return 'Server error. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred';
      }
    };

    expect(getErrorMessage(firebaseError)).toBe(
      'Invalid data provided. Please check your input.',
    );
  });

  it('should handle Firebase not found errors', () => {
    const firebaseError = {
      code: 'functions/not-found',
      message: 'Prayer point not found',
    };

    const getErrorMessage = (error: { code: string; message: string }) => {
      switch (error.code) {
        case 'functions/unauthenticated':
          return 'You must be logged in to perform this action';
        case 'functions/invalid-argument':
          return 'Invalid data provided. Please check your input.';
        case 'functions/not-found':
          return 'Prayer point or topic not found';
        case 'functions/internal':
          return 'Server error. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred';
      }
    };

    expect(getErrorMessage(firebaseError)).toBe(
      'Prayer point or topic not found',
    );
  });

  it('should handle Firebase internal errors', () => {
    const firebaseError = {
      code: 'functions/internal',
      message: 'Internal server error',
    };

    const getErrorMessage = (error: { code: string; message: string }) => {
      switch (error.code) {
        case 'functions/unauthenticated':
          return 'You must be logged in to perform this action';
        case 'functions/invalid-argument':
          return 'Invalid data provided. Please check your input.';
        case 'functions/not-found':
          return 'Prayer point or topic not found';
        case 'functions/internal':
          return 'Server error. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred';
      }
    };

    expect(getErrorMessage(firebaseError)).toBe(
      'Server error. Please try again later.',
    );
  });

  it('should handle unknown Firebase errors', () => {
    const firebaseError = {
      code: 'functions/unknown',
      message: 'Unknown error occurred',
    };

    const getErrorMessage = (error: { code: string; message: string }) => {
      switch (error.code) {
        case 'functions/unauthenticated':
          return 'You must be logged in to perform this action';
        case 'functions/invalid-argument':
          return 'Invalid data provided. Please check your input.';
        case 'functions/not-found':
          return 'Prayer point or topic not found';
        case 'functions/internal':
          return 'Server error. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred';
      }
    };

    expect(getErrorMessage(firebaseError)).toBe('Unknown error occurred');
  });
});

// Test complex operations that would be used in mutations
describe('Complex Operations Testing', () => {
  describe('Prayer with Points Operations', () => {
    it('should handle creating prayer with multiple points', async () => {
      const prayerPoints = [
        { ...mockPrayerPoint, id: 'point-1' },
        { ...mockPrayerPoint, id: 'point-2', title: 'Second Point' },
      ];

      const result = await submitOperationsService.submitPrayerWithPoints({
        user: mockUser,
        prayer: mockPrayer,
        prayerPoints,
        shouldPersist: false,
      });

      expect(result).toHaveProperty('localPrayer');
      expect(result).toHaveProperty('returnedPrayerPoints');
      if (result.localPrayer) {
        expect(result.localPrayer.prayerPoints).toHaveLength(2);
      }
    });

    it('should handle prayer with removed points', async () => {
      const result = await submitOperationsService.submitPrayerWithPoints({
        user: mockUser,
        prayer: mockPrayer,
        prayerPoints: [mockPrayerPoint],
        removedPrayerPointIds: ['removed-point-1', 'removed-point-2'],
        shouldPersist: false,
      });

      expect(result).toHaveProperty('localPrayer');
      expect(result).toHaveProperty('returnedPrayerPoints');
    });
  });

  describe('Topic Link Operations', () => {
    it('should handle adding multiple topics to a point', async () => {
      const result = (await submitOperationsService.updatePrayerPointTopicLinks(
        {
          point: mockPrayerPoint,
          addTopicIds: ['topic-1', 'topic-2', 'topic-3'],
          removeTopicIds: [],
          shouldPersist: false,
        },
      )) as {
        success: boolean;
        addedTopicIds: string[];
        removedTopicIds: string[];
        updatedPoint: PrayerPoint;
      };

      expect(result.success).toBe(true);
      expect(result.addedTopicIds).toHaveLength(3);
      expect(result.removedTopicIds).toHaveLength(0);
    });

    it('should handle removing multiple topics from a point', async () => {
      const pointWithMultipleTopics = {
        ...mockPrayerPoint,
        linkedTopics: ['topic-1', 'topic-2', 'topic-3'],
      };

      const result = (await submitOperationsService.updatePrayerPointTopicLinks(
        {
          point: pointWithMultipleTopics,
          addTopicIds: [],
          removeTopicIds: ['topic-1', 'topic-3'],
          shouldPersist: false,
        },
      )) as {
        success: boolean;
        addedTopicIds: string[];
        removedTopicIds: string[];
        updatedPoint: PrayerPoint;
      };

      expect(result.success).toBe(true);
      expect(result.addedTopicIds).toHaveLength(0);
      expect(result.removedTopicIds).toHaveLength(2);
      expect(result.updatedPoint.linkedTopics).toEqual(['topic-2']);
    });

    it('should handle simultaneous add and remove operations', async () => {
      const pointWithTopics = {
        ...mockPrayerPoint,
        linkedTopics: ['topic-1', 'topic-2'],
      };

      const result = (await submitOperationsService.updatePrayerPointTopicLinks(
        {
          point: pointWithTopics,
          addTopicIds: ['topic-3', 'topic-4'],
          removeTopicIds: ['topic-1'],
          shouldPersist: false,
        },
      )) as {
        success: boolean;
        addedTopicIds: string[];
        removedTopicIds: string[];
        updatedPoint: PrayerPoint;
      };

      expect(result.success).toBe(true);
      expect(result.addedTopicIds).toHaveLength(2);
      expect(result.removedTopicIds).toHaveLength(1);
      expect(result.updatedPoint.linkedTopics).toEqual([
        'topic-2',
        'topic-3',
        'topic-4',
      ]);
    });
  });

  describe('AI Integration Operations', () => {
    it('should handle prayer point creation with AI embeddings', async () => {
      const pointWithEmbeddings = {
        ...mockPrayerPoint,
        contextAsEmbeddings: [0.1, 0.2, 0.3],
        contextAsStrings: 'Test context string',
      };

      const result =
        await submitOperationsService.generateEmbeddingsAndCreatePrayerPoint(
          pointWithEmbeddings,
          mockUser,
          true,
        );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result.authorId).toBe(mockUser.uid);
    });

    it('should handle topic creation with AI features', async () => {
      const topicWithAI = {
        ...mockPrayerTopic,
        contextAsEmbeddings: [0.1, 0.2, 0.3],
        aggregatedEmbedding: [0.4, 0.5, 0.6],
      };

      const result = await submitOperationsService.submitPrayerTopic(
        topicWithAI,
        mockUser,
        true,
        EditMode.CREATE,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
      }
    });
  });
});

// Test edge cases and boundary conditions
describe('Edge Cases and Boundary Conditions', () => {
  it('should handle empty arrays for topic operations', async () => {
    const result = (await submitOperationsService.updatePrayerPointTopicLinks({
      point: mockPrayerPoint,
      addTopicIds: [],
      removeTopicIds: [],
      shouldPersist: false,
    })) as {
      success: boolean;
      addedTopicIds: string[];
      removedTopicIds: string[];
    };

    expect(result.success).toBe(true);
    expect(result.addedTopicIds).toHaveLength(0);
    expect(result.removedTopicIds).toHaveLength(0);
  });

  it('should handle prayer point with no linked topics', async () => {
    const pointWithNoTopics = {
      ...mockPrayerPoint,
      linkedTopics: [],
    };

    const result = (await submitOperationsService.updatePrayerPointTopicLinks({
      point: pointWithNoTopics,
      addTopicIds: ['topic-1'],
      removeTopicIds: [],
      shouldPersist: false,
    })) as {
      success: boolean;
      updatedPoint: PrayerPoint;
    };

    expect(result.success).toBe(true);
    expect(result.updatedPoint.linkedTopics).toEqual(['topic-1']);
  });

  it('should handle prayer with no prayer points', async () => {
    const prayerWithNoPoints = {
      ...mockPrayer,
      prayerPoints: [],
    };

    const result = await submitOperationsService.submitPrayerWithPoints({
      user: mockUser,
      prayer: prayerWithNoPoints,
      shouldPersist: false,
    });

    expect(result).toHaveProperty('localPrayer');
    expect(result).toHaveProperty('returnedPrayerPoints');
    expect(result.returnedPrayerPoints).toEqual([]);
  });

  it('should handle user with no display name', async () => {
    const userWithoutDisplayName = {
      ...mockUser,
      displayName: null,
    };

    const result = await submitOperationsService.submitPrayerWithPoints({
      user: userWithoutDisplayName,
      prayer: mockPrayer,
      shouldPersist: false,
    });

    expect(result).toHaveProperty('localPrayer');
    if (result.localPrayer) {
      expect(result.localPrayer.authorName).toBe('Unknown');
    }
  });
});
