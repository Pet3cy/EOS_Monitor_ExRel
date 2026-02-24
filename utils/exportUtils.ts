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

export const generateCSVContent = (data: Record<string, string>): string => {
  const headers = Object.keys(data);
  const values = Object.values(data).map(v => `"${v.replace(/"/g, '""')}"`);

  return "data:text/csv;charset=utf-8,"
    + headers.join(",") + "\n"
    + values.join(",");
};

export const downloadCSV = (csvContent: string, fileName: string): void => {
  const encodedUri = encodeURI(csvContent);
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", encodedUri);
  linkElement.setAttribute("download", fileName);
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
};

export const exportToCSV = (data: any, fileName: string): void => {
  const flatData = flattenObject(data);
  const csvContent = generateCSVContent(flatData);
  downloadCSV(csvContent, fileName);
};
