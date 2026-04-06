import mysql from 'mysql2/promise'
import type {
  ConnectionOptions,
  RowDataPacket,
  ResultSetHeader
} from 'mysql2'

import type {
  Product,
  ProductInput,
  ProductUpdate,
  UpdateProductDTO
} from '../../../schemas/product.js'

import type { ProductModel as ProductModelInterface } from '../../product.model.js'


/* =========================
   CONNECTION
========================= */

const DEFAULT_CONFIG: ConnectionOptions = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: '',
  database: 'productdb'
}

const connection = process.env.DATABASE_URL
  ? await mysql.createConnection(process.env.DATABASE_URL)
  : await mysql.createConnection(DEFAULT_CONFIG)

/* =========================
   DB ROW TYPES
========================= */

interface ProductRow extends RowDataPacket {
  id: number
  nombre: string
  descripcion: string
  precio: number
  image: string
  rate: number
  marca: string
}

/* =========================
   MAPPER DB → DOMAIN
========================= */

const mapRowToProduct = (row: ProductRow): Product => ({
  id: String(row.id),
  name: row.nombre,
  description: row.descripcion,
  price: row.precio,
  image: row.image,
  brand: row.marca as Product['brand'],
  rate: row.rate,
  quantity: 0, //  no existe en DB todavía
  owner: undefined //  no existe en DB todavía
})

/* =========================
   MODEL
========================= */

export const MysqlProductModel: ProductModelInterface = {

  async getAll ({ brand }: { brand?: string }): Promise<Product[]> {
    let rows: ProductRow[]

    if (brand) {
      const [result] = await connection.query<ProductRow[]>(
        `SELECT p.id, p.nombre, p.descripcion, p.precio, p.image, p.rate,
                m.nombre AS marca
         FROM product p
         JOIN product_marca pm ON pm.product_id = p.id
         JOIN marca m ON m.id = pm.marca_id
         WHERE LOWER(m.nombre) = LOWER(?)`,
        [brand]
      )
      rows = result
    } else {
      const [result] = await connection.query<ProductRow[]>(
        `SELECT p.id, p.nombre, p.descripcion, p.precio, p.image, p.rate,
                m.nombre AS marca
         FROM product p
         JOIN product_marca pm ON pm.product_id = p.id
         JOIN marca m ON m.id = pm.marca_id`
      )
      rows = result
    }

    return rows.map(mapRowToProduct)
  },

  async getByOwner (): Promise<Product[]> {
    // aún no existe owner en DB
    return []
  },

  async getById ({ id }: { id: string }): Promise<Product | null> {
    const [rows] = await connection.query<ProductRow[]>(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.image, p.rate,
              m.nombre AS marca
       FROM product p
       JOIN product_marca pm ON pm.product_id = p.id
       JOIN marca m ON m.id = pm.marca_id
       WHERE p.id = ?`,
      [id]
    )

    const row = rows[0]
    if (!row) return null
    return mapRowToProduct(row)

  },

  async create ({ input }: { input: ProductInput }): Promise<Product> {
    const { name, description, price, image, rate, brand } = input

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO product (nombre, descripcion, precio, image, rate)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description, price, image, rate]
    )

    const productId = result.insertId

    // obtener/crear marca
    const [brands] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM marca WHERE nombre = ?',
      [brand]
    )

    let brandId: number

    const brandRow = brands[0]

    if (!brandRow) {
      const [brandResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO marca (nombre) VALUES (?)',
      [brand]
    )
      brandId = brandResult.insertId
    } else {
      brandId = brandRow.id
    }

    await connection.query(
      'INSERT INTO product_marca (product_id, marca_id) VALUES (?, ?)',
      [productId, brandId]
    )

    return {
      id: String(productId),
      ...input
    }
  },

  async update ({ id, input }: { id: string; input: UpdateProductDTO }): Promise<Product | null> {
    const existing = await this.getById({ id })
    if (!existing) return null

    // Construir SET dinámico solo con campos presentes en el DTO
    const setters: string[] = []
    const params: unknown[] = []

    if (input.name !== undefined) {
      setters.push('nombre = ?')
      params.push(input.name)
    }
    if (input.description !== undefined) {
      setters.push('descripcion = ?')
      params.push(input.description)
    }
    if (input.price !== undefined) {
      setters.push('precio = ?')
      params.push(input.price)
    }
    if (input.image !== undefined) {
      setters.push('image = ?')
      params.push(input.image)
    }
    if (input.rate !== undefined) {
      setters.push('rate = ?')
      params.push(input.rate)
    }

    if (setters.length > 0) {
      const sql = `UPDATE product SET ${setters.join(', ')} WHERE id = ?`
      params.push(id)
      await connection.query<ResultSetHeader>(sql, params)
    }

    // Manejar brand (relación product_marca) si viene en DTO
    if (input.brand !== undefined) {
      const [brands] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM marca WHERE nombre = ?',
        [input.brand]
      )

      let brandId: number
      const brandRow = brands[0]
      if (!brandRow) {
        const [brandResult] = await connection.query<ResultSetHeader>(
          'INSERT INTO marca (nombre) VALUES (?)',
          [input.brand]
        )
        brandId = brandResult.insertId
      } else {
        brandId = brandRow.id
      }

      await connection.query('DELETE FROM product_marca WHERE product_id = ?', [id])
      await connection.query('INSERT INTO product_marca (product_id, marca_id) VALUES (?, ?)', [id, brandId])
    }

    // Mapper/merge seguro para devolver la entidad actualizada
    const merged: Product = {
      id: existing.id,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      price: input.price ?? existing.price,
      image: input.image ?? existing.image,
      brand: input.brand ?? existing.brand,
      rate: input.rate ?? existing.rate,
      quantity: input.quantity ?? existing.quantity,
      owner: input.owner ?? existing.owner
    }

    return merged
  }
,

  async delete ({ id }: { id: string }): Promise<boolean> {
    const [result] = await connection.query<ResultSetHeader>(
      'DELETE FROM product WHERE id = ?',
      [id]
    )

    return result.affectedRows > 0
  }
}
