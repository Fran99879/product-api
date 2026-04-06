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
    owner: PopulatedOwner
}

export type PopulatedOrderItem = {
    product: PopulatedProduct
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
  email: (doc.buyer as any).email
},
  items: doc.items.map(i => ({
    product: {
      id: i.product._id.toString(),
      owner: i.product.owner._id.toString()
    },
    quantity: i.quantity,
    price: i.price
  })),
  total: doc.total,
  status: doc.status,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
})

export const filterUndefined = <T extends Record<string, unknown>>(obj: T) => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}
