import { prop, Typegoose, InstanceType, ModelType, arrayProp, index, staticMethod, instanceMethod } from "typegoose";

@index({ userName: 1 }, { unique: true })
@index({ email: 1 }, { unique: true })
class Users extends Typegoose {
    @prop()
    userName: string;

    @prop()
    email: string;

    @prop({ default: "" })
    description: string;

    @prop({ default: "" })
    passwordHash: string;

    @prop({ default: false })
    isAdmin: boolean;

    @arrayProp({ items: String, default: [] })
    privileges: string[];
}

export const UserModel = new Users().getModelForClass(Users);
export type UserInstance = InstanceType<Users>;
