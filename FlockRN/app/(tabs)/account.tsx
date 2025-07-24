import { Alert, StyleSheet, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { auth } from '@/firebase/firebaseConfig';
import MuiStack from '@/components/MuiStack';
import useUserContext from '@/hooks/useUserContext';
import { flagTranslations, UserOptInFlags } from '@/types/UserFlags';

export default function TabTwoScreen() {
  const { user, signOut } = useAuth();
  const { userOptInFlags, toggleUserOptInFlagState, resetUserFlags } =
    useUserContext();

  const handleToggleUserOptInFlag = async (flag: UserOptInFlags) => {
    const updatedFlags = { ...userOptInFlags };
    updatedFlags[flag] = !updatedFlags[flag];
    await toggleUserOptInFlagState(flag);
  };

  const handleResetData = async () => {
    try {
      resetUserFlags();
      Alert.alert('Success', 'All AsyncStorage data has been cleared!');
    } catch {
      Alert.alert('Error', 'Failed to clear AsyncStorage data.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Account</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>{user?.displayName}</ThemedText>
        {(Object.keys(userOptInFlags) as UserOptInFlags[]).map((optInFlag) => (
          <MuiStack direction="row" key={optInFlag.toString()}>
            <ThemedText>{flagTranslations.optInFlags[optInFlag]}</ThemedText>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={userOptInFlags[optInFlag] ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => handleToggleUserOptInFlag(optInFlag)} // Use the actual flag name to toggle
              value={userOptInFlags[optInFlag] || false}
            />
          </MuiStack>
        ))}
        <Button label="Reset All Async Storage" onPress={handleResetData} />
        <Button
          label="Sign out"
          onPress={async () => {
            await signOut(auth); // Pass the auth instance
            router.replace('/auth/login');
          }}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    paddingTop: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
