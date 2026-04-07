import mongoose, { Types } from 'mongoose'
import type { OrderModel } from '../../order.model.js'
import { Order as OrderSchema } from '../../../schemas/order.mongodb.js'
import { Product } from '../../../schemas/product.mongodb.js'

import { canTransitionOrderStatus, type OrderStatus } from '../../../types/order.js'

import { mapDocToOrder, type PopulatedOrderDoc } from './order.types.js'

export const orderStatusMethods: Pick<OrderModel, 'cancel' | 'updateStatus'> = {
  async cancel(id) {
    if (!Types.ObjectId.isValid(id)) return null

    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const order = (await OrderSchema.findById(id).session(session)) as PopulatedOrderDoc | null

      if (!order) return null

      const previousStatus = order.status

      if (!canTransitionOrderStatus(previousStatus, 'cancelled')) {
        throw new Error(`Invalid transition from ${previousStatus} to cancelled`)
      }

      if (previousStatus === 'pending') {
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

      const populated = (await OrderSchema.findById(id)
        .populate('buyer', '-role')
        .populate({
          path: 'items.product',
          select: '-quantity',
          populate: { path: 'owner', select: 'username' },
        })) as PopulatedOrderDoc | null

      return populated ? mapDocToOrder(populated) : null
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  },

  async updateStatus(id: string, nextStatus: OrderStatus) {
    if (!Types.ObjectId.isValid(id)) return null

    const order = await OrderSchema.findById(id)

    if (!order) return null

    const currentStatus = order.status as OrderStatus

    if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${nextStatus}`)
    }

    order.status = nextStatus
    order.updatedAt = new Date()

    await order.save()

    const populated = (await OrderSchema.findById(id)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' },
      })) as PopulatedOrderDoc | null

    return populated ? mapDocToOrder(populated) : null
  },
}
