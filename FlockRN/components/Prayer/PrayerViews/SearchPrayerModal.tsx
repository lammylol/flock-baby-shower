// components/SearchPrayerModal.tsx

import React, { useState, useEffect } from 'react';
import { SearchModal } from '@/components/ui/SearchModal';
import { LinkedPrayerEntity } from '@shared/types/firebaseTypes';
import PrayerCard from './PrayerCard';

interface SearchPrayerModalProps {
  visible: boolean;
  onClose: () => void;
  allPrayers: LinkedPrayerEntity[];
  similarPrayers: LinkedPrayerEntity[];
  onSelectPrayer: (prayer: LinkedPrayerEntity) => void;
}

const SearchPrayerModal: React.FC<SearchPrayerModalProps> = ({
  visible,
  onClose,
  allPrayers,
  similarPrayers,
  onSelectPrayer,
}) => {
  const [query, setQuery] = useState('');
  const [filteredPrayers, setFilteredPrayers] = useState<LinkedPrayerEntity[]>(
    [],
  );

  useEffect(() => {
    const lowerQuery = query.toLowerCase();

    const source = query.length > 0 ? allPrayers : similarPrayers;

    const results = source.filter((prayer) =>
      prayer.title.toLowerCase().includes(lowerQuery),
    );

    setFilteredPrayers(results);
  }, [query, allPrayers, similarPrayers]);

  useEffect(() => {
    if (visible) {
      setQuery(''); // Reset when modal opens
    }
  }, [visible]);

  const handleSelectPrayer = (prayer: LinkedPrayerEntity) => {
    onSelectPrayer(prayer);
    setQuery('');
    onClose();
  };

  return (
    // to add: June 28. Separate prayer cards by groups: prayer topics, or unlinked prayer points
    <SearchModal<LinkedPrayerEntity>
      visible={visible}
      onClose={onClose}
      setSearchQuery={setQuery}
      results={filteredPrayers}
      renderItem={(prayer) => (
        <PrayerCard
          prayer={prayer}
          showContent={false}
          maxLines={1}
          onPress={() => {
            handleSelectPrayer(prayer);
          }}
        />
      )}
      placeholder="Search topics and prayers..."
      title="Select Topic or Prayer to Link"
    />
  );
};

export default SearchPrayerModal;
