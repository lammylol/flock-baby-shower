import { ThemedView } from '@/components/ThemedView';
import Button from '@/components/Button';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { AnyPrayerEntity } from '@shared/types/firebaseTypes';
import { PrayerCardButtonProps } from '@/types/ComponentProps';
import EditablePrayerCard from './PrayerCard';

export interface PrayerCardWithButtonProps {
  prayer: AnyPrayerEntity;
  button1?: PrayerCardButtonProps;
  button2?: PrayerCardButtonProps;
  disabled?: boolean;
}

export default function PrayerCardWithButtons({
  prayer,
  button1,
  button2,
  disabled = false,
}: PrayerCardWithButtonProps): JSX.Element {
  return (
    <EditablePrayerCard prayer={prayer} editable={false}>
      <ThemedView style={styles.actionBar}>
        {button1 && (
          <Button
            label={button1.label}
            onPress={button1.onPress}
            size="s"
            flex={1}
            textProps={{
              fontSize: 14,
              fontWeight: button1.fontWeight,
              color: button1.textColor,
            }}
            backgroundColor={button1.backgroundColor ?? Colors.grey1}
            endIcon={button1.icon}
            disabled={disabled}
          />
        )}
        {button2 && (
          <Button
            label={button2.label}
            onPress={button2.onPress}
            size="s"
            flex={1}
            textProps={{
              fontSize: 14,
              fontWeight: button2.fontWeight,
              color: button2.textColor,
            }}
            backgroundColor={button2.backgroundColor ?? Colors.brown1}
            endIcon={button2.icon}
            disabled={disabled}
          />
        )}
      </ThemedView>
    </EditablePrayerCard>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    flex: 1,
    gap: 15,
  },
});
