import mongoose, { Document, Types, UpdateQuery } from 'mongoose'
import { Order as OrderSchema } from '../../../schemas/order.mongodb.js'
import { Product } from '../../../schemas/product.mongodb.js'
import type { OrderModel } from '../../order.model.js'
import {
  type OrderDoc,
  type OrderItemDoc,
  type PopulatedOrderDoc,
  mapDocToOrder,
  filterUndefined,
} from './order.types.js'
import { orderQueries } from './order.queries.js'
import { orderStatusMethods } from './order.status.js'

export const MongoOrderModel: OrderModel = {
  async create(input) {
    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const productIds = input.items.map((i) => new Types.ObjectId(i.product))

      const products = (await Product.find({
        _id: { $in: productIds },
      }).session(session)) as Array<
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

      const items: OrderItemDoc[] = input.items.map((i) => {
        const p = products.find((pp) => pp._id.equals(i.product))!

        if (p.quantity < i.quantity) {
          throw new Error(`Insufficient stock for product ${p.name || p._id.toString()}`)
        }

        return {
          product: new Types.ObjectId(i.product),
          quantity: i.quantity,
          price: p.price,
        }
      })

      const total = items.reduce((acc, it) => acc + it.price * it.quantity, 0)

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
            status: 'pending',
            shippingAddress: input.shippingAddress,
          },
        ],
        { session }
      )
      const created = createdDocs[0]

      if (!created) {
        throw new Error('Order creation failed')
      }
      await session.commitTransaction()

      const populated = (await OrderSchema.findById(created._id)
        .populate('buyer', 'username email')
        .populate({
          path: 'items.product',
          select: '-quantity',
          populate: { path: 'owner', select: 'username' },
        })) as PopulatedOrderDoc | null

      if (!populated) throw new Error('Failed to retrieve created order')

      return mapDocToOrder(populated)
    } catch (error) {
      // Solo abortar si la transacción sigue activa: si el error ocurre
      // después del commit, abortTransaction() tiraría y enmascararía el error real.
      if (session.inTransaction()) {
        await session.abortTransaction()
      }
      throw error
    } finally {
      session.endSession()
    }
  },
  async update(id, input) {
    if (!Types.ObjectId.isValid(id)) return null

    const updateData = filterUndefined(input as Record<string, unknown>)

    const doc = (await OrderSchema.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<OrderDoc>,
      { new: true }
    )
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' },
      })) as PopulatedOrderDoc | null

    return doc ? mapDocToOrder(doc) : null
  },
  async delete() {
    return false
  },
  ...orderQueries,
  ...orderStatusMethods,
}
