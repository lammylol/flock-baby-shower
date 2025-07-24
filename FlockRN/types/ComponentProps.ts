import { ReactElement } from 'react';

export enum EditMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

export enum From {
  DEFAULT = 'default',
  PRAYER_TOPIC = 'prayerTopic',
  PRAYER_POINT = 'prayerPoint',
  PRAYER = 'prayer',
  PRAYER_CREATE_FLOW_START = 'prayerCreateFlowStart',
}

export interface FromProps {
  from: From;
  fromId: string;
}

export enum PrayerContextType {
  VIEW = 'view',
  EDITFROMPRAYER = 'editFromPrayer',
  EDIT = 'edit',
  CREATE = 'createStandalone',
}

export interface PrayerCardButtonProps {
  label: string;
  fontWeight?: '400' | '500' | '600' | '700';
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  icon?: ReactElement;
  onPress: () => void;
  disabled?: boolean;
}

// not to be confused with prayer tags in Tag.ts. This is a tag for a tag input.
export type Tag = {
  name: string;
  id?: string;
};
