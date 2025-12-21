import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    descripcion: {
      type: String,
      default: ''
    },
    precio: {
      type: Number,
      required: true,
      min: 1
    },
    image: {
      type: String,
      required: true
    },
    marca: {
      type: String,
      enum: ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola'],
      required: true
    },
    rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export const Product = mongoose.model('Product', productSchema)
