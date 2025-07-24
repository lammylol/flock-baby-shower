const badgeColors = [
  '#FF6B6B',
  '#FF9F1C',
  '#EAD24C',
  '#5E60CE',
  '#3A86FF',
  '#4ECDC4',
  '#B388EB',
  '#FF6F91',
  '#06D6A0',
];

// Create a static map from A-Z → color (randomly assigned, consistent across app session)
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const randomizedAuthorColors = alphabet.reduce(
  (acc, letter, idx) => {
    const color = badgeColors[idx % badgeColors.length];
    acc[letter] = { light: color, dark: color };
    return acc;
  },
  {} as Record<string, { light: string; dark: string }>,
);

// Function to get color
export function getAuthorBadgeColorByInitial(
  name: string,
  mode: 'light' | 'dark' = 'light',
): string {
  if (!name || typeof name !== 'string') return badgeColors[0];
  const initial = name.trim().charAt(0).toUpperCase();
  const colorEntry = randomizedAuthorColors[initial];
  return colorEntry ? colorEntry[mode] : badgeColors[0];
}
