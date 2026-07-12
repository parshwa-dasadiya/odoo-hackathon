/**
 * Pure function to check if a new booking time range overlaps with any existing bookings.
 * 
 * Rule: Two ranges overlap if `newStart < existing.endTime AND newEnd > existing.startTime`.
 * A booking that starts exactly when another ends does NOT count as overlapping 
 * (boundary-inclusive-exclusive, e.g., 9:00-10:00 and 10:00-11:00 is allowed).
 * 
 * @param {Date} newStart - Start time of the new booking
 * @param {Date} newEnd - End time of the new booking
 * @param {Array} existingBookings - Array of existing booking objects
 * @returns {Object|null} - Returns the overlapping booking object if conflict found, else null.
 */
const hasOverlap = (newStart, newEnd, existingBookings) => {
  const start = new Date(newStart);
  const end = new Date(newEnd);

  for (const existing of existingBookings) {
    const existStart = new Date(existing.startTime);
    const existEnd = new Date(existing.endTime);

    // Overlap condition: newStart < existEnd AND newEnd > existStart
    if (start < existEnd && end > existStart) {
      return existing; // Found conflict
    }
  }

  return null; // No conflict
};

module.exports = { hasOverlap };
