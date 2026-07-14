export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '-';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const calculateSavings = (original, compressed) => {
  if (!original || !compressed || original === 0) return 0;
  const savings = ((original - compressed) / original) * 100;
  return savings > 0 ? parseFloat(savings.toFixed(1)) : 0;
};

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const getFilenameWithoutExt = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.substring(0, lastDot);
};
