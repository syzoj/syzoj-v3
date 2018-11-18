import { model as createModel, Schema } from "mongoose";
import ObjectId = Schema.Types.ObjectId;

export type UserGroupInstance = any;

const schema: Schema = new Schema({
    name: { type: String, unique: true },
    memberCount: { type: Number, default: 0 }
});

export const UserGroupModel = createModel("UserGroup", schema);
