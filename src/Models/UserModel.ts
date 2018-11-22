import { model as createModel, Schema } from "mongoose";
import ObjectId = Schema.Types.ObjectId;

export type UserInstance = any;

const schema: Schema = new Schema({
    userName: { type: String, unique: true },
    email: { type: String, unique: true },
    description: String,
    passwordHash: String,
    isAdmin: Boolean,
    registerIP: String,
    registerTime: Date,
    privileges: [String],
    groups: [ObjectId]
});

export const UserModel = createModel("User", schema);
