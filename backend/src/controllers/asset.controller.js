const Asset = require('../models/Asset.model');
const AssetCategory = require('../models/AssetCategory.model');
const Allocation = require('../models/Allocation.model');
const MaintenanceRequest = require('../models/MaintenanceRequest.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const createAsset = catchAsync(async (req, res, next) => {
  const {
    name,
    category,
    serialNumber,
    acquisitionDate,
    acquisitionCost,
    condition,
    location,
    photos,
    isBookable,
    department
  } = req.body;

  // Validate category exists
  const categoryExists = await AssetCategory.findById(category);
  if (!categoryExists) {
    return next(new AppError('Asset category not found.', 404));
  }

  // Check unique serial number if provided
  if (serialNumber) {
    const serialExists = await Asset.findOne({ serialNumber });
    if (serialExists) {
      return next(new AppError('An asset with this serial number already exists.', 400));
    }
  }

  const asset = await Asset.create({
    name,
    category,
    serialNumber: serialNumber || undefined,
    acquisitionDate,
    acquisitionCost,
    condition,
    location,
    photos: photos || [],
    isBookable: isBookable || false,
    department: department || null
  });

  res.status(201).json({
    success: true,
    message: 'Asset registered successfully.',
    data: { asset }
  });
});

const getAssets = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    category,
    department,
    location,
    sort = '-createdAt'
  } = req.query;

  const query = {};

  if (search) {
    // Utilize text index across name, assetTag, and serialNumber
    query.$text = { $search: search };
  }

  if (status) query.status = status;
  if (category) query.category = category;
  if (department) query.department = department;
  if (location) query.location = location;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Asset.countDocuments(query);
  
  // Build query and populate category, department, and currentHolder
  const assets = await Asset.find(query)
    .sort(sort)
    .populate('category', 'name')
    .populate('department', 'name')
    .populate({
      path: 'currentHolder.holderId',
      select: 'name email' // Will dynamically fetch name/email for Employee or name for Department
    })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    message: 'Assets retrieved successfully.',
    data: {
      assets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

const getAssetById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const asset = await Asset.findById(id)
    .populate('category', 'name description customFields')
    .populate('department', 'name')
    .populate({
      path: 'currentHolder.holderId',
      select: 'name email'
    });

  if (!asset) {
    return next(new AppError('Asset not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Asset details retrieved successfully.',
    data: { asset }
  });
});

const updateAsset = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, location, condition, photos, isBookable, department } = req.body;

  const asset = await Asset.findById(id);
  if (!asset) {
    return next(new AppError('Asset not found.', 404));
  }

  // Update allowed fields
  if (name !== undefined) asset.name = name;
  if (location !== undefined) asset.location = location;
  if (condition !== undefined) asset.condition = condition;
  if (photos !== undefined) asset.photos = photos;
  if (isBookable !== undefined) asset.isBookable = isBookable;
  if (department !== undefined) asset.department = department || null;

  // CRITICAL BUSINESS RULE: We do NOT allow editing of status or currentHolder directly.
  // Those status changes must be done through dedicated workflow allocation/maintenance modules.
  
  await asset.save();

  const updatedAsset = await Asset.findById(id)
    .populate('category', 'name')
    .populate('department', 'name')
    .populate({
      path: 'currentHolder.holderId',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    message: 'Asset updated successfully (status and holder modifications were ignored).',
    data: { asset: updatedAsset }
  });
});

const deleteAsset = catchAsync(async (req, res, next) => {
  // CRITICAL BUSINESS RULE: We block hard deletes to preserve audit history.
  // Instead, the client must transition the asset status to 'Retired' or 'Disposed'.
  return next(
    new AppError(
      'Physical assets cannot be deleted from the database. Please update the asset status to Retired or Disposed instead.',
      400
    )
  );
});

const getAssetHistory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const asset = await Asset.findById(id);
  if (!asset) {
    return next(new AppError('Asset not found', 404));
  }

  // Fetch allocation history sorted newest first
  const allocationHistory = await Allocation.find({ asset: id })
    .sort({ allocatedDate: -1 })
    .populate('holderId', 'name email')
    .populate('allocatedBy', 'name email');

  // Fetch maintenance history sorted newest first
  const maintenanceHistory = await MaintenanceRequest.find({ asset: id })
    .sort({ createdAt: -1 })
    .populate('raisedBy', 'name email')
    .populate('decisionBy', 'name');

  res.status(200).json({
    success: true,
    message: 'Asset history retrieved successfully.',
    data: {
      allocationHistory,
      maintenanceHistory
    }
  });
});

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetHistory
};
