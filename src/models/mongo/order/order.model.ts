import mongoose from 'mongoose'
import { Order as OrderSchema } from '../../../schemas/order.mongodb.js'
import { Product } from '../../../schemas/product.mongodb.js'

import type { OrderModel } from '../../order.model.js'
import type { Order, OrderInput, OrderUpdate } from '../../../schemas/order.js'

const mapDocToOrder = (doc: any): Order => ({
  id: doc._id.toString(),
  buyer: doc.buyer.toString(),
  items: doc.items.map((item: any) => ({
    product: item.product.toString(),
    quantity: item.quantity,
    price: item.price
  })),
  total: doc.total,
  status: doc.status
})

export const MongoOrderModel: OrderModel = {
  async getAll (params) {
    let query = {}

    if (params?.role === 'seller' && params?.userId) {
      // Get orders for products owned by this seller
      const sellerProducts = await Product.find({ owner: params.userId }).distinct('_id')
      query = {
        'items.product': { $in: sellerProducts }
      }
    } else if (params?.role === 'user' && params?.userId) {
      // Get orders for this user
      query = { buyer: params.userId }
    }

    const docs = await OrderSchema.find(query)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      })

    return docs.map(mapDocToOrder)
  },

  async getByUser ({ userId }) {
    const docs = await OrderSchema.find({ buyer: userId })
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      })

    return docs.map(mapDocToOrder)
  },

  async getSellerOrders ({ sellerId }) {
    const sellerProducts = await Product.find({ owner: sellerId }).distinct('_id')

    const docs = await OrderSchema.find({
      'items.product': { $in: sellerProducts }
    })
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      })

    return docs.map(mapDocToOrder)
  },

  async getById ({ id }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    const doc = await OrderSchema.findById(id)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      })

    return doc ? mapDocToOrder(doc) : null
  },

  async create ({ input }) {
    // Validate that all products exist and have sufficient stock
    const products = await Product.find({
      _id: { $in: input.items.map(i => i.product) }
    })

    if (products.length !== input.items.length) {
      throw new Error('One or more products not found')
    }

    // Check stock availability
    for (const item of input.items) {
      const product = products.find(p => p._id.toString() === item.product)
      if (!product || product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product?.name || 'unknown'}`)
      }
    }

    // Create order
    const doc = await OrderSchema.create({
      buyer: input.buyer,
      items: input.items,
      total: input.total,
      status: input.status || 'pending'
    })

    // Update product quantities
    for (const item of input.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { new: false }
      )
    }

    const populatedDoc = await OrderSchema.findById(doc._id)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      })

    return mapDocToOrder(populatedDoc!)
  },

  async update ({ id, input }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    // Handle items update if provided (stock restoration/deduction)
    if (input.items) {
      const currentOrder = await OrderSchema.findById(id)
      if (!currentOrder) return null

      // Restore stock for old items
      for (const item of currentOrder.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } },
          { new: false }
        )
      }

      // Validate new items
      const products = await Product.find({
        _id: { $in: input.items.map(i => i.product) }
      })

      for (const item of input.items) {
        const product = products.find(p => p._id.toString() === item.product)
        if (!product || product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product?.name || 'unknown'}`)
        }
      }

      // Deduct stock for new items
      for (const item of input.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: -item.quantity } },
          { new: false }
        )
      }
    }

    const updateData: Record<string, any> = {}
    if (input.status) updateData.status = input.status
    if (input.items) updateData.items = input.items

    const doc = await OrderSchema.findByIdAndUpdate(id, updateData, { new: true })
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      })

    return doc ? mapDocToOrder(doc) : null
  },

  async delete ({ id }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false

    const order = await OrderSchema.findById(id)
    if (!order) return false

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { new: false }
      )
    }

    const result = await OrderSchema.findByIdAndDelete(id)
    return result !== null
  }
}
