// A predefined palette of visually appealing gradients
const gradients = [
  ['#ff9a9e', '#fad0c4'],
  ['#a1c4fd', '#c2e9fb'],
  ['#ffdde1', '#ee9ca7'],
  ['#fbc2eb', '#a6c1ee'],
  ['#84fab0', '#8fd3f4'],
  ['#d299c2', '#fef9d7'],
  ['#f6d365', '#fda085'],
  ['#4facfe', '#00f2fe'],
];

/**
 * Generates a consistent hash number from a string.
 * @param str The input string.
 * @returns A number hash.
 */
const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Selects a deterministic gradient from the palette based on a string hash.
 * @param str The string to generate the gradient from (e.g., article title).
 * @returns A CSS linear-gradient string.
 */
export const getGradientForString = (str: string): string => {
  if (!str) {
    // Return a default gradient if the string is empty
    return `linear-gradient(135deg, ${gradients[0][0]}, ${gradients[0][1]})`;
  }
  const hash = stringToHash(str);
  const index = hash % gradients.length;
  const [color1, color2] = gradients[index];
  return `linear-gradient(135deg, ${color1}, ${color2})`;
};