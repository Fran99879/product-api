import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock del mailer: espiamos `sendMail` sin tocar SMTP.
const sendMailMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../config/mailer.js", () => ({
  mailerEnabled: true,
  sendMail: (...args: unknown[]) => sendMailMock(...args),
}));

import { sendOrderStatusEmail } from "../emails/order-status.email.js";
import type { Order } from "../schemas/order.schema.js";
import type { OrderStatus } from "../types/order.js";

const baseOrder = (status: OrderStatus): Order => ({
  id: "abcdef1234567890",
  buyer: { id: "u1", username: "juan", email: "juan@test.com" },
  items: [{ product: { id: "p1", owner: "s1" }, quantity: 2, price: 100 }],
  total: 200,
  status,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe("sendOrderStatusEmail", () => {
  beforeEach(() => sendMailMock.mockClear());

  it.each(["paid", "shipped", "delivered", "cancelled"] as const)(
    "envía email en estado %s",
    async (status) => {
      const sent = await sendOrderStatusEmail(baseOrder(status));
      expect(sent).toBe(true);
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const payload = sendMailMock.mock.calls[0]![0];
      expect(payload.to).toBe("juan@test.com");
      expect(payload.subject).toBeTruthy();
      expect(payload.html).toContain("juan");
      expect(payload.text).toContain("juan");
    }
  );

  it("NO envía email en estado pending", async () => {
    const sent = await sendOrderStatusEmail(baseOrder("pending"));
    expect(sent).toBe(false);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("incluye el total formateado y el id corto en el cuerpo", async () => {
    await sendOrderStatusEmail(baseOrder("paid"));
    const { html } = sendMailMock.mock.calls[0]![0];
    expect(html).toContain("$200,00");
    expect(html).toContain("#34567890"); // últimos 8 chars del id
  });
});
