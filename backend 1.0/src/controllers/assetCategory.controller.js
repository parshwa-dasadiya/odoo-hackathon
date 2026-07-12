const AssetCategory = require('../models/AssetCategory.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const createCategory = catchAsync(async (req, res, next) => {
  const { name, description, customFields } = req.body;

  const existingCategory = await AssetCategory.findOne({ name });
  if (existingCategory) {
    return next(new AppError('Asset category already exists.', 400));
  }

  const category = await AssetCategory.create({
    name,
    description,
    customFields: customFields || []
  });

  res.status(201).json({
    success: true,
    message: 'Asset Category created successfully.',
    data: { category }
  });
});

const getCategories = catchAsync(async (req, res, next) => {
  const categories = await AssetCategory.find({});
  res.status(200).json({
    success: true,
    message: 'Asset Categories retrieved successfully.',
    data: { categories }
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, customFields } = req.body;

  const category = await AssetCategory.findById(id);
  if (!category) {
    return next(new AppError('Asset Category not found.', 404));
  }

  if (name && name !== category.name) {
    const existingName = await AssetCategory.findOne({ name });
    if (existingName) {
      return next(new AppError('Asset category name already exists.', 400));
    }
    category.name = name;
  }

  if (description !== undefined) {
    category.description = description;
  }

  if (customFields !== undefined) {
    category.customFields = customFields;
  }

  await category.save();

  res.status(200).json({
    success: true,
    message: 'Asset Category updated successfully.',
    data: { category }
  });
});

const Asset = require('../models/Asset.model');

const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await AssetCategory.findById(id);
  if (!category) {
    return next(new AppError('Asset Category not found.', 404));
  }

  // Check if any Asset references this category
  const assetRef = await Asset.findOne({ category: id });
  if (assetRef) {
    return next(
      new AppError(
        'Cannot delete category. There are assets referencing this category. Update or delete those assets first.',
        409
      )
    );
  }

  await AssetCategory.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Asset Category deleted successfully.'
  });
});

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
