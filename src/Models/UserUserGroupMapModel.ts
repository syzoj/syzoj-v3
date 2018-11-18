import { model as createModel, Schema } from "mongoose";
import ObjectId = Schema.Types.ObjectId;

export type UserUserGroupMapInstance = any;

const schema: Schema = new Schema({
    user: ObjectId,
    group: ObjectId
});

schema.index({ group: 1, user: 1 }, { unique: true });

export const UserUserGroupMapModel = createModel("UserUserGroupMap", schema);
