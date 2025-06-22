/**
 * Calculate which trimester a pregnancy is in based on conception date
 * @param {Date} conceptionDate - The conception date
 * @returns {number} - Trimester number (1, 2, or 3)
 */
function getTrimester(conceptionDate) {
  const today = new Date();
  const conception = new Date(conceptionDate);

  // Calculate days since conception
  const daysSinceConception = Math.floor((today - conception) / (1000 * 60 * 60 * 24));

  // Calculate weeks since conception
  const weeksSinceConception = Math.floor(daysSinceConception / 7);

  // Determine trimester based on weeks
  // First trimester: 0-13 weeks
  // Second trimester: 14-27 weeks
  // Third trimester: 28-40 weeks
  if (weeksSinceConception <= 13) {
    return 1;
  } else if (weeksSinceConception <= 27) {
    return 2;
  } else {
    return 3;
  }
}

module.exports = getTrimester;
