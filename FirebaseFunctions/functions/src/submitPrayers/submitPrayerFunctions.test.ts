// submitPrayerFunctions.test.js
import { jest, describe, beforeEach, it, expect, afterAll, beforeAll } from "@jest/globals";
import { config } from '../config';
import fft from 'firebase-functions-test';
import * as myFunctions from './submitPrayerFunctions';
import { setupFirebaseAdminMock } from '../_mocks_/mockFirebaseAdmin';
import { testPrayerNew, testPrayerPointNew, testPrayerPoints, testPrayerTopic, testPrayerTopic2, testPrayer } from '../_mocks_/mockData';
import { db } from '../firebase/firebaseConfig';

// Setup Firebase Admin mock
setupFirebaseAdminMock();

const fftInstance = fft();
const testUid = config.testUid;

describe("submitPrayerFunctions", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe("submitPrayerWithPoints", () => {
    beforeAll(async () => {
      await db.collection('prayerTopics').doc(testPrayerTopic.id).set(testPrayerTopic);
    });

    afterAll(async () => {
      await db.collection('prayerTopics').doc(testPrayerTopic.id).delete();
      await db.collection('prayerPoints').doc(testPrayerPointNew.id).delete();
      await db.collection('prayers').doc(testPrayerNew.id).delete();
    });

    it("should submit a prayer with points (create)", async () => {
      const wrapped = fftInstance.wrap(myFunctions.submitPrayerWithPoints);
      const request = {
        data: {
          prayer: testPrayerNew,
          prayerPoints: [testPrayerPointNew],
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      // Get the updated prayer document from Firestore after update
      const updatedPrayerSnap = await db.collection('prayers').doc(result.prayerId).get();
      const updatedPrayer = updatedPrayerSnap.exists ? updatedPrayerSnap.data() : null;

      expect(result.success).toBe(true);
      expect(result.prayerId).toBeDefined();
      expect(result.prayerPoints).toBeDefined();
      expect(result.prayerPoints.length).toBe(1);
      expect(updatedPrayer?.prayerPoints).toBeDefined();
      expect(updatedPrayer?.prayerPoints.length).toBe(1);
      expect(updatedPrayer?.prayerPoints[0].id).toBe(testPrayerPointNew.id);
    });

    it("should submit a prayer with points (update)", async () => {
      const updatedPrayerSnapBefore = await db.collection('prayers').doc(testPrayerNew.id).get();
      const updatedPrayerBefore = updatedPrayerSnapBefore.exists ? updatedPrayerSnapBefore.data() : null;
      console.log('updatedPrayerBefore', updatedPrayerBefore);
      const wrapped = fftInstance.wrap(myFunctions.submitPrayerWithPoints);
      const request = {
        data: {
          prayer: testPrayerNew,
          prayerPoints: [testPrayerPointNew],
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      // Get the updated prayer document from Firestore after update
      const updatedPrayerSnap = await db.collection('prayers').doc(result.prayerId).get();
      const updatedPrayer = updatedPrayerSnap.exists ? updatedPrayerSnap.data() : null;

      expect(result.success).toBe(true);
      expect(result.prayerId).toBeDefined();
      expect(result.prayerPoints).toBeDefined();
      expect(result.prayerPoints.length).toBe(1);
      expect(updatedPrayer?.prayerPoints).toBeDefined();
      expect(updatedPrayer?.prayerPoints.length).toBe(1);
      expect(updatedPrayer?.prayerPoints[0].id).toBe(testPrayerPointNew.id);
    });

    it("should submit a prayer with points (update with no points)", async () => {
      const wrapped = fftInstance.wrap(myFunctions.submitPrayerWithPoints);
      const request = {
        data: {
          prayer: testPrayerNew,
          prayerPoints: [],
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
      expect(result.prayerId).toBeDefined();
      expect(result.prayerPoints).toBeDefined();
      expect(result.prayerPoints.length).toBe(0);
    });
  });

  describe("submitPrayerPointWithLink", () => {
    afterAll(async () => {
      await db.collection('prayerPoints').doc(testPrayerPointNew.id).delete();
    });

    it("should submit a prayer point with link (create)", async () => {
      const wrapped = fftInstance.wrap(myFunctions.submitPrayerPointWithLink);
      const request = {
        data: {
          point: testPrayerPointNew,
          from: { from: "prayerTopic", fromId: testPrayerTopic.id },
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
      expect(result.updatedPoint).toBeDefined();
      expect(result.updatedPoint.authorId).toBe(testUid);
    });

    it("should submit a prayer point with link (update)", async () => {
      const wrapped = fftInstance.wrap(myFunctions.submitPrayerPointWithLink);
      const request = {
        data: {
          point: {
            id: testPrayerPointNew.id,
            title: "Point",
            contextAsEmbeddings: [0.1, 0.2],
            dummy: true,
          },
          from: { from: "prayerTopic", fromId: testPrayerTopic.id },
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
      expect(result.updatedPoint).toBeDefined();
      expect(result.updatedPoint.id).toBe(testPrayerPointNew.id);
    });

    it("should remove from previous link if removeFrom is provided", async () => {
      const wrapped = fftInstance.wrap(myFunctions.submitPrayerPointWithLink);
      const request = {
        data: {
          point: {
            id: testPrayerPointNew.id,
            title: "Point",
            contextAsEmbeddings: [0.1, 0.2],
            dummy: true,
          },
          removeFrom: { from: "prayerTopic", fromId: testPrayerTopic.id },
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
    });

    it("should throw unauthenticated if no auth", async () => {
      const wrapped = fftInstance.wrap(myFunctions.submitPrayerPointWithLink);
      const request = {
        data: {
          point: { title: "Point", dummy: true },
        },
      } as any;
      await expect(wrapped(request)).rejects.toThrow(
        "User must be authenticated"
      );
    });
  });

  describe("updatePrayerPointTopicLinks", () => {
    beforeAll(async () => {
      await db.collection('prayerPoints').doc(testPrayerPoints[0].id).set(testPrayerPoints[0]);
      await db.collection('prayerTopics').doc(testPrayerTopic.id).set(testPrayerTopic);
      await db.collection('prayerTopics').doc(testPrayerTopic2.id).set(testPrayerTopic2);
    });

    afterAll(async () => {
      await db.collection('prayerPoints').doc(testPrayerPoints[0].id).delete();
      await db.collection('prayerTopics').doc(testPrayerTopic.id).delete();
      await db.collection('prayerTopics').doc(testPrayerTopic2.id).delete();
    });

    it("should update prayer point topic links", async () => {
      const wrapped = fftInstance.wrap(myFunctions.updatePrayerPointTopicLinks);
      const request = {
        data: {
          point: testPrayerPoints[0],
          addTopicIds: [testPrayerTopic.id],
          removeTopicIds: [],
          // removeTopicIds: [testPrayerTopic2.id],
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
      expect(result.pointId).toBe(testPrayerPoints[0].id);
      expect(result.addedTopicIds).toContain(testPrayerTopic.id);
      expect(result.addedTopicIds).not.toContain(testPrayerTopic2.id);
    });

    it("should throw if missing uid or pointId", async () => {
      const wrapped = fftInstance.wrap(myFunctions.updatePrayerPointTopicLinks);
      const request = {
        data: {
          addTopics: [],
          removeTopicIds: [],
        },
        auth: { uid: undefined },
      } as any;
      await expect(wrapped(request)).rejects.toThrow("Missing required data");
    });
  });

  describe("deleteEntity", () => {
    beforeAll(async () => {
      await db.collection('prayers').doc(testPrayer.id).set(testPrayer);
    });

    it("should delete a prayer entity", async () => {
      const wrapped = fftInstance.wrap(myFunctions.deleteEntity);
      const request = {
        data: {
          entityType: "prayer",
          entityId: testPrayer.id,
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
      expect(result.entityId).toBe(testPrayer.id);
    });

    it("should delete a prayerPoint entity", async () => {
      const wrapped = fftInstance.wrap(myFunctions.deleteEntity);
      const request = {
        data: {
          entityType: "prayerPoint",
          entityId: testPrayerPoints[0].id,
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
      expect(result.entityId).toBe(testPrayerPoints[0].id);
    });

    it("should delete a prayerTopic entity", async () => {
      const wrapped = fftInstance.wrap(myFunctions.deleteEntity);
      const request = {
        data: {
          entityType: "prayerTopic",
          entityId: testPrayerTopic.id,
        },
        auth: { uid: testUid },
      } as any;
      const result = await wrapped(request);
      expect(result.success).toBe(true);
      expect(result.entityId).toBe(testPrayerTopic.id);
    });

    it("should throw unauthenticated if no auth", async () => {
      const wrapped = fftInstance.wrap(myFunctions.deleteEntity);
      const request = {
        data: {
          entityType: "prayer",
          entityId: testPrayer.id,
        },
      } as any;
      await expect(wrapped(request)).rejects.toThrow(
        "User must be authenticated"
      );
    });

    it("should throw if invalid entity type", async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      const wrapped = fftInstance.wrap(myFunctions.deleteEntity);
      const request = {
        data: {
          entityType: "invalidType",
          entityId: "some-id",
        },
        auth: { uid: testUid },
      } as any;
      await expect(wrapped(request)).rejects.toThrow("Failed to delete entity");// this is the expected error message.
      consoleSpy.mockRestore();
    });
  });
});
