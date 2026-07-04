import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      required: true,
    },
    // Ubicación/dirección de entrega elegida por el comprador (para que el
    // vendedor coordine el envío a domicilio).
    shippingAddress: {
      type: String,
      trim: true,
    },
  },
  {
    // updatedAt habilitado: las órdenes cambian de estado y mapDocToOrder lo expone.
    timestamps: true,
    versionKey: false,
  }
)

export const Order = mongoose.model('Order', orderSchema)
