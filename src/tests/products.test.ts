import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createApp } from "../app.js";
import { createModels } from "../models/index.js";

import { UserMongo } from "../models/mongo/user/user.js";
import { Product } from "../schemas/product.mongodb.js";

let app: any;
let sellerToken: string;
let userToken: string;
let sellerId: string;
let token: string;
let productId: string;

describe("Products", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    await UserMongo.deleteMany({});
    await Product.deleteMany({});

    // 👤 USER normal
    const userRegister = await request(app).post("/user/register").send({
      username: "user",
      email: "user@test.com",
      password: "123456",
    });

    const userLogin = await request(app).post("/user/login").send({
      email: "user@test.com",
      password: "123456",
    });

    userToken = userLogin.body.token;

    // 🧑‍💼 SELLER
    const sellerRegister = await request(app).post("/user/register").send({
      username: "seller",
      email: "seller-products@test.com",
      password: "123456",
    });
    console.log("sellerRegister.body");
    console.dir(sellerRegister.body, { depth: null });

    
    sellerId = sellerRegister.body.user?.id || sellerRegister.body.id;
    
    console.log("sellerId:", sellerId);
    
    await UserMongo.findByIdAndUpdate(sellerId, { role: "seller" });

    const sellerLogin = await request(app).post("/user/login").send({
      email: "seller-products@test.com",
      password: "123456",
    });

    sellerToken = sellerLogin.body.token;

  });

  // 🧪 1. Crear producto (seller OK)
  it("should create product as seller", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        name: "MacBook",
        brand: "Apple",
        category: "laptop",
        model: "M3 Pro",
        description: "Laptop de alta gama",
        price: 2000,
        quantity: 5,
        image: "https://test.com/image.jpg",
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("MacBook");
  });

  // 🧪 2. Usuario normal NO puede crear
  it("should NOT allow normal user to create product", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "iPhone",
        brand: "Apple",
        category: "smartphone",
        model: "15 Pro",
        price: 1000,
        description: "Smartphone de alta gama",
        quantity: 5,
        image: "https://test.com/image.jpg",
      });

    
    expect(res.status).toBe(403);
  });

  // 🧪 3. Obtener productos (respuesta paginada)
  it("should get all products", async () => {
    // crear uno primero
    await Product.create({
      name: "iPhone2",
      brand: "Apple",
      category: "smartphone",
      model: "15",
      price: 1000,
      description: "Smartphone de alta gama",
      quantity: 5,
      owner: sellerId,
      image: "https://test.com",
    });

    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  // 🧪 3b. Búsqueda, filtros, sorting y paginación
  describe("catalog queries", () => {
    beforeEach(async () => {
      const base = {
        description: "desc",
        image: "https://test.com/i.jpg",
        owner: () => sellerId,
      };
      await Product.create([
        { ...base, owner: sellerId, name: "MacBook Pro", brand: "Apple", category: "laptop", model: "M3", price: 2000, quantity: 5, rate: 9 },
        { ...base, owner: sellerId, name: "Galaxy S24", brand: "Samsung", category: "smartphone", model: "S24", price: 800, quantity: 0, rate: 8 },
        { ...base, owner: sellerId, name: "Bravia TV", brand: "Sony", category: "tv", model: "X90", price: 1200, quantity: 3, rate: 7 },
      ]);
    });

    it("should search by text", async () => {
      const res = await request(app).get("/products?search=galaxy");
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].name).toBe("Galaxy S24");
    });

    it("should filter by category and price range", async () => {
      const res = await request(app).get("/products?minPrice=1000&maxPrice=2500");
      expect(res.body.total).toBe(2);

      const res2 = await request(app).get("/products?category=tv");
      expect(res2.body.total).toBe(1);
      expect(res2.body.data[0].brand).toBe("Sony");
    });

    it("should filter by stock", async () => {
      const res = await request(app).get("/products?inStock=true");
      expect(res.body.total).toBe(2);
      expect(res.body.data.every((p: any) => p.quantity > 0)).toBe(true);
    });

    it("should sort by price", async () => {
      const res = await request(app).get("/products?sort=price-asc");
      const prices = res.body.data.map((p: any) => p.price);
      // El catálogo ordena los productos SIN stock al final (Galaxy S24, $800,
      // quantity 0), sin importar el sort elegido. Por eso el orden esperado es
      // los con stock por precio asc (1200, 2000) y el sin stock (800) último.
      expect(prices).toEqual([1200, 2000, 800]);
    });

    it("should paginate", async () => {
      const res = await request(app).get("/products?limit=2&page=2");
      expect(res.body.data.length).toBe(1);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.page).toBe(2);
    });

    it("should reject invalid query params", async () => {
      const res = await request(app).get("/products?sort=hacker&limit=9999");
      expect(res.status).toBe(400);
    });
  });

  // 🧪 4. Ownership (otro seller NO puede editar)
  it("should NOT allow another seller to update product", async () => {
    // crear producto con seller A
    const product = await Product.create({
      name: "iPhone2",
      brand: "Apple",
      category: "smartphone",
      model: "15",
      price: 1000,
      quantity: 10,
      image: "https://test.com/image.jpg",
      owner: sellerId,
    });

    // crear seller B
    const otherSellerRegister = await request(app).post("/user/register").send({
      username: "seller2",
      email: "seller2@test.com",
      password: "123456",
    });

    const otherSellerId =
      otherSellerRegister.body.user?.id || otherSellerRegister.body.id;

    await UserMongo.findByIdAndUpdate(otherSellerId, { role: "seller" });

    const otherSellerLogin = await request(app).post("/user/login").send({
      email: "seller2@test.com",
      password: "123456",
    });

    const otherSellerToken = otherSellerLogin.body.token;

    const res = await request(app)
      .patch(`/products/${product._id}`)
      .set("Authorization", `Bearer ${otherSellerToken}`)
      .send({
        price: 900,
      });

    expect(res.status).toBeGreaterThanOrEqual(403);
  });
});