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

    // 🧪 4b. no comprar productos inactivos
    it("should NOT allow ordering an inactive product", async () => {
        const inactive = await Product.create({
            name: "Inactivo",
            brand: "Apple",
            category: "smartphone",
            model: "OFF",
            price: 1000,
            quantity: 5,
            isActive: false,
            image: "https://test.com",
            owner: sellerId,
        });

        const res = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ items: [{ product: inactive._id.toString(), quantity: 1 }] });

        expect(res.status).toBeGreaterThanOrEqual(400);

        // El stock no se tocó.
        const after = await Product.findById(inactive._id);
        expect(after?.quantity).toBe(5);
    });

    // 🧪 4c. idempotencia: doble request con la misma clave = una sola orden
    it("should be idempotent with the same idempotencyKey", async () => {
        const key = "idem-test-key-123456";
        const body = {
            items: [{ product: productId, quantity: 2 }],
            idempotencyKey: key,
        };

        const first = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send(body);
        expect(first.status).toBe(201);

        const second = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send(body);
        expect(second.status).toBe(201);

        // Misma orden devuelta, no una nueva.
        expect(second.body.id).toBe(first.body.id);

        // El stock se descontó una sola vez (5 - 2 = 3).
        const product = await Product.findById(productId);
        expect(product?.quantity).toBe(3);
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

    // 🧪 6. cancelar una orden pending repone el stock
    it("should restore stock when cancelling a pending order", async () => {
        const createRes = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ items: [{ product: productId, quantity: 2 }] });

        const orderId = createRes.body.id;

        // stock descontado: 5 → 3
        expect((await Product.findById(productId))?.quantity).toBe(3);

        const cancelRes = await request(app)
            .patch(`/orders/${orderId}/cancel`)
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(cancelRes.status).toBe(200);
        expect(cancelRes.body.status).toBe("cancelled");

        // stock repuesto: 3 → 5
        expect((await Product.findById(productId))?.quantity).toBe(5);
    });

    // 🧪 7. un usuario no puede cancelar la orden de otro
    it("should NOT allow another user to cancel someone else's order", async () => {
        const createRes = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ items: [{ product: productId, quantity: 1 }] });

        const orderId = createRes.body.id;

        await request(app).post("/user/register").send({
            username: "intruso",
            email: "intruso@test.com",
            password: "123456",
        });
        const intruderToken = (
            await request(app).post("/user/login").send({
                email: "intruso@test.com",
                password: "123456",
            })
        ).body.token;

        const res = await request(app)
            .patch(`/orders/${orderId}/cancel`)
            .set("Authorization", `Bearer ${intruderToken}`);

        expect(res.status).toBeGreaterThanOrEqual(403);
    });

    // 🧪 8. rollback real: si un ítem no tiene stock, NINGÚN ítem se descuenta
    it("should NOT decrement any stock if one item is out of stock (no partial write)", async () => {
        const cable = await Product.create({
            name: "Cable USB-C",
            brand: "Generic",
            category: "accessories",
            model: "CABLE-1",
            price: 100,
            quantity: 1,
            image: "https://test.com",
            owner: sellerId,
        });

        const res = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                items: [
                    { product: productId, quantity: 1 }, // iPhone: hay stock
                    { product: cable._id.toString(), quantity: 5 }, // cable: NO hay
                ],
            });

        expect(res.status).toBe(500);

        // La transacción no dejó escritura parcial: ambos stocks intactos.
        expect((await Product.findById(productId))?.quantity).toBe(5);
        expect((await Product.findById(cable._id))?.quantity).toBe(1);

        // No se creó ninguna orden.
        expect(await Order.countDocuments()).toBe(0);
    });

    // 🧪 9. un seller ajeno (sin productos en la orden) no puede cambiar el estado
    it("should NOT allow a seller without items in the order to change its status", async () => {
        const createRes = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ items: [{ product: productId, quantity: 1 }] });

        const orderId = createRes.body.id;

        const reg = await request(app).post("/user/register").send({
            username: "seller2",
            email: "seller2-orders@test.com",
            password: "123456",
        });
        const seller2Id = reg.body.user?.id || reg.body.id;
        await UserMongo.findByIdAndUpdate(seller2Id, { role: "seller" });
        const seller2Token = (
            await request(app).post("/user/login").send({
                email: "seller2-orders@test.com",
                password: "123456",
            })
        ).body.token;

        const res = await request(app)
            .patch(`/orders/${orderId}/status`)
            .set("Authorization", `Bearer ${seller2Token}`)
            .send({ status: "paid" });

        expect(res.status).toBeGreaterThanOrEqual(403);
    });
});