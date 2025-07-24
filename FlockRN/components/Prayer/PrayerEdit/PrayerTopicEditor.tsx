import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import Button from '@/components/Button';
import { EditMode } from '@/types/ComponentProps';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { complexPrayerOperations } from '@/services/prayer/complexPrayerOperations';
import useAuthContext from '@/hooks/useAuthContext';
import useFormState from '@/hooks/useFormState';
import {
  usePrayerTopicDispatch,
  usePrayerTopicState,
} from '@/context/PrayerTopicContext/PrayerTopicContext';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { EntityType } from '@/types/PrayerSubtypes';
import PrayerContent from '../PrayerViews/PrayerContent';
import { PrayerTopic, Recipient } from '@shared/types/firebaseTypes';
import useUserContext from '@/hooks/useUserContext';
import { submitOperationsService } from '@/services/prayer/submitOperationsService';
import { User } from 'firebase/auth';
import PrayerRecipientSection from '../PrayerViews/RecipientSection';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { DeleteTrashCan } from '@/components/ui/deleteTrashCan';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';

type PrayerTopicEditorProps = {
  id?: string;
  editMode: EditMode;
};

const PrayerTopicEditor: React.FC<PrayerTopicEditorProps> = ({
  id = '',
  editMode = EditMode.CREATE,
}) => {
  const router = useRouter();
  const { userOptInFlags } = useUserContext();
  const { updateCollection, removeFromCollection } =
    usePrayerCollectionWithAuth();

  const user = useAuthContext().user;
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');

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

  const { prayerTopic } = usePrayerTopicState();

  const { loadPrayerTopic, handlePrayerTopicUpdate } = usePrayerTopicDispatch();

  // Memoize the setup function to prevent unnecessary re-renders
  const setupEditor = useCallback(async () => {
    if (!id || !prayerTopic || prayerTopic.id === id || isDeleting) return;

    try {
      setIsDataLoading(true);
      await loadPrayerTopic(id);
    } catch (error) {
      console.error('Error loading prayer point:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, [id, prayerTopic, isDeleting, loadPrayerTopic, setIsDataLoading]);

  // setup editor state and load prayer point data
  useEffect(() => {
    // this guard guarantees no infinite loop.
    if (
      !formState.isEditMode ||
      !id ||
      !prayerTopic ||
      prayerTopic.id === id ||
      isDeleting
    )
      return;

    setupEditor();
  }, [formState.isEditMode, id, isDeleting, prayerTopic, setupEditor]);

  // Memoize the delete handler
  const handleDelete = useCallback(() => {
    if (!prayerTopic || !user?.uid) return;

    Alert.alert(
      'Delete Prayer Topic',
      'Are you sure you want to delete this prayer topic? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              router.replace('/(tabs)/(prayers)');
              router.dismissAll();

              await complexPrayerOperations.deletePrayerTopicAndUnlinkPrayers(
                prayerTopic,
                user.uid,
              );

              if (removeFromCollection) {
                removeFromCollection(prayerTopic.id, 'prayerTopic');
              }

              Alert.alert('Success', 'Prayer topic deleted successfully');
            } catch (error) {
              console.error('Error deleting prayer topic:', error);
              Alert.alert(
                'Error',
                'Failed to delete prayer topic. Please try again.',
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [prayerTopic, user?.uid, router, removeFromCollection]);

  // Memoize the submit handler
  const handleSubmit = useCallback(async () => {
    if (!prayerTopic.title?.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter a title before submitting.',
      );
      return; // Stop submission
    }

    setPrivacy('private');
    setIsSubmissionLoading(true);

    try {
      const newPrayerTopic = await submitOperationsService.submitPrayerTopic(
        prayerTopic,
        user as User,
        userOptInFlags.optInAI,
        editMode,
      );

      if (newPrayerTopic) {
        updateCollection(
          { ...prayerTopic, id: newPrayerTopic.id } as PrayerTopic,
          'prayerTopic',
        );
      }
      Alert.alert('Success', 'Prayer topic submitted successfully!');
      router.replace('/(tabs)/(prayers)');
      router.dismissAll();
    } catch (error) {
      console.error('Error submitting prayer topic:', error);

      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Something went wrong', errorMessage);
      return;
    } finally {
      setIsSubmissionLoading(false);
    }
  }, [
    prayerTopic,
    user,
    userOptInFlags.optInAI,
    editMode,
    setPrivacy,
    setIsSubmissionLoading,
    updateCollection,
    router,
  ]);

  // Memoize the prayer topic update handler
  const handlePrayerTopicChange = useCallback(
    (updatedPrayerTopicData: PrayerTopic) => {
      handlePrayerTopicUpdate(
        updatedPrayerTopicData.id,
        updatedPrayerTopicData,
      );
    },
    [handlePrayerTopicUpdate],
  );

  // Memoize the recipient change handler
  const handleRecipientChange = useCallback(
    (recipients: Recipient[]) => {
      handlePrayerTopicUpdate(prayerTopic.id, {
        ...prayerTopic,
        recipients: recipients,
      });
    },
    [handlePrayerTopicUpdate, prayerTopic],
  );

  // Memoize the default recipients
  const defaultRecipients = useMemo(
    () => [
      {
        name: 'User',
        id: 'unknown',
      },
    ],
    [],
  );

  if (!prayerTopic && editMode === EditMode.EDIT) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={{ color: textColor }}>
          Prayer topic not found.
        </ThemedText>
        <Button label="Go Back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  return (
    <ThemedKeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: formState.isEditMode
            ? 'Edit Prayer Topic'
            : 'Create Prayer Topic',
          headerTitleStyle: styles.headerTitleStyle,
        }}
      />
      {isDeleting ? (
        <View style={styles.deletingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ContentUnavailable
            errorTitle="Deleting Prayer Topic"
            errorMessage="Your prayer topic is being deleted right now."
          />
        </View>
      ) : (
        <ThemedScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.upperContainer}>
            <PrayerContent
              editMode={formState.isEditMode ? EditMode.EDIT : EditMode.CREATE}
              entityType={EntityType.PrayerTopic}
              backgroundColor={backgroundColor}
              onChange={handlePrayerTopicChange}
              prayer={prayerTopic as PrayerTopic}
            />
            {prayerTopic.entityType != EntityType.Prayer && (
              <PrayerRecipientSection
                recipients={prayerTopic.recipients ?? defaultRecipients}
                editMode={
                  formState.isEditMode ? EditMode.EDIT : EditMode.CREATE
                }
                onRecipientChange={handleRecipientChange}
              />
            )}
          </View>
          <Button
            size="l"
            textProps={{
              fontSize: 16,
              fontWeight: '600',
            }}
            label={
              isSubmissionLoading
                ? `${formState.isEditMode ? 'Updating' : 'Creating'}...`
                : `${formState.isEditMode ? 'Update' : 'Create'} Prayer Topic`
            }
            onPress={handleSubmit}
            disabled={isSubmissionLoading}
          />
          {editMode == EditMode.EDIT && !isSubmissionLoading && (
            <DeleteTrashCan
              onPress={handleDelete}
              disabled={isSubmissionLoading}
              alignSelf="flex-end"
            />
          )}
        </ThemedScrollView>
      )}
    </ThemedKeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  deletingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

export default PrayerTopicEditor;
