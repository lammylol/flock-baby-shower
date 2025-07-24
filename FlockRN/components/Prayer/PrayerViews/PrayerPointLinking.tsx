import { JSX, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  LinkedPrayerEntity,
  LinkedPrayerPointPair,
  PrayerPoint,
  SimilarPrayersPair,
} from '@shared/types/firebaseTypes';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import PrayerCardWithButtons from './PrayerCardWithButtons';
import LinkPrayerModal from './LinkPrayerModal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/ThemedText';
import SearchBar from '@/components/ui/SearchBar';
import SearchPrayerModal from './SearchPrayerModal';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';
import { EntityType } from '@/types/PrayerSubtypes';

export function PrayerPointLinking({
  isEditMode,
  similarPrayerPairs,
  backgroundColor,
  prayerPoint,
  onChange,
  disabled = false,
}: {
  isEditMode?: boolean;
  similarPrayerPairs?: SimilarPrayersPair[];
  backgroundColor?: string;
  prayerPoint: PrayerPoint;
  onChange?: (prayerPoints: PrayerPoint[]) => void;
  disabled?: boolean;
  linkedPrayerPairs?: LinkedPrayerPointPair[];
}): JSX.Element {
  const [selectedLink, setSelectedLink] = useState<LinkedPrayerEntity | null>(
    null,
  );
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const unlinkedTextColor = useThemeColor({}, 'textPrimary');
  const linkedTextColor = useThemeColor({}, 'textOnBackgroundColor');
  const [showLinkSection, setShowLinkSection] = useState(true);
  const linkedBackgroundColor = useThemeColor(
    { dark: Colors.dark.textPrimary },
    'textSecondary',
  );
  const unLinkedBackgroundColor = useThemeColor(
    { dark: Colors.dark.backgroundSecondary },
    'borderPrimary',
  );
  const [showSearchModal, setShowSearchModal] = useState(false);
  const linkedTopicIds = (prayerPoint?.linkedTopics ?? []) as string[];
  const { userPPandTopicsWithContextEmbeddings } =
    usePrayerCollectionWithAuth();

  // Convert topic IDs to full topic objects for display
  const linkedTopics = linkedTopicIds
    .map((topicId) => {
      const topic = userPPandTopicsWithContextEmbeddings.find(
        (t) => t.id === topicId && t.entityType === EntityType.PrayerTopic,
      );
      return topic;
    })
    .filter(Boolean) as LinkedPrayerEntity[];

  const isLinked = (prayer: LinkedPrayerEntity): boolean => {
    return linkedTopicIds.includes(prayer.id);
  };

  const determineLabel = (
    prayer: LinkedPrayerEntity,
  ): { label: string; textColor: string; backgroundColor: string } => {
    return isLinked(prayer)
      ? {
          label: 'Unlink',
          textColor: linkedTextColor,
          backgroundColor: linkedBackgroundColor,
        }
      : {
          label: 'Link',
          textColor: unlinkedTextColor,
          backgroundColor: unLinkedBackgroundColor,
        };
  };

  const updatePrayerPointWithTopic = (
    pointToUpdate: PrayerPoint,
    addedLink?: LinkedPrayerEntity,
    removedLink?: LinkedPrayerEntity,
  ): PrayerPoint => {
    const existingTopicIds = (pointToUpdate.linkedTopics ?? []) as string[];

    const filtered = removedLink
      ? existingTopicIds.filter((topicId) => topicId !== removedLink.id)
      : existingTopicIds;

    const updated = addedLink ? [...filtered, addedLink.id] : filtered;

    return {
      ...pointToUpdate,
      linkedTopics: updated,
    };
  };

  const handleAddTopic = async (
    selectedLink: LinkedPrayerEntity,
    topic?: string,
  ) => {
    const updatedPrayerPoints: PrayerPoint[] = [];
    if (selectedLink.entityType === EntityType.PrayerPoint) {
      if (topic) {
        const updatedPrayerPoint = updatePrayerPointWithTopic(
          selectedLink as PrayerPoint, // point to update
          topic as unknown as LinkedPrayerEntity,
          undefined,
        );
        updatedPrayerPoints.push(updatedPrayerPoint);
      }
      // if the user linked two prayer points, they created the topic already.
      // NEED TO ADD THIS - June 14, 2025.
    }
    if (selectedLink.entityType === EntityType.PrayerTopic) {
      const updatedPrayerPoint = updatePrayerPointWithTopic(
        prayerPoint,
        selectedLink,
        undefined,
      );
      updatedPrayerPoints.push(updatedPrayerPoint);
    }
    if (onChange) {
      onChange(updatedPrayerPoints);
    }
  };

  const similarPrayers = similarPrayerPairs
    ? similarPrayerPairs.map((pair) => pair.similarPrayer)
    : [];

  const handleOpenModal = (prayer: LinkedPrayerEntity) => {
    if (isLinked(prayer)) {
      // If already selected, unlink it
      setSelectedLink(null);
      handleAddTopic(prayer);
      return;
    }

    setShowLinkingModal(true);
    setSelectedLink(prayer);
  };

  const linkIcon = (prayer: LinkedPrayerEntity): string => {
    if (prayer.id === selectedLink?.id) return 'link-outline';
    return 'unlink-outline';
  };

  const renderPrayerCard = (prayer: LinkedPrayerEntity, index: number) => {
    const { label, textColor, backgroundColor } = determineLabel(prayer);
    const button1 = isEditMode
      ? {
          label,
          textColor,
          onPress: () => handleOpenModal(prayer),
          fontWeight: '500' as const,
          icon: (
            <Ionicons
              name={linkIcon(prayer) as keyof typeof Ionicons.glyphMap}
              size={20}
              color={textColor}
            />
          ),
          backgroundColor,
          disabled,
        }
      : undefined;
    return (
      <PrayerCardWithButtons
        key={prayer.id ?? index}
        prayer={prayer}
        {...(button1 ? { button1 } : {})}
      />
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor,
          borderColor: unLinkedBackgroundColor,
        },
      ]}
    >
      <View style={styles.modalHeader}>
        <ThemedText style={{ ...styles.modalTitle, color: unlinkedTextColor }}>
          {linkedTopics.length > 0 ? 'Linked Topics' : 'Add a #Topic'}
        </ThemedText>
        <TouchableOpacity onPress={() => setShowLinkSection(!showLinkSection)}>
          <ThemedText style={{ ...styles.expandTitle, color: Colors.link }}>
            {showLinkSection ? 'Hide' : 'Show'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {linkedTopics.length === 0 && (
        <ThemedText style={{ ...styles.subTitle, color: unlinkedTextColor }}>
          {
            'Search for an existing topic, or create a new topic by linking two prayers together.'
          }
        </ThemedText>
      )}

      {showLinkSection ? (
        <View style={styles.linkContainer}>
          <SearchBar
            placeholder="Search topics and prayers..."
            openModalOnFocus={true}
            onPress={() => {
              setShowSearchModal(true);
            }}
          />
          {linkedTopics.length > 0 ? (
            linkedTopics &&
            linkedTopics.map((prayer, index) => {
              return renderPrayerCard(prayer as LinkedPrayerEntity, index);
            })
          ) : similarPrayers && similarPrayers.length > 0 ? (
            <View style={styles.suggestedContainer}>
              <ThemedText
                style={{ ...styles.suggestedTitle, color: unlinkedTextColor }}
              >
                {linkedTopics.length > 0 ? 'Linked Topics' : 'Suggested:'}
              </ThemedText>
              {similarPrayers!.slice(0, 1).map((prayer, index) => {
                const typedPrayer = prayer as LinkedPrayerEntity;
                return renderPrayerCard(typedPrayer, index);
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Display LinkingModal when showLinkingModal is true */}
      {showLinkingModal && selectedLink && (
        <LinkPrayerModal
          visible={showLinkingModal}
          onClose={() => setShowLinkingModal(false)}
          onAddTopic={(selectedLink, newTopic) => {
            if (newTopic) {
              // must assume that if the user linked two prayer points, they created the topic already.
              // NEED TO ADD THIS - June 14, 2025.
              handleAddTopic(selectedLink, newTopic);
            } else {
              handleAddTopic(selectedLink);
            }
          }}
          originPrayer={selectedLink as LinkedPrayerEntity}
          newPrayerPoint={prayerPoint}
        />
      )}

      {showSearchModal && (
        <SearchPrayerModal
          visible={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          allPrayers={userPPandTopicsWithContextEmbeddings}
          similarPrayers={similarPrayers as LinkedPrayerEntity[]}
          onSelectPrayer={(prayer) => {
            setSelectedLink(prayer as LinkedPrayerEntity);
            setShowSearchModal(false);
            setShowLinkingModal(true);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 16,
  },
  expandTitle: {
    color: Colors.link,
    fontSize: 18,
    fontWeight: '400',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  suggestedContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  container: {
    borderRadius: 15,
    borderWidth: 2,
    padding: 16,
    gap: 10,
    width: '100%', // Make it responsive to parent width
  },
  linkContainer: {
    flex: 1,
    gap: 10,
  },
});

export default PrayerPointLinking;
