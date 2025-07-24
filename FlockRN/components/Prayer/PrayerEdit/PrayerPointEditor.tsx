import { useEffect } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { EntityType } from '@/types/PrayerSubtypes';
import PrayerPointLinking from '@/components/Prayer/PrayerViews/PrayerPointLinking';
import {
  EditMode,
  From,
  FromProps,
  PrayerContextType,
} from '@/types/ComponentProps';
import { usePrayerLinking } from '@/hooks/prayerScreens/usePrayerLinking';
import useFormState from '@/hooks/useFormState';
import { auth } from '@/firebase/firebaseConfig';
import { LinkedPrayerEntity } from '@shared/types/firebaseTypes';
import {
  useDynamicPrayerState,
  useDynamicPrayerDispatch,
} from '@/context/useDynamicPrayerContext';
import Button from '@/components/Button';
import { prayerTopicService } from '@/services/prayer/prayerTopicService';
import { DeleteTrashCan } from '@/components/ui/deleteTrashCan';
import { useSubmitPrayerPointAndLinkToTopics } from '@/hooks/reactQuery/submitMutations';
import { NavigationUtils } from '@/utils/navigation';

interface PrayerPointEditorProps {
  editMode: EditMode;
  from: FromProps;
}

export default function PrayerPointEditor(props: PrayerPointEditorProps) {
  const { editMode, from } = props;

  const prayerContextType =
    from.from === From.PRAYER
      ? PrayerContextType.EDITFROMPRAYER
      : PrayerContextType.EDIT;

  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated');
  }

  // State for edit mode
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  // This hook handles the prayer point creation and update logic
  // and manages the state of the prayer point being created or edited.
  const {
    formState,
    isSubmissionLoading,
    setIsDataLoading,
    setIsSubmissionLoading,
    setPrivacy,
  } = useFormState({
    editMode: editMode,
  });

  // handle prayer functions and state within local context
  const { prayerPoint, linkedPrayerPairs, similarPrayerPairs } =
    useDynamicPrayerState(prayerContextType, user, from.fromId);

  const { load, handlePrayerPointUpdate, removePrayerPointLocally } =
    useDynamicPrayerDispatch(prayerContextType);

  // // This hook handles separate logic for linking prayer points and topics.
  const { handlePrayerLinkingOnChange } = usePrayerLinking(
    prayerContextType,
    user,
  );
  // Firebase updates + mutations∂
  const submitPrayerPointWithLink = useSubmitPrayerPointAndLinkToTopics();

  // setup editor state and load prayer point data
  useEffect(() => {
    // this guard guarantees no infinite loop.
    if (
      !formState.isEditMode ||
      !from.fromId ||
      !prayerPoint ||
      prayerPoint.id === from.fromId
    )
      return;

    const setup = async () => {
      try {
        setIsDataLoading(true);
        await load(from.fromId);
      } catch (error) {
        console.error('Error loading prayer point:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    setup();
  }, [
    formState.isEditMode,
    from.fromId,
    load,
    setIsDataLoading,
    editMode,
    prayerPoint,
  ]);

  useEffect(() => {
    if (prayerPoint?.linkedTopics && prayerPoint.linkedTopics.length > 0)
      return;

    const handleFrom = async () => {
      if (from.from === From.PRAYER_TOPIC && from.fromId) {
        const prayerTopic = await prayerTopicService.getPrayerTopic(
          from.fromId,
        );
        handlePrayerLinkingOnChange(
          prayerPoint,
          prayerTopic as LinkedPrayerEntity,
          prayerContextType,
          prayerTopic?.title,
        );
      }
    };

    handleFrom();
  }, [
    from.from,
    from.fromId,
    prayerPoint,
    prayerContextType,
    handlePrayerLinkingOnChange,
  ]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a prayer point');
      return;
    }

    if (!prayerPoint) {
      Alert.alert('Error', 'Prayer point data is missing. Please try again.');
      return;
    }

    setPrivacy('private');
    setIsSubmissionLoading(true);

    try {
      if (formState.isEditMode) {
        submitPrayerPointWithLink.submitPoint({
          point: prayerPoint,
          action: 'update',
        });
        Alert.alert('Success', 'Prayer point updated successfully');
        NavigationUtils.back();
        return;
      }

      submitPrayerPointWithLink.submitPoint({
        point: prayerPoint,
        action: 'create',
      });

      Alert.alert('Success', 'Prayer point created successfully');
      NavigationUtils.back();
    } catch (error) {
      console.error(
        `Error ${formState.isEditMode ? 'updating' : 'creating'} prayer point:`,
        error,
      );
      Alert.alert(
        'Error',
        `Failed to ${formState.isEditMode ? 'update' : 'create'} prayer point. Please try again.`,
      );
    } finally {
      setIsSubmissionLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmissionLoading(true);
    try {
      if (prayerContextType === PrayerContextType.EDITFROMPRAYER) {
        removePrayerPointLocally(prayerPoint.id);
        NavigationUtils.back();
      } else {
        submitPrayerPointWithLink.submitPoint({
          point: prayerPoint,
          action: 'delete',
        });
        NavigationUtils.resetAndNavigate('/(tabs)/(prayers)');
      }
    } catch (error) {
      console.error('Error deleting prayer point:', error);
      NavigationUtils.back();
    } finally {
      setIsSubmissionLoading(false);
    }
  };

  return (
    <ThemedKeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust if needed
    >
      <Stack.Screen
        options={{
          title: formState.isEditMode
            ? 'Edit Prayer Point'
            : 'Add Prayer Point',
          headerTitleStyle: styles.headerTitleStyle,
        }}
      />
      <ThemedScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.upperContainer}>
          <PrayerContent
            editMode={formState.isEditMode ? EditMode.EDIT : EditMode.CREATE}
            entityType={EntityType.PrayerPoint}
            backgroundColor={colorScheme}
            onChange={(updatedPrayerPointData) => {
              handlePrayerPointUpdate(
                updatedPrayerPointData.id,
                updatedPrayerPointData,
              );
            }}
            prayer={prayerPoint}
          />

          <PrayerPointLinking
            isEditMode={true}
            similarPrayerPairs={similarPrayerPairs}
            prayerPoint={prayerPoint}
            onChange={(prayerPoints) => {
              prayerPoints.forEach((prayerPoint) => {
                handlePrayerPointUpdate(prayerPoint.id, prayerPoint);
              });
            }}
            linkedPrayerPairs={linkedPrayerPairs}
          />
        </View>
        {prayerContextType != PrayerContextType.EDITFROMPRAYER && (
          <Button
            size="l"
            textProps={{
              fontSize: 16,
              fontWeight: '600',
            }}
            label={
              isSubmissionLoading
                ? `${formState.isEditMode ? 'Updating' : 'Creating'}...`
                : `${formState.isEditMode ? 'Update' : 'Create'} Prayer Point`
            }
            onPress={handleSubmit}
            disabled={isSubmissionLoading}
          />
        )}
        {editMode === EditMode.EDIT && !isSubmissionLoading && (
          <DeleteTrashCan onPress={handleDelete} alignSelf="flex-end" />
        )}
      </ThemedScrollView>
    </ThemedKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '500',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    gap: 20,
  },
  upperContainer: {
    flexGrow: 1,
    gap: 20,
  },
});
