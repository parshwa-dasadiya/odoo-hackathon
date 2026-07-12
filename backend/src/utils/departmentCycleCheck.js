const Department = require('../models/Department.model');

/**
 * Validates if setting parentId as the parent of departmentId creates a cycle.
 * Walks up the parent ancestry of parentId. If departmentId is found in the ancestry chain, a cycle is created.
 * @param {string|mongoose.Types.ObjectId} departmentId - ID of the department being created or updated
 * @param {string|mongoose.Types.ObjectId} parentId - Proposed parent department ID
 * @returns {Promise<boolean>} - True if a cycle is detected, false otherwise
 */
const wouldCreateCycle = async (departmentId, parentId) => {
  if (!parentId) return false;
  if (departmentId && departmentId.toString() === parentId.toString()) return true;

  let currentParentId = parentId;

  // Walk up the tree
  while (currentParentId) {
    const parentDept = await Department.findById(currentParentId).select('parentDepartment');
    if (!parentDept) {
      break;
    }

    if (departmentId && parentDept.parentDepartment && parentDept.parentDepartment.toString() === departmentId.toString()) {
      return true;
    }

    currentParentId = parentDept.parentDepartment;
  }

  return false;
};

module.exports = wouldCreateCycle;
