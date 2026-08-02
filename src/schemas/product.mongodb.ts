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

    // Descuento de oferta en porcentaje (0 = sin oferta). El precio final se
    // calcula en el front: price * (1 - discountPercent / 100).
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 95,
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
    timestamps: {  createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Índices para las queries del catálogo (F11.2):
// - browse por categoría ordenado por más reciente (sort default)
productSchema.index({ category: 1, createdAt: -1 })
// - filtro por rango de precio + sort price-asc/price-desc
productSchema.index({ price: 1 })
// - sort rate-desc
productSchema.index({ rate: -1 })
// - sort default sin filtro de categoría
productSchema.index({ createdAt: -1 })
// - filtro por marca
productSchema.index({ brand: 1 })

export const Product = mongoose.model('Product', productSchema)
