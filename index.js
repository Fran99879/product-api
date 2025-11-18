import express, { json } from 'express'
//import cors from 'cors'
import { validateProduct } from './schemas/prodcut.js'


import products from './products.json' with { type: 'json'}

const app = express()

app.disable('x-powered-by')
app.use(json())

app.get('/', (req, res) => {
  res.json({ message: 'Hola' })
})

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

app.post('/products', validateProduct, (req, res) => {
  const result = validateProduct(req.body)

  if(result.error) return res.status(400).json({ error: result.error.message })

  // Encontra el ID mas alto y generar el siguiente ID incremental
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

const PORT = process.env.PORT ?? 1212

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})