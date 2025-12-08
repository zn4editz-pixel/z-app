// Utility to handle both MongoDB (_id) and Prisma (id) field names
// This ensures compatibility during the migration period

/**
 * Get the ID from an object that might have either _id or id
 * @param {Object} obj - Object with _id or id field
 * @returns {string|undefined} The ID value
 */
export const getId = (obj) => {
  if (!obj) return undefined;
  return obj._id || obj.id;
};

/**
 * Check if two objects have the same ID
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} True if IDs match
 */
export const isSameId = (obj1, obj2) => {
  return getId(obj1) === getId(obj2);
};

/**
 * Find object in array by ID
 * @param {Array} array - Array of objects
 * @param {string} id - ID to search for
 * @returns {Object|undefined} Found object or undefined
 */
export const findById = (array, id) => {
  return array?.find(item => getId(item) === id);
};

/**
 * Filter array to exclude object with given ID
 * @param {Array} array - Array of objects
 * @param {string} id - ID to exclude
 * @returns {Array} Filtered array
 */
export const filterOutId = (array, id) => {
  return array?.filter(item => getId(item) !== id) || [];
};

/**
 * Check if array includes object with given ID
 * @param {Array} array - Array of objects
 * @param {string} id - ID to check
 * @returns {boolean} True if ID exists in array
 */
export const includesId = (array, id) => {
  return array?.some(item => getId(item) === id) || false;
};
