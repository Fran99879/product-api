import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createApp } from "../app.js";
import { createModels } from "../models/index.js";

import { UserMongo } from "../models/mongo/user/user.js";
import { Product } from "../schemas/product.mongodb.js";
import { Order } from "../schemas/order.mongodb.js";

let app: any;
let token: string;
let productId: string;
let buyerToken: string;
let sellerToken: string;
let sellerId: string;

describe("Orders", () => {
    beforeAll(async () => {
        const models = await createModels();
        app = createApp(models);
    });

    beforeEach(async () => {
        await UserMongo.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});

        // 🔹 crear usuario
        const buyerRegister = await request(app).post("/user/register").send({
            username: "buyer",
            email: "buyer@test.com",
            password: "123456",
        });
        const buyerLogin = await request(app).post("/user/login").send({
            email: "buyer@test.com",
            password: "123456",
        });

        buyerToken = buyerLogin.body.token;

        // 🧑‍💼 SELLER
        const sellerRegister = await request(app).post("/user/register").send({
            username: "seller",
            email: "seller-orders@test.com",
            password: "123456",
        });

        sellerId = sellerRegister.body.user?.id || sellerRegister.body.id;

        // ⚠️ IMPORTANTE: cambiar role a seller
        await UserMongo.findByIdAndUpdate(sellerId, { role: "seller" });

        const sellerLogin = await request(app).post("/user/login").send({
            email: "seller-orders@test.com",
            password: "123456",
        });

        sellerToken = sellerLogin.body.token;

        // 🔹 crear producto
        const product = await Product.create({
            name: "iPhone",
            brand: "Apple",
            category: "smartphone",
            model: "15",
            price: 1000,
            quantity: 5,
            image: "https://test.com",
            owner: sellerId,
        });

        productId = product._id.toString();
    });

    // 🧪 1. crear orden OK
    it("should create an order", async () => {
        const res = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                items: [{ product: productId, quantity: 2 }],
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("id");
        expect(res.body.total).toBe(2000);
    });

    // 🧪 2. no crear si no hay stock
    it("should NOT create order if insufficient stock", async () => {
        const res = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                items: [{ product: productId, quantity: 999 }],
            });

        expect(res.status).toBe(500);
    });

    // 🧪 3. rollback stock
    it("should rollback stock on failure", async () => {
        try {
            await request(app)
                .post("/orders")
                .set("Authorization", `Bearer ${buyerToken}`)
                .send({
                    items: [{ product: productId, quantity: 999 }],
                });
        } catch { }

        const product = await Product.findById(productId);

        expect(product?.quantity).toBe(5);
    });

    // 🧪 4. state machine
    it("should handle valid status transitions", async () => {
        const createRes = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                items: [{ product: productId, quantity: 1 }],
            });

        const orderId = createRes.body.id;

        // pending → paid
        const paidRes = await request(app)
            .patch(`/orders/${orderId}/status`)
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ status: "paid" });

        expect(paidRes.status).toBe(200);

        // paid → shipped
        const shippedRes = await request(app)
            .patch(`/orders/${orderId}/status`)
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ status: "shipped" });

        expect(shippedRes.status).toBe(200);
    });

    // 🧪 5. transición inválida
    it("should NOT allow invalid status transition", async () => {
        const createRes = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                items: [{ product: productId, quantity: 1 }],
            });

        const orderId = createRes.body.id;

        // saltamos a shipped directamente (depende de tu lógica)
        await request(app)
            .patch(`/orders/${orderId}/status`)
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ status: "shipped" });

        // ahora intentamos volver a pending (debería fallar)
        const invalidRes = await request(app)
            .patch(`/orders/${orderId}/status`)
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ status: "pending" });

        expect(invalidRes.status).toBeGreaterThanOrEqual(400);
    });
});