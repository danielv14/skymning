export const capitalizeFirst = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const truncateText = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : text.slice(0, maxLength).trim() + '...'
