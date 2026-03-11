export const flattenObject = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
  return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
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

export const generateCSVContent = (data: any): string => {
  const flatEvent = flattenObject(data);
  const headers = Object.keys(flatEvent);
  const values = Object.values(flatEvent).map(v => `"${v.replace(/"/g, '""')}"`);

  return headers.join(",") + "\n" + values.join(",");
};
