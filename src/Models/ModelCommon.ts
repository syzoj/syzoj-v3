import { Types } from "mongoose";

export type UUID = Types.ObjectId;

export function uuidToString(uuid: UUID): string {
    return uuid.toHexString();
}

export function uuidFromString(stringUUID: string): UUID {
    try {
        return Types.ObjectId.createFromHexString(stringUUID);
    } catch (e) {
        return Types.ObjectId.createFromHexString("000000000000000000000000");
    }
}
