/**
 * Flattens a nested object into a single-level object with dot-notated keys.
 * Arrays are joined into a semicolon-separated string.
 */
export const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
  if (obj == null || typeof obj !== 'object') {
    return {};
  }
  return Object.keys(obj).reduce((acc: any, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else if (Array.isArray(obj[k])) {
      acc[pre + k] = obj[k].join('; ');
    } else {
      acc[pre + k] = String(obj[k]);
    }
    return acc;
  }, {});
};
