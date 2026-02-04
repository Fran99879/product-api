import products from '../../products.json' with { type: 'json'}

export class ProductModel {
  static async getAll ({ marca }) {
    if (marca) {
      return products.filter(product =>
        product.marca.toLowerCase() === marca.toLowerCase()
      );
    }
    return products;
  }
  static async getById (id) {
    const pro = products.find(p => p.id === id);
    return pro
  }
  static async create ({ input }) {
    const maxId = products.length > 0
      ? Math.max(...products.map(p => parseInt(p.id) || 0))
      : 0
    const newId = (maxId + 1).toString()

    const newProd = {
      id: newId,
      ...input
    }

    products.push(newProd)
    return newProd
  }
  static async delete ({ id }) {
    const prodIndex = products.findIndex(p => p.id === id)
    if (prodIndex === -1) return false

    products.splice(prodIndex, 1)
    return true
  }
  static async update ({ id, input }) {
    const prodIndex = products.findIndex(p => p.id === id)
    if (prodIndex === -1) return null
    products[prodIndex] = {
      ...products[prodIndex],
      ...input
    }
    return products[prodIndex]
  }
}