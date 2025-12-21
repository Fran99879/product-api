import mysql from 'mysql2/promise'

const DEFAULT_CONFIG = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: '',
  database: 'productdb'
}
const connectionstring = process.env.DATABASE_URL ?? DEFAULT_CONFIG


const connection = await mysql.createConnection(connectionstring)

export class ProductModel {
  static async getAll ({ marca }) {
    // FILTRO POR MARCA
    if (marca) {
      const lowerCaseMarca = marca.toLowerCase();

      const [marcas] = await connection.query(
        'SELECT id FROM marca WHERE LOWER(nombre) = ?;',
        [lowerCaseMarca]
      );

      if (marcas.length === 0) return [];

      const { id: marcaId } = marcas[0];

      const [productos] = await connection.query(
        `SELECT p.id, p.nombre, p.descripcion, p.precio, p.image, p.rate,
              m.nombre AS marca
       FROM product p
       INNER JOIN product_marca pm ON pm.product_id = p.id
       INNER JOIN marca m ON m.id = pm.marca_id
       WHERE m.id = ?;`,
        [marcaId]
      );

      return productos;
    }

    const [productos] = await connection.query(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.image, p.rate,
            m.nombre AS marca
     FROM product p
     INNER JOIN product_marca pm ON pm.product_id = p.id
     INNER JOIN marca m ON m.id = pm.marca_id;`
    );

    return productos;
  }

  static async getById ({ id }) {
    const [productos] = await connection.query(
      `SELECT nombre, descripcion, precio, image, rate, id FROM product WHERE id = ?;`,
      [id]
    )
    if (productos.length === 0) return null
    return productos[0]
  }


  static async create ({ input }) {
    const { nombre, descripcion, precio, image, rate, marca } = input
    try {
      const [result] = await connection.query(
        `INSERT INTO product (nombre, descripcion, precio, image, rate)
         VALUES (?, ?, ?, ?, ?);`,
        [nombre, descripcion, precio, image, rate]
      )

    } catch (error) {
      throw new Error('Error al crear el producto: ' + error.message)
    }
    const productId = result.insertId

    const [marcas] = await connection.query(
      'SELECT id FROM marca WHERE nombre = ?;',
      [marca]
    )
    let marcaId
    if (marcas.length === 0) {
      const [marcaResult] = await connection.query(
        'INSERT INTO marca (nombre) VALUES (?);',
        [marca]
      )
      marcaId = marcaResult.insertId
    }
    else {
      marcaId = marcas[0].id
    }
    await connection.query(
      'INSERT INTO product_marca (product_id, marca_id) VALUES (?, ?);',
      [productId, marcaId]
    )
    return { id: productId, ...input }

  }

  static async delete ({ id }) {
    const [result] = await connection.query(
      'DELETE FROM product WHERE id = ?;',
      [id]
    )
    return result.affectedRows > 0
  }

  static async update ({ id }) {
    const [result] = await connection.query(
      'UPDATE product SET WHERE id = ?;',
      [id]
    )
    return result.affectedRows > 0
  }
}
