import express, { json } from 'express'
//import cors from 'cors'

import data from './products.json' with { type: 'json'}

const products = data.products

const app = express()

app.disable('x-powered-by')

app.get('/products', (req, res) => {
  res.json(products)
})

app.get('/products/:id', (req, res) => {
  const { id } = req.params
  const prod = products.find(p => String(p.id) === id)
  if (prod) return res.json(prod)
  res.status(404).json({ message: 'No se encontro producto' })
})

const PORT = process.env.PORT ?? 1212

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})