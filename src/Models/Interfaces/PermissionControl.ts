import { Schema } from "mongoose";
import ObjectId = Schema.Types.ObjectId;

export default {
    defaultAllow: Boolean,
    guestAllow: Boolean,
    userUUIDs: [ObjectId],
    groupUUIDs: [ObjectId]
};
