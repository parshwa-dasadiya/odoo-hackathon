const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true
    },
    fieldType: {
      type: String,
      enum: ['Text', 'Number', 'Date'],
      required: [true, 'Field type is required']
    }
  },
  { _id: false }
);

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset category name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    customFields: [customFieldSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
