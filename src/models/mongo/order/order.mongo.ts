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

/** Detecta el error E11000 de índice único de Mongo (clave duplicada). */
const isDuplicateKeyError = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && 'code' in e && (e as { code?: number }).code === 11000

/** Query de mongoose encadenable por populate (mongoose muta y devuelve la misma query). */
interface PopulatableQuery {
  populate(path: string, select: string): PopulatableQuery
  populate(opts: unknown): PopulatableQuery
}

/** Populate compartido para devolver una orden completa (comprador + producto + owner). */
const populateOrder = <T>(query: T): T => {
  ;(query as unknown as PopulatableQuery)
    .populate('buyer', 'username email')
    .populate({
      path: 'items.product',
      select: '-quantity',
      populate: { path: 'owner', select: 'username' },
    })
  return query
}

export const MongoOrderModel: OrderModel = {
  async create(input) {
    // Idempotencia: si ya existe una orden con esta clave para el mismo comprador,
    // la devolvemos tal cual en vez de crear un duplicado (doble-click / reintento).
    if (input.idempotencyKey) {
      const existing = (await populateOrder(
        OrderSchema.findOne({
          idempotencyKey: input.idempotencyKey,
          buyer: new Types.ObjectId(input.buyer),
        })
      )) as PopulatedOrderDoc | null
      if (existing) return mapDocToOrder(existing)
    }

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
          discountPercent?: number
          quantity: number
          isActive?: boolean
          name?: string
        }
      >

      if (products.length !== input.items.length) {
        throw new Error('One or more products not found')
      }

      const items: OrderItemDoc[] = input.items.map((i) => {
        const p = products.find((pp) => pp._id.equals(i.product))!

        if (p.isActive === false) {
          throw new Error(`Product "${p.name || p._id.toString()}" is not available`)
        }

        if (p.quantity < i.quantity) {
          throw new Error(`Insufficient stock for product ${p.name || p._id.toString()}`)
        }

        // Precio efectivo con la oferta aplicada (misma fórmula que el front).
        const pct = Math.min(95, Math.max(0, Math.round(p.discountPercent ?? 0)))
        const unitPrice = pct > 0 ? Math.round(p.price * (1 - pct / 100)) : p.price

        return {
          product: new Types.ObjectId(i.product),
          quantity: i.quantity,
          price: unitPrice,
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
            idempotencyKey: input.idempotencyKey,
          },
        ],
        { session }
      )
      const created = createdDocs[0]

      if (!created) {
        throw new Error('Order creation failed')
      }
      await session.commitTransaction()

      const populated = (await populateOrder(
        OrderSchema.findById(created._id)
      )) as PopulatedOrderDoc | null

      if (!populated) throw new Error('Failed to retrieve created order')

      return mapDocToOrder(populated)
    } catch (error) {
      // Solo abortar si la transacción sigue activa: si el error ocurre
      // después del commit, abortTransaction() tiraría y enmascararía el error real.
      if (session.inTransaction()) {
        await session.abortTransaction()
      }
      // Carrera: otra request con la misma idempotencyKey ganó y el índice único
      // rechazó esta. Devolvemos la orden que sí se creó, sin duplicar.
      if (input.idempotencyKey && isDuplicateKeyError(error)) {
        const existing = (await populateOrder(
          OrderSchema.findOne({
            idempotencyKey: input.idempotencyKey,
            buyer: new Types.ObjectId(input.buyer),
          })
        )) as PopulatedOrderDoc | null
        if (existing) return mapDocToOrder(existing)
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
