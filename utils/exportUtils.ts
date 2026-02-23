import { EventData } from '../types';

/**
 * Flattens a nested object into a single-level record with dot-notation keys.
 * Arrays are joined into a semicolon-separated string.
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
 * Converts an EventData object to a CSV string.
 */
export const convertToCSV = (event: EventData): string => {
  const flatEvent = flattenObject(event);
  const headers = Object.keys(flatEvent);
  const values = Object.values(flatEvent).map(v => {
    const sanitized = v.replace(/"/g, '""');
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.some(char => sanitized.startsWith(char))) {
      return `"'${sanitized}"`;
    }
    return `"${sanitized}"`;
  });

  return headers.join(",") + "\n" + values.join(",");
};

/**
 * Helper to trigger a file download in the browser.
 */
const downloadFile = (uri: string, fileName: string) => {
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", uri);
  linkElement.setAttribute("download", fileName);
  linkElement.click();
};

/**
 * Exports an event as a CSV file.
 */
export const exportToCSV = (event: EventData) => {
  const csvContent = convertToCSV(event);
  const fileName = `${event.analysis.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  downloadFile(encodedUri, fileName);
};

/**
 * Exports an event as a JSON file.
 */
export const exportToJSON = (event: EventData) => {
  const dataStr = JSON.stringify(event, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const fileName = `${event.analysis.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  downloadFile(dataUri, fileName);
};
