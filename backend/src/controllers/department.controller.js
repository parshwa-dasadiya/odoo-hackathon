const Department = require('../models/Department.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const wouldCreateCycle = require('../utils/departmentCycleCheck');

const createDepartment = catchAsync(async (req, res, next) => {
  const { name, head, parentDepartment } = req.body;

  // Check unique name
  const existingDept = await Department.findOne({ name });
  if (existingDept) {
    return next(new AppError('Department name already exists.', 400));
  }

  // If parent department is provided, check if it exists
  if (parentDepartment) {
    const parent = await Department.findById(parentDepartment);
    if (!parent) {
      return next(new AppError('Parent department not found.', 404));
    }
  }

  const dept = await Department.create({
    name,
    head: head || null,
    parentDepartment: parentDepartment || null
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully.',
    data: { department: dept }
  });
});

const getDepartments = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', status } = req.query;

  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (status) {
    query.status = status;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Department.countDocuments(query);
  const departments = await Department.find(query)
    .populate('head', 'name email')
    .populate('parentDepartment', 'name')
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    message: 'Departments retrieved successfully.',
    data: {
      departments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

const updateDepartment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, head, parentDepartment, status } = req.body;

  const dept = await Department.findById(id);
  if (!dept) {
    return next(new AppError('Department not found.', 404));
  }

  // Unique name check if changed
  if (name && name !== dept.name) {
    const nameExists = await Department.findOne({ name });
    if (nameExists) {
      return next(new AppError('Department name already exists.', 400));
    }
    dept.name = name;
  }

  // Handle parent department change and cycle checks
  if (parentDepartment !== undefined) {
    if (parentDepartment === id) {
      return next(new AppError("A department cannot be its own parent.", 400));
    }

    if (parentDepartment) {
      const parent = await Department.findById(parentDepartment);
      if (!parent) {
        return next(new AppError('Parent department not found.', 404));
      }

      // Check cycle creation
      const cycleDetected = await wouldCreateCycle(id, parentDepartment);
      if (cycleDetected) {
        return next(new AppError('Updating parent department would create a cyclical dependency.', 400));
      }
    }

    dept.parentDepartment = parentDepartment || null;
  }

  if (head !== undefined) {
    dept.head = head || null;
  }

  if (status !== undefined) {
    dept.status = status;
  }

  await dept.save();

  const updatedDept = await Department.findById(id)
    .populate('head', 'name email')
    .populate('parentDepartment', 'name');

  res.status(200).json({
    success: true,
    message: 'Department updated successfully.',
    data: { department: updatedDept }
  });
});

const patchStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const dept = await Department.findById(id);
  if (!dept) {
    return next(new AppError('Department not found.', 404));
  }

  dept.status = status;
  await dept.save();

  // Business Rule: deactivating a department should NOT cascade-deactivate its employees automatically — just flag it.
  res.status(200).json({
    success: true,
    message: `Department status updated to ${status} successfully (employee profiles remain active).`,
    data: { department: dept }
  });
});

module.exports = {
  createDepartment,
  getDepartments,
  updateDepartment,
  patchStatus
};
