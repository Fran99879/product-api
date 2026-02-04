import Order from '../../models/mongo/order/order.js'
import { Product } from '../../schemas/product.mongodb.js'

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

    // verificar stock suficiente
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product.toString())
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Stock insuficiente para el producto ${product.name}` })
      }
    }

    const order = await Order.create({
      buyer: req.user.id,
      items,
      total
    })

    // actualizar stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } })
    }

    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ buyer: req.user.id })
    .populate({
      path: 'items.product',
      select: '-quantity',
      populate: { path: 'owner', select: 'username' }
    })

  res.json(orders)
}

export const getSellerOrders = async (req, res) => {
  const orders = await Order.find({
    'items.product': {
      $in: await Product.find({ owner: req.user.id }).distinct('_id')
    }
  }).populate({
    path: 'items.product',
    select: '-quantity',
    populate: { path: 'owner', select: 'username' }
  })

  res.json(orders)
}

export const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('buyer', '-role')
    .populate({
      path: 'items.product',
      select: '-quantity',
      populate: { path: 'owner', select: 'username' }
    })

  res.json(orders)
}

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own orders' })
    }

    // Restaurar stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } })
    }

    await Order.findByIdAndDelete(req.params.id)

    res.json({ message: 'Order deleted and stock restored' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Populate para verificar owner
    await order.populate('items.product')

    // Permisos
    const isBuyer = order.buyer.toString() === req.user.id
    const isAdmin = req.user.role === 'admin'
    const isSeller = req.user.role === 'seller'

    if (!isAdmin) {
      if (isBuyer && status === 'cancelled') {
        // Buyer puede cancelar
      } else if (isSeller && status === 'shipped') {
        // Seller puede marcar como shipped si tiene productos en la orden
        const hasSellerProducts = order.items.some(item => item.product.owner.toString() === req.user.id)
        if (!hasSellerProducts) {
          return res.status(403).json({ message: 'You can only ship orders with your products' })
        }
      } else {
        return res.status(403).json({ message: 'Not allowed' })
      }
    }

    // Restaurar stock si cancela
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } })
      }
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

