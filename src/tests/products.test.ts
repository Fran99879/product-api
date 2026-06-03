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

  // 🧪 3. Obtener productosF
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
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
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