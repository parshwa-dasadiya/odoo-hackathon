/**
 * Evaluates whether a new booking slot overlaps with any existing booking slots.
 * Enforces boundary exclusions: a booking starting exactly when another ends is valid.
 * 
 * @param {Object} newSlot - The slot to check, e.g. { date: '2026-07-12', startTime: '09:00', endTime: '10:00' }
 * @param {Array} existingSlots - The array of active bookings, filtered by asset tag and date.
 * @returns {Boolean} True if there is an overlap, false otherwise.
 */
export const hasOverlap = (newSlot, existingSlots) => {
  const newStart = newSlot.startTime;
  const newEnd = newSlot.endTime;

  return existingSlots.some((slot) => {
    // Skip checking cancelled slots
    if (slot.status === 'Cancelled') return false;
    
    // Boundary check: A booking starting exactly when another ends is valid.
    // e.g. Slot A: 09:00 - 10:00, Slot B: 10:00 - 11:00.
    // So there is an overlap ONLY IF (newStart < slot.endTime) && (newEnd > slot.startTime).
    const startOverlap = newStart < slot.endTime;
    const endOverlap = newEnd > slot.startTime;
    
    return startOverlap && endOverlap;
  });
};

export default hasOverlap;
