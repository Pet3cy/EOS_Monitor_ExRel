/**
 * Flattens a nested object into a single-level object with dot notation keys.
 * Handles arrays by joining them with '; '.
 */
export const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
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

/**
 * Triggers a browser download for a given content string.
 */
export const triggerDownload = (content: string, fileName: string, mimeType: string) => {
  const encodedUri = mimeType === 'application/json'
    ? `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`
    : `data:${mimeType};charset=utf-8,${encodeURI(content)}`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", encodedUri);
  linkElement.setAttribute("download", fileName);
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
};

/**
 * Exports data to a CSV file.
 */
export const exportToCSV = (data: any, fileName: string) => {
  const flatData = flattenObject(data);
  const headers = Object.keys(flatData);
  const values = Object.values(flatData).map(v => {
    const sanitized = v.replace(/"/g, '""');
    // Prevent CSV injection
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.some(char => sanitized.startsWith(char))) {
      return `"'${sanitized}"`;
    }
    return `"${sanitized}"`;
  });

  const csvContent = headers.join(",") + "\n" + values.join(",");
  triggerDownload(csvContent, fileName, 'text/csv');
};

/**
 * Exports data to a JSON file.
 */
export const exportToJSON = (data: any, fileName: string) => {
  const dataStr = JSON.stringify(data, null, 2);
  triggerDownload(dataStr, fileName, 'application/json');
};
