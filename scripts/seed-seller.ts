/**
 * Seed de datos de prueba: crea (o reusa) un vendedor y le carga varios
 * productos con distintos precios, stock y estados para testear el catálogo,
 * el detalle, los estados de stock y el flujo de compra.
 *
 * Uso:  pnpm tsx scripts/seed-seller.ts
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { UserMongo } from '../src/models/mongo/user/user.js'
import { Product } from '../src/schemas/product.mongodb.js'

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) throw new Error('Falta MONGO_URI en el .env')

const SELLER = {
  username: 'seller_demo',
  email: 'seller@electrostore.test',
  password: 'Seller1234',
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`

type SeedProduct = {
  name: string
  description: string
  price: number
  image: string
  brand: string
  category: string
  model: string
  rate: number
  quantity: number
  isActive: boolean
  specs: Record<string, string>
}

const PRODUCTS: SeedProduct[] = [
  {
    name: 'iPhone 15 Pro',
    description:
      'El iPhone más avanzado con chip A17 Pro, titanio y cámara de 48MP. Ideal para fotografía y gaming.',
    price: 1499999.99,
    image: img('iphone15pro'),
    brand: 'Apple',
    category: 'smartphone',
    model: 'A2848',
    rate: 9.4,
    quantity: 25,
    isActive: true,
    specs: { Pantalla: '6.1" OLED', RAM: '8GB', Almacenamiento: '256GB', Batería: '3274mAh' },
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description:
      'Galaxy S24 Ultra con S-Pen, pantalla Dynamic AMOLED 2X y cámara de 200MP con IA.',
    price: 1299990,
    image: img('galaxys24'),
    brand: 'Samsung',
    category: 'smartphone',
    model: 'SM-S928',
    rate: 9.1,
    quantity: 8,
    isActive: true,
    specs: { Pantalla: '6.8" AMOLED', RAM: '12GB', Almacenamiento: '512GB' },
  },
  {
    name: 'MacBook Air M3',
    description:
      'Ultraliviana, silenciosa y con hasta 18 horas de batería. Chip M3 para trabajo y creatividad.',
    price: 1850000,
    image: img('macbookair'),
    brand: 'Apple',
    category: 'laptop',
    model: 'M3-2024',
    rate: 9.6,
    quantity: 12,
    isActive: true,
    specs: { Chip: 'Apple M3', RAM: '16GB', SSD: '512GB', Pantalla: '13.6" Liquid Retina' },
  },
  {
    name: 'Notebook Lenovo IdeaPad 3',
    description:
      'Notebook para estudio y trabajo diario, con Ryzen 5 y SSD veloz. Excelente relación precio/rendimiento.',
    price: 599999,
    image: img('lenovoideapad'),
    brand: 'Lenovo',
    category: 'laptop',
    model: 'IdeaPad 3 15ALC',
    rate: 7.8,
    quantity: 3,
    isActive: true,
    specs: { CPU: 'Ryzen 5 5500U', RAM: '8GB', SSD: '256GB', Pantalla: '15.6" FHD' },
  },
  {
    name: 'Monitor LG UltraGear 27"',
    description:
      'Monitor gamer 27" QHD 165Hz con 1ms y G-Sync. Colores vivos y respuesta ultrarrápida.',
    price: 349900,
    image: img('lgultragear'),
    brand: 'LG',
    category: 'monitor',
    model: '27GP850',
    rate: 8.9,
    quantity: 15,
    isActive: true,
    specs: { Tamaño: '27"', Resolución: 'QHD 2560x1440', Refresco: '165Hz', Panel: 'IPS' },
  },
  {
    name: 'Auriculares Sony WH-1000XM5',
    description:
      'Cancelación de ruido líder en la industria, sonido premium y 30hs de batería.',
    price: 429999.5,
    image: img('sonyxm5'),
    brand: 'Sony',
    category: 'headphones',
    model: 'WH-1000XM5',
    rate: 9.3,
    quantity: 40,
    isActive: true,
    specs: { Tipo: 'Over-ear', ANC: 'Sí', Batería: '30h', Conexión: 'Bluetooth 5.2' },
  },
  {
    name: 'PlayStation 5 Slim',
    description:
      'Consola PS5 edición Slim con lector de discos. Carga ultrarrápida y gráficos 4K.',
    price: 899999,
    image: img('ps5slim'),
    brand: 'Sony',
    category: 'gaming',
    model: 'CFI-2000',
    rate: 9.5,
    quantity: 2,
    isActive: true,
    specs: { Almacenamiento: '1TB SSD', Resolución: '4K', GPU: 'RDNA 2' },
  },
  {
    name: 'Apple Watch Series 9',
    description:
      'Smartwatch con pantalla más brillante, gesto de doble toque y chip S9. Salud y deporte en tu muñeca.',
    price: 649000,
    image: img('applewatch9'),
    brand: 'Apple',
    category: 'smartwatch',
    model: 'Series 9 GPS 45mm',
    rate: 8.7,
    quantity: 0, // sin stock: para testear el estado "Sin stock"
    isActive: true,
    specs: { Pantalla: 'Retina LTPO', GPS: 'Sí', Resistencia: 'WR50' },
  },
  {
    name: 'SSD Samsung 990 Pro 2TB',
    description:
      'SSD NVMe Gen4 de altísima velocidad para gaming y edición de video profesional.',
    price: 289990,
    image: img('samsung990'),
    brand: 'Samsung',
    category: 'storage',
    model: '990 PRO 2TB',
    rate: 9.0,
    quantity: 30,
    isActive: true,
    specs: { Capacidad: '2TB', Interfaz: 'PCIe 4.0 NVMe', Lectura: '7450 MB/s' },
  },
  {
    name: 'Teclado Mecánico Redragon Kumara',
    description:
      'Teclado mecánico retroiluminado, switches azules y construcción resistente. (Producto pausado)',
    price: 45999,
    image: img('redragon'),
    brand: 'Redragon',
    category: 'accessories',
    model: 'K552',
    rate: 8.1,
    quantity: 20,
    isActive: false, // inactivo: para testear el estado "Producto inactivo"
    specs: { Switches: 'Outemu Blue', Iluminación: 'RGB', Formato: 'TKL' },
  },
]

async function main() {
  await mongoose.connect(MONGO_URI!)
  console.log('✓ Conectado a MongoDB')

  // --- Vendedor ---
  let seller = await UserMongo.findOne({ email: SELLER.email })
  if (!seller) {
    const password = await bcrypt.hash(SELLER.password, 10)
    seller = await UserMongo.create({
      username: SELLER.username,
      email: SELLER.email,
      password,
      role: 'seller',
      emailVerified: true,
    })
    console.log(`✓ Vendedor creado: ${SELLER.email}`)
  } else {
    // Asegurar rol seller y email verificado en reruns.
    seller.set({ role: 'seller', emailVerified: true })
    await seller.save()
    console.log(`• Vendedor ya existía, actualizado: ${SELLER.email}`)
  }

  // --- Productos (evita duplicar por owner+model en reruns) ---
  let created = 0
  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ owner: seller._id, model: p.model })
    if (exists) continue
    await Product.create({ ...p, owner: seller._id })
    created++
  }
  console.log(`✓ Productos creados: ${created} (de ${PRODUCTS.length} definidos)`)

  await mongoose.disconnect()
  console.log('✓ Listo')
}

main().catch((e) => {
  console.error('✗ Error en el seed:', e)
  process.exit(1)
})
