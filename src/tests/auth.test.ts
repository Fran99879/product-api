import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createApp } from "../app.js";
import { createModels } from "../models/index.js";
import { UserMongo } from "../models/mongo/user/user.js";

let app: any;

describe("Auth", () => {
  beforeAll(async () => {
    const models = await createModels();
    app = createApp(models);
  });

  beforeEach(async () => {
    await UserMongo.deleteMany({});
  });

  it("should register a user", async () => {
    const res = await request(app).post("/user/register").send({
      username: "testuser",
      email: "test@test.com",
      password: "123456",
    });

    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty("token");
  });

  it("should login user", async () => {
  await request(app).post("/user/register").send({
    username: "testuser",
    email: "test@test.com",
    password: "123456",
  });

  const res = await request(app).post("/user/login").send({
    email: "test@test.com",
    password: "123456",
  });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("token");
});
});