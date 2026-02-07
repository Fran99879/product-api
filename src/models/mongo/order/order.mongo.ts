import mongoose, { Document, Types, UpdateQuery } from 'mongoose'
import { Order as OrderSchema } from '../../../schemas/order.mongodb.js'
import { Product } from '../../../schemas/product.mongodb.js'

import type { OrderModel } from '../../order.model.js'
import type { Order, CreateOrderInput, UpdateOrderInput } from '../../../schemas/order.schema.js'

type OrderItemDoc = {
  product: Types.ObjectId
  quantity: number
  price: number
}

type OrderDoc = Document & {
  buyer: Types.ObjectId
  items: OrderItemDoc[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const mapDocToOrder = (doc: OrderDoc): Order => ({
  id: doc._id.toString(),
  buyer: doc.buyer.toString(),
  items: doc.items.map(i => ({
    product: i.product.toString(),
    quantity: i.quantity,
    price: i.price
  })),
  total: doc.total,
  status: doc.status,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
})

const filterUndefined = <T extends Record<string, unknown>>(obj: T) => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export const MongoOrderModel: OrderModel = {
  async create (input) {
    // Ensure products exist and capture price
    const productIds = input.items.map(i => new Types.ObjectId(i.product))

    const products = await Product.find({ _id: { $in: productIds } }) as Array<Document & { _id: Types.ObjectId; price: number; quantity: number; name?: string }>

    if (products.length !== input.items.length) {
      throw new Error('One or more products not found')
    }

    // Build items with price and check stock
    const items: OrderItemDoc[] = input.items.map(i => {
      const p = products.find(pp => pp._id.equals(i.product))!
      if (!p) throw new Error('Product not found')
      if (p.quantity < i.quantity) throw new Error(`Insufficient stock for product ${p.name || p._id.toString()}`)
      return { product: new Types.ObjectId(i.product), quantity: i.quantity, price: p.price }
    })

    const total = items.reduce((acc, it) => acc + it.price * it.quantity, 0)

    const created = await OrderSchema.create({
      buyer: new Types.ObjectId(input.buyer),
      items,
      total,
      status: 'pending'
    }) as OrderDoc

    // Deduct stock
    for (const it of items) {
      await Product.findByIdAndUpdate(it.product, { $inc: { quantity: -it.quantity } })
    }

    const populated = await OrderSchema.findById(created._id)
      .populate('buyer', '-role')
      .populate({ path: 'items.product', select: '-quantity', populate: { path: 'owner', select: 'username' } }) as OrderDoc | null

    if (!populated) throw new Error('Failed to retrieve created order')
    return mapDocToOrder(populated)
  },

  async getById (id) {
    if (!Types.ObjectId.isValid(id)) return null
    const doc = await OrderSchema.findById(id)
      .populate('buyer', '-role')
      .populate({ path: 'items.product', select: '-quantity', populate: { path: 'owner', select: 'username' } }) as OrderDoc | null
    return doc ? mapDocToOrder(doc) : null
  },

  async getAll (params) {
    const query: Record<string, unknown> = {}
    if (params?.role === 'seller' && params.userId) {
      const sellerProducts = await Product.find({ owner: params.userId }).distinct('_id')
      query['items.product'] = { $in: sellerProducts }
    } else if (params?.role === 'user' && params.userId) {
      query['buyer'] = new Types.ObjectId(params.userId)
    }

    const docs = await OrderSchema.find(query)
      .populate('buyer', '-role')
      .populate({ path: 'items.product', select: '-quantity', populate: { path: 'owner', select: 'username' } }) as OrderDoc[]

    return docs.map(mapDocToOrder)
  },

  async update (id, input) {
    if (!Types.ObjectId.isValid(id)) return null

    // If items are being updated, adjust stock accordingly
    if (input.items) {
      const current = await OrderSchema.findById(id) as OrderDoc | null
      if (!current) return null

      // restore previous stock
      for (const it of current.items) {
        await Product.findByIdAndUpdate(it.product, { $inc: { quantity: it.quantity } })
      }

      // validate new items
      const productIds = input.items.map(i => new Types.ObjectId(i.product))
      const products = await Product.find({ _id: { $in: productIds } }) as Array<Document & { _id: Types.ObjectId; quantity: number; price: number; name?: string }>

      for (const it of input.items) {
        const p = products.find(pp => pp._id.equals(it.product))
        if (!p || p.quantity < it.quantity) throw new Error(`Insufficient stock for product ${p?.name || it.product}`)
      }

      // deduct stock for new items
      for (const it of input.items) {
        await Product.findByIdAndUpdate(it.product, { $inc: { quantity: -it.quantity } })
      }
    }

    const updateData = filterUndefined(input as Record<string, unknown>)
    const doc = await OrderSchema.findByIdAndUpdate(id, updateData as UpdateQuery<OrderDoc>, { new: true })
      .populate('buyer', '-role')
      .populate({ path: 'items.product', select: '-quantity', populate: { path: 'owner', select: 'username' } }) as OrderDoc | null

    return doc ? mapDocToOrder(doc) : null
  },

  async delete (id) {
    if (!Types.ObjectId.isValid(id)) return false
    const order = await OrderSchema.findById(id) as OrderDoc | null
    if (!order) return false

    for (const it of order.items) {
      await Product.findByIdAndUpdate(it.product, { $inc: { quantity: it.quantity } })
    }

    const result = await OrderSchema.findByIdAndDelete(id)
    return result !== null
  },

  async getByUser (userId) {
    const docs = await OrderSchema.find({ buyer: new Types.ObjectId(userId) })
      .populate({ path: 'items.product', select: '-quantity', populate: { path: 'owner', select: 'username' } }) as OrderDoc[]
    return docs.map(mapDocToOrder)
  },

  async getSellerOrders (sellerId) {
    const sellerProducts = await Product.find({ owner: sellerId }).distinct('_id')
    const docs = await OrderSchema.find({ 'items.product': { $in: sellerProducts } })
      .populate('buyer', '-role')
      .populate({ path: 'items.product', select: '-quantity', populate: { path: 'owner', select: 'username' } }) as OrderDoc[]
    return docs.map(mapDocToOrder)
  }
}
