/**
 * Filters a string to allow only words, numbers, and spaces.
 * Removes all special characters and symbols.
 */
export function filterText(input: string): string {
  // Replace anything that is not a letter, number, or space with empty string
  return input.replace(/[^\w\d ]+/g, '').replace(/_/g, '');
}
