import Order from '../../models/mongo/order/order.js'
import Product from '../../models/mongo/product/product.js'

export const createOrder = async (req, res) => {
  try {
    const products = await Product.find({
      _id: { $in: req.body.items.map(i => i.product) }
    })

    const items = req.body.items.map(item => {
      const product = products.find(p => p._id.toString() === item.product)

      return {
        product: product._id,
        quantity: item.quantity,
        price: product.price
      }
    })

    const total = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    )

    const order = await Order.create({
      buyer: req.user.id,
      items,
      total
    })

    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ buyer: req.user.id })
    .populate('items.product')

  res.json(orders)
}

export const getSellerOrders = async (req, res) => {
  const orders = await Order.find({
    'items.product': {
      $in: await Product.find({ owner: req.user.id }).distinct('_id')
    }
  }).populate('items.product')

  res.json(orders)
}

export const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('buyer')
    .populate('items.product')

  res.json(orders)
}
