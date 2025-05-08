export const generateUniqueHexId = () => {
  // Generate a 12-character hex ID (similar to MongoDB ObjectId format)
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomPart = Math.random().toString(16).substring(2, 8);
  return `${timestamp}${randomPart}`.toUpperCase();
};