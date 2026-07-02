import { Document, Types } from 'mongoose'
import type { Order } from '../../../schemas/order.schema.js'

export type OrderItemDoc = {
  product: Types.ObjectId
  quantity: number
  price: number
}

export type OrderDoc = Document & {
  buyer: Types.ObjectId
  items: OrderItemDoc[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export type PopulatedOwner = {
  _id: Types.ObjectId
}

export type PopulatedProduct = {
  _id: Types.ObjectId
  name: string
  brand: string
  image?: string
  owner: PopulatedOwner
}

export type PopulatedOrderItem = {
  // null si el producto/owner fue borrado después de creada la orden
  // (populate de una ref inexistente devuelve null).
  product: (Omit<PopulatedProduct, 'owner'> & { owner: PopulatedOwner | null }) | null
  quantity: number
  price: number
}

export type PopulatedOrderDoc = Document & {
  _id: Types.ObjectId
  buyer: Types.ObjectId
  items: PopulatedOrderItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export const mapDocToOrder = (doc: PopulatedOrderDoc): Order => ({
  id: doc._id.toString(),
  buyer: {
    id: doc.buyer._id.toString(),
    username: (doc.buyer as any).username,
    email: (doc.buyer as any).email,
  },
  items: doc.items.map((i) => ({
    // La orden es un registro histórico: debe sobrevivir a que el producto o
    // su owner se borren después (ej: moderación admin).
    product: i.product
      ? {
          id: i.product._id.toString(),
          name: i.product.name,
          brand: i.product.brand,
          image: i.product.image,
          owner: i.product.owner?._id.toString() ?? '',
        }
      : { id: '', name: 'Producto eliminado', brand: '', owner: '' },
    quantity: i.quantity,
    price: i.price,
  })),
  total: doc.total,
  status: doc.status,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
})

export const filterUndefined = <T extends Record<string, unknown>>(obj: T) => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}
