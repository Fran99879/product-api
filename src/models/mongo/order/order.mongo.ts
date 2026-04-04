import mongoose, { Document, Types, UpdateQuery } from 'mongoose'
import { Order as OrderSchema } from '../../../schemas/order.mongodb.js'
import { Product } from '../../../schemas/product.mongodb.js'

import type { OrderModel } from '../../order.model.js'
import type { Order } from '../../../schemas/order.schema.js'

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

type PopulatedOwner = {
  _id: Types.ObjectId
}

type PopulatedProduct = {
  _id: Types.ObjectId
  owner: PopulatedOwner
}

type PopulatedOrderItem = {
  product: PopulatedProduct
  quantity: number
  price: number
}

type PopulatedOrderDoc = Document & {
  _id: Types.ObjectId
  buyer: Types.ObjectId
  items: PopulatedOrderItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const mapDocToOrder = (doc: PopulatedOrderDoc): Order => ({
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

const filterUndefined = <T extends Record<string, unknown>>(obj: T) => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export const MongoOrderModel: OrderModel = {
  async create(input) {
    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const productIds = input.items.map(i => new Types.ObjectId(i.product))

      const products = await Product.find({
        _id: { $in: productIds }
      }).session(session) as Array<
        Document & {
          _id: Types.ObjectId
          price: number
          quantity: number
          name?: string
        }
      >

      if (products.length !== input.items.length) {
        throw new Error('One or more products not found')
      }

      const items: OrderItemDoc[] = input.items.map(i => {
        const p = products.find(pp => pp._id.equals(i.product))!

        if (p.quantity < i.quantity) {
          throw new Error(
            `Insufficient stock for product ${p.name || p._id.toString()}`
          )
        }

        return {
          product: new Types.ObjectId(i.product),
          quantity: i.quantity,
          price: p.price
        }
      })

      const total = items.reduce(
        (acc, it) => acc + it.price * it.quantity,
        0
      )

      for (const it of items) {
        await Product.findByIdAndUpdate(
          it.product,
          { $inc: { quantity: -it.quantity } },
          { session }
        )
      }

      const createdDocs = await OrderSchema.create(
      [
        {
          buyer: new Types.ObjectId(input.buyer),
          items,
          total,
          status: 'pending'
        }
      ],
      { session }
    )
    const created = createdDocs[0]

    if (!created) {
      throw new Error('Order creation failed')
    }

      await session.commitTransaction()

      const populated = await OrderSchema.findById(created._id)
        .populate('buyer', 'username email')
        .populate({
          path: 'items.product',
          select: '-quantity',
          populate: { path: 'owner', select: 'username' }
        }) as PopulatedOrderDoc | null

      if (!populated) throw new Error('Failed to retrieve created order')

      return mapDocToOrder(populated)
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  },

  async getById(id) {
    if (!Types.ObjectId.isValid(id)) return null

    const doc = await OrderSchema.findById(id)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      }) as PopulatedOrderDoc | null

    return doc ? mapDocToOrder(doc) : null
  },

  async getAll(params) {
    const query: Record<string, unknown> = {}

    if (params?.role === 'seller' && params.userId) {
      const sellerProducts = await Product.find({
        owner: params.userId
      }).distinct('_id')

      query['items.product'] = { $in: sellerProducts }
    } else if (params?.role === 'user' && params.userId) {
      query.buyer = new Types.ObjectId(params.userId)
    }

    const docs = await OrderSchema.find(query)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      }) as unknown as PopulatedOrderDoc[]

    return docs.map(mapDocToOrder)
  },

  async update(id, input) {

    if (!Types.ObjectId.isValid(id)) return null
    
    const updateData = filterUndefined(input as Record<string, unknown>)

    const doc = await OrderSchema.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date()
      } as UpdateQuery<OrderDoc>,
      { new: true }
    )
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      }) as PopulatedOrderDoc | null

    return doc ? mapDocToOrder(doc) : null
  },

  async cancel(id) {
    if (!Types.ObjectId.isValid(id)) return null

    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const order = await OrderSchema.findById(id)
        .session(session) as PopulatedOrderDoc | null

      if (!order) return null

      if (order.status === 'pending') {
        for (const it of order.items) {
          await Product.findByIdAndUpdate(
            it.product,
            { $inc: { quantity: it.quantity } },
            { session }
          )
        }
      }

      order.status = 'cancelled'
      order.updatedAt = new Date()

      await order.save({ session })

      await session.commitTransaction()

      const populated = await OrderSchema.findById(id)
        .populate('buyer', '-role')
        .populate({
          path: 'items.product',
          select: '-quantity',
          populate: { path: 'owner', select: 'username' }
        }) as PopulatedOrderDoc | null

      return populated ? mapDocToOrder(populated) : null
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  },

  async delete() {
    return false
  },

  async getByUser(userId) {
    const docs = await OrderSchema.find({
      buyer: new Types.ObjectId(userId)
    })
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      }) as unknown as PopulatedOrderDoc[]

    return docs.map(mapDocToOrder)
  },

  async getSellerOrders(sellerId) {
    const sellerProducts = await Product.find({
      owner: sellerId
    }).distinct('_id')

    const docs = await OrderSchema.find({
      'items.product': { $in: sellerProducts }
    })
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' }
      }) as unknown as PopulatedOrderDoc[]

    return docs.map(mapDocToOrder)
  }
}
