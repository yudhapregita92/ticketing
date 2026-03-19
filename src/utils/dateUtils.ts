/**
 * Helper to safely parse date strings for Safari compatibility
 */
export const parseSafeDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const normalizedDate = dateString.includes('T') || dateString.includes('Z') 
    ? dateString 
    : dateString.replace(' ', 'T');
  return new Date(normalizedDate);
};

export const formatDate = (dateString: string): string => {
  const date = parseSafeDate(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
