import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: 1
    },
    image: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      enum: ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola'],
      required: true
    },
    rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export const Product = mongoose.model('Product', productSchema)
