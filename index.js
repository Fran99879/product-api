import express, { json } from 'express'
import cors from 'cors'
import { validateProduct, validatePartialProduct } from './schemas/prodcut.js'

import products from './products.json' with { type: 'json'}

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080'
    ]
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
      return callback(null, origin)
    }
    return callback(new Error('Not allowed by CORS'))
  }
}))
app.disable('x-powered-by')
app.use(json())



app.get('/products', (req, res) => {
  const { marca } = req.query
  if (marca) {
    const filteredProducts = products.filter(p =>
      p.marca.toLowerCase() === marca.toLowerCase()
    )
    return res.json(filteredProducts)
  }
  res.json(products)
})

app.get('/products/:id', (req, res) => {
  const { id } = req.params
  const prod = products.find(p => p.id === id)
  if (prod) return res.json(prod)

  res.status(404).json({ message: 'No se encontro el producto' })
})

app.post('/products', (req, res) => {
  const result = validateProduct(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const maxId = products.length > 0
    ? Math.max(...products.map(p => parseInt(p.id) || 0))
    : 0
  const newId = (maxId + 1).toString()

  const newProd = {
    id: newId,
    ...result.data
  }

  products.push(newProd)

  res.status(201).json(newProd)
})

app.patch('/products/:id', (req, res) => {
  const result = validatePartialProduct(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const prodIndex = products.findIndex(p => p.id === id)

  if (prodIndex === -1) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const updateProd = {
    ...products[prodIndex],
    ...result.data
  }

  products[prodIndex] = updateProd

  return res.json(updateProd)

})

app.delete('/products/:id', (req, res) => {
  const { id } = req.params
  const prodIndex = products.findIndex(p => p.id === id)

  if (prodIndex === -1) {
    return res.status(404).json({ message: 'Product not found' })
  }

  products.splice(prodIndex, 1)

  return res.json({ message: 'Product deleted' })
})

const PORT = process.env.PORT ?? 1212

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})