export const canEditProduct = (productModel) => {
  return async (req, res, next) => {
    const product = await productModel.getById({ id: req.params.id })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    if (
      product.owner.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not allowed' })
    }

    req.product = product
    next()
  }
}
