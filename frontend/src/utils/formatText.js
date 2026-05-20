export const toTitleCase = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
