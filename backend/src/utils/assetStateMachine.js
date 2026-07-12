/**
 * Allowed transitions state machine map for Asset statuses.
 * Keys represent the current state, values represent acceptable next states.
 * States: Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed
 */
const allowedTransitions = {
  Available: ['Allocated', 'Reserved', 'Under Maintenance', 'Retired', 'Lost'],
  Allocated: ['Available', 'Lost', 'Under Maintenance'],
  Reserved: ['Allocated', 'Available', 'Lost'],
  'Under Maintenance': ['Available', 'Retired', 'Lost'],
  Lost: ['Available', 'Retired', 'Disposed'],
  Retired: ['Disposed'],
  Disposed: [] // Terminal state
};

/**
 * Validates if an asset can transition from currentStatus to newStatus
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
const isValidTransition = (currentStatus, newStatus) => {
  if (!allowedTransitions[currentStatus]) return false;
  return allowedTransitions[currentStatus].includes(newStatus);
};

module.exports = {
  allowedTransitions,
  isValidTransition
};
