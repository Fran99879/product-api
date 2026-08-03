import { Types } from 'mongoose'
import { Order as OrderSchema } from '../../../schemas/order.mongodb.js'
import { Product } from '../../../schemas/product.mongodb.js'
import type { OrderModel } from '../../order.model.js'

import { mapDocToOrder, type PopulatedOrderDoc } from './order.types.js'

// Tope de resultados de los listados de órdenes: evita traer toda la colección
// (riesgo de OOM/timeout a escala). Se devuelven las más recientes. La
// paginación con UI queda para un sprint de frontend.
const ORDER_LIST_LIMIT = 100

export const orderQueries: Pick<
  OrderModel,
  'getById' | 'getAll' | 'getByUser' | 'getSellerOrders'
> = {
  async getById(id) {
    if (!Types.ObjectId.isValid(id)) return null

    const doc = (await OrderSchema.findById(id)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' },
      })) as PopulatedOrderDoc | null

    return doc ? mapDocToOrder(doc) : null
  },

  async getAll(params) {
    const query: Record<string, unknown> = {}

    if (params?.role === 'seller' && params.userId) {
      const sellerProducts = await Product.find({
        owner: params.userId,
      }).distinct('_id')

      query['items.product'] = { $in: sellerProducts }
    } else if (params?.role === 'user' && params.userId) {
      query.buyer = new Types.ObjectId(params.userId)
    }

    const docs = (await OrderSchema.find(query)
      .sort({ createdAt: -1 })
      .limit(ORDER_LIST_LIMIT)
      .populate('buyer', '-role')
      .populate({
        path: 'items.product',
        select: '-quantity',
        populate: { path: 'owner', select: 'username' },
      })) as unknown as PopulatedOrderDoc[]

    return docs.map(mapDocToOrder)
  },
  async getByUser(userId) {
  const docs = (await OrderSchema.find({
    buyer: new Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .limit(ORDER_LIST_LIMIT)
    .populate('buyer', '-role')
    .populate({
      path: 'items.product',
      select: '-quantity',
      populate: { path: 'owner', select: 'username' },
    })) as unknown as PopulatedOrderDoc[]

  return docs.map(mapDocToOrder)
},

 async getSellerOrders(sellerId) {
  const sellerProducts = await Product.find({
    owner: sellerId,
  }).distinct('_id')

  const sellerProductIds = sellerProducts.map(id => id.toString())

  const docs = (await OrderSchema.find({
    'items.product': { $in: sellerProducts },
  })
    .sort({ createdAt: -1 })
    .limit(ORDER_LIST_LIMIT)
    .populate('buyer', '-role')
    .populate({
      path: 'items.product',
      select: '-quantity',
      populate: { path: 'owner', select: 'username' },
    })) as unknown as PopulatedOrderDoc[]

  const orders = docs.map(mapDocToOrder)

  return orders
    .map((order) => {
      const items = order.items.filter((item) =>
        sellerProductIds.includes(item.product.id)
      )

      if (items.length === 0) return null

      const total = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      )

      return {
        ...order,
        items,
        total,
      }
    })
    .filter((o): o is NonNullable<typeof o> => o !== null)
},
}
