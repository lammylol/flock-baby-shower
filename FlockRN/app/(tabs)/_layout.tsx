import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import AddPrayerTabButton from '@/components/Prayer/PrayerViews/AddPrayerTabButton';
import { useState } from 'react';
import PrayerCreateModal from '../modals/(prayerFlow)/prayerCreateModal';
import PasswordModal from '@/components/PasswordModal';
import { NavigationUtils } from '@/utils/navigation';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textPrimary');
  const borderColor = useThemeColor({}, 'borderPrimary');
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleGoToJournal = () => {
    NavigationUtils.resetAndNavigate('/(tabs)/(prayerJournal)');
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    // Navigate to account screen after successful password entry
    NavigationUtils.resetAndNavigate('/(tabs)/account');
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: textColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: backgroundColor,
            borderTopWidth: 1,
            borderTopColor: borderColor,
          },
          tabBarLabelStyle: {
            fontSize: 10,
          },
        }}
        initialRouteName="(prayerJournal)"
      >
        <Tabs.Screen
          name="(prayerJournal)"
          options={{
            title: '',
            tabBarIcon: () => (
              <FontAwesome5 color={backgroundColor} size={21} name={'book'} />
            ),
          }}
          listeners={{
            tabPress: () => {
              NavigationUtils.resetAndNavigate('/(tabs)/(prayerJournal)');
            },
          }}
        />

        <Tabs.Screen
          name="createPrayerPlaceholder"
          options={{
            title: 'PRAY FOR ELLIE!',
            tabBarIcon: () => (
              <AddPrayerTabButton
                onPress={() => setIsPrayerModalOpen(true)}
                bottom={20}
                right={0}
                disabled={false}
                size={56}
                style={{}}
              />
            ),
            tabBarLabel: 'Pray for Elia!',
            tabBarLabelStyle: {
              fontSize: 16,
              color: textColor,
            },
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              sentryAnalytics.startNewSession();
              sentryAnalytics.trackUserInteraction(
                'pray_tab_clicked',
                'TabLayout',
                'createPrayerPlaceholder',
              );
              setIsPrayerModalOpen(true);
            },
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            headerShown: true,
            title: '',
            headerStatusBarHeight: 0,
            headerLeft: () => (
              <HeaderButton
                hasBackIcon={true}
                onPress={handleGoToJournal}
                label="Back to Journal"
              />
            ),
            headerBackgroundContainerStyle: {
              backgroundColor: backgroundColor,
            },
            headerShadowVisible: false,
            tabBarIcon: () => (
              <IconSymbol
                size={28}
                name="gearshape.fill"
                color={backgroundColor}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsPasswordModalOpen(true);
            },
          }}
        />
      </Tabs>
      <PrayerCreateModal
        visible={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
      />
      <PasswordModal
        visible={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
        title="Enter Password to Access Settings"
        correctPassword="helloFlock123"
      />
    </>
  );
}
