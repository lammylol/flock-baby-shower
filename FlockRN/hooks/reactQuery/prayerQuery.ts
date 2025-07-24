import { useQuery } from '@tanstack/react-query';
import { db } from '@/firebase/firebaseConfig';
import { getDocs, collection, getDoc, doc } from 'firebase/firestore';
import { Prayer, PrayerPoint, PrayerTopic } from '@shared/types/firebaseTypes';

// === PRAYERS ===
export const usePrayers = () => {
  return useQuery<Prayer[]>({
    queryKey: ['prayers'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'prayers'));
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Prayer);
    },
  });
};

export const usePrayer = (id: string) => {
  return useQuery<Prayer>({
    queryKey: ['prayer', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'prayers', id));
      return { id: snap.id, ...snap.data() } as Prayer;
    },
  });
};

// === PRAYER POINTS ===
export const usePrayerPoints = (prayerId: string) => {
  return useQuery<PrayerPoint[]>({
    queryKey: ['prayerPoints', prayerId],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'prayers', prayerId, 'points'));
      return snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as PrayerPoint,
      );
    },
  });
};

// === PRAYER TOPICS ===
export const usePrayerTopics = () => {
  return useQuery<PrayerTopic[]>({
    queryKey: ['prayerTopics'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'prayerTopics'));
      return snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as PrayerTopic,
      );
    },
  });
};
