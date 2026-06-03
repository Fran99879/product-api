import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        'smartphone',
        'tablet',
        'laptop',
        'desktop',
        'monitor',
        'tv',
        'smartwatch',
        'headphones',
        'speaker',
        'gaming',
        'storage',
        'networking',
        'camera',
        'accessories',
        'other',
      ],
      required: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    specs: {
      type: Map,
      of: String,
      default: {},
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Product = mongoose.model('Product', productSchema)
