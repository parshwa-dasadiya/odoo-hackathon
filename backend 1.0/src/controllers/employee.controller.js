const User = require('../models/User.model');
const Department = require('../models/Department.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getEmployees = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', department, role, status } = req.query;

  const query = {};

  // Support Search (Name/Email)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Support Filters
  if (role) {
    query.role = role;
  }
  if (status) {
    query.status = status;
  }

  // Handle department filtering
  if (department === 'own') {
    // Business rule: Department Head's results filterable to 'own' to scope to their own department
    // Comparisons just check if req.user.department matches
    if (!req.user.department) {
      return next(new AppError('You are not associated with any department.', 400));
    }
    query.department = req.user.department;
  } else if (department) {
    query.department = department;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('department', 'name')
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    message: 'Employees retrieved successfully.',
    data: {
      employees: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

const patchRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role, department } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('Employee not found.', 404));
  }

  // Validate department exists if provided
  if (department) {
    const deptExists = await Department.findById(department);
    if (!deptExists) {
      return next(new AppError('Department not found.', 404));
    }
    user.department = department;
  } else if (department === null) {
    user.department = null;
  }

  // Update Role
  if (role) {
    user.role = role;
  }

  await user.save();

  // TODO: Trigger a notification/email note (stubbed for Prompt 7)

  res.status(200).json({
    success: true,
    message: 'Employee role and department updated successfully.',
    data: {
      employee: user
    }
  });
});

const patchStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('Employee not found.', 404));
  }

  if (status === 'Inactive') {
    // Business rule checks:
    // 1. Check if user is the assigned Head of an active Department
    const headDept = await Department.findOne({ head: id, status: 'Active' });
    if (headDept) {
      return next(
        new AppError(
          `Cannot deactivate user. This user is the assigned Department Head of an active department: ${headDept.name}.`,
          409
        )
      );
    }

    // 2. TODO: enforce check if user has allocated assets (see later prompts)
  }

  user.status = status;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Employee status updated to ${status} successfully.`,
    data: {
      employee: user
    }
  });
});

module.exports = {
  getEmployees,
  patchRole,
  patchStatus
};
