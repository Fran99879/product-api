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
    // Clave de idempotencia (opcional): evita órdenes duplicadas ante doble-click
    // o reintentos. El índice único sparse garantiza que no se repita.
    idempotencyKey: {
      type: String,
    },
  },
  {
    // updatedAt habilitado: las órdenes cambian de estado y mapDocToOrder lo expone.
    timestamps: true,
    versionKey: false,
  }
)

// Único solo cuando la clave existe (sparse): órdenes sin clave no chocan entre sí.
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true })

// Índices para los listados (Sprint 5 — perf): todos ordenan por más reciente.
// - "mis pedidos" (getByUser) y getAll con filtro por comprador
orderSchema.index({ buyer: 1, createdAt: -1 })
// - pedidos del vendedor (getSellerOrders) y getAll con filtro por producto
orderSchema.index({ 'items.product': 1, createdAt: -1 })
// - getAll sin filtro (admin), ordenado por más reciente
orderSchema.index({ createdAt: -1 })

export const Order = mongoose.model('Order', orderSchema)
