import mongoose from "mongoose";
import { SessionMongo } from "./session.js";
import type { Session, SessionModel } from "../../session.model.js";

const mapDocToSession = (doc: any): Session => ({
  id: doc._id.toString(),
  userId: doc.user.toString(),
  userAgent: doc.userAgent ?? "",
  expiresAt: doc.expiresAt,
  createdAt: doc.createdAt,
});

export const MongoSessionModel: SessionModel = {
  async create({ userId, tokenHash, userAgent, expiresAt }) {
    const doc = await SessionMongo.create({
      user: userId,
      tokenHash,
      userAgent,
      expiresAt,
    });
    return mapDocToSession(doc);
  },

  async findByHash({ tokenHash }) {
    const doc = await SessionMongo.findOne({ tokenHash });
    return doc ? mapDocToSession(doc) : null;
  },

  async deleteByHash({ tokenHash }) {
    await SessionMongo.deleteOne({ tokenHash });
  },

  async deleteById({ id, userId }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await SessionMongo.deleteOne({ _id: id, user: userId });
    return res.deletedCount > 0;
  },

  async deleteAllForUser({ userId, exceptHash }) {
    const filter: Record<string, unknown> = { user: userId };
    if (exceptHash) filter.tokenHash = { $ne: exceptHash };
    await SessionMongo.deleteMany(filter);
  },

  async listForUser({ userId }) {
    const docs = await SessionMongo.find({ user: userId }).sort({ createdAt: -1 });
    return docs.map(mapDocToSession);
  },
};
