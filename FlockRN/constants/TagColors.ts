// Tag specific colors. Users can import via Colors.tx.

export const tagColors = {
  // Default tag color
  defaultTag: '#FFFFFF',

  // Tag colors for different categories
  selectedColors: {
    current: '#EEAA3C',
    answered: '#5C5244',
    personal: '#65558F',
    family: '#75C9C8',
    urgent: '#FF33A1',
    health: '#CF5C36',
    career: '#33A8FF',
    praise: '#94C9A9',
    prayerRequest: '#925EFF',
    friends: '#FFB6C1',
  },

  typeColors: {
    request: '#FF33A1',
    praise: '#94C9A9',
    repentance: '#FFAA33',
  },
};

export const colorPool = Object.values(tagColors.selectedColors);

export const iconBackgroundColors = {
  // Default tag color
  defaultTag: '#82B362',

  typeColors: {
    request: '#F5E9DC80',
    praise: '#94C9A91A',
    repentance: '#6A5ACD1A',
  },
};

export const authorBadgeColors = {
  default: '#82B362',
  answered: '#5C5244',
  personal: '#65558F',
  family: '#75C9C8',
  urgent: '#FF33A1',
  health: '#CF5C36',
  career: '#33A8FF',
};
