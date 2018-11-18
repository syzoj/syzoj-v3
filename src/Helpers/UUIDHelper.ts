import { Types } from "mongoose";

export type UUID = Types.ObjectId;

export default {
    toString(uuid: UUID): string {
        if (!uuid) {
            return null;
        }

        return uuid.toHexString();
    },

    fromString(stringUUID: string): UUID {
        try {
            return Types.ObjectId.createFromHexString(stringUUID);
        } catch (e) {
            return Types.ObjectId.createFromHexString("000000000000000000000000");
        }
    },

    isEqual(a: UUID, b: UUID): boolean {
        return a.equals(b);
    }
};
