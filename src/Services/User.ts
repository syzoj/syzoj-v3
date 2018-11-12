import { UserInstance, UserModel } from "../Models/UserModel";
import { Types } from "mongoose";
import { isEmail } from "validator";

import * as bcrypt from "bcrypt";
import NotFoundError from "Errors/NotFoundError";
import DuplicateError from "Errors/DuplicateError";

export enum UserPrivilege {
    ManageProblems = "ManageProblems",
    ManageUsers = "ManageUsers",
}

export interface IUserBriefInfo {
    uuid: string;
    userName: string;
    description: string;
    email: string;
    avatar: string;
    isAdmin: boolean;
}

export class User {
    private data: UserInstance;

    constructor(data) {
        if (data instanceof UserModel) {
            this.data = data;
        } else {
            this.data = new UserModel(data);
        }
    }

    get uuid(): string { return this.data._id.toString(); }
    get userName(): string { return this.data.userName; }
    set userName(userName: string) { this.data.userName = userName; }
    get description(): string { return this.data.description; }
    set description(description: string) { this.data.description = description; }
    get email(): string { return this.data.email; }
    set email(email: string) { this.data.email = email; }
    get isAdmin(): boolean { return this.data.isAdmin; }
    set isAdmin(isAdmin: boolean) { this.data.isAdmin = isAdmin; }

    async checkPassword(password: string): Promise<boolean> {
        if (!password) {
            return false;
        }

        // The hashed password contains salt, bcrypt.compare() will
        // handle it correctly.
        return await bcrypt.compare(password, this.data.passwordHash);
    }

    async setPassword(password: string): Promise<void> {
        // Use bcrypt to hash the password.
        // Rounds = 10 for a balance between safety and speed.
        // Salts are automatically generated and stored in hash value.
        this.data.passwordHash = await bcrypt.hash(password, 10);
    }

    hasPrivilege(privilege: UserPrivilege): boolean {
        // A user with isAdmin = true has all privileges.
        return this.data.isAdmin || this.data.privileges.includes(privilege);
    }

    addPrivilege(privilege: UserPrivilege): void {
        // Privileges are stored in a array, not a set.
        // Perform a check to ensure uniqueness.
        if (this.hasPrivilege(privilege)) {
            return;
        }

        this.data.privileges.push(privilege);
    }

    delPrivilege(privilege: UserPrivilege): void {
        this.data.privileges = this.data.privileges.filter((x: string) => x !== privilege);
    }

    getBriefInfo(): IUserBriefInfo {
        return {
            uuid: this.data._id.toString(),
            userName: this.data.userName,
            description: this.data.description,
            email: this.data.email,
            avatar: this.data.email,
            isAdmin: this.data.isAdmin
        };
    }

    async save() {
        await this.data.save();
    }

    // Find a user by a UUID, return null if the passed UUID is illegal or not found.
    static async findByUUID(uuid: string): Promise<User> {
        try {
            // uuid may not be a legal object id.
            const data: UserInstance = await UserModel.findOne({ _id: Types.ObjectId.createFromHexString(uuid) });
            return data ? new User(data) : null;
        } catch (e) {
            return null;
        }
    }

    // Find a user by its userName, return null if not found.
    static async findByUserName(userName: string): Promise<User> {
        const data: UserInstance = await UserModel.findOne({ userName });
        return data ? new User(data) : null;
    }

    static isValidEmail(email: string): boolean {
        return isEmail(email);
    }

    // A userName is a string of 1 ~ 16 ASCII characters, and each character
    // is a uppercase / lowercase letter or a number or any of '-_.#$' and is
    // NOT '%'.
    static isValidUserName(userName: string): boolean {
        return /^[a-zA-Z0-9\-\_\.\#\$]{1,16}$/.test(userName);
    }

    // Register a new user with input userName / password / email.
    // Return the registered user object, or null if the userName exists.
    static async registerNewUser(userName: string,
                                 password: string,
                                 email: string): Promise<User> {
        if (await this.findByUserName(userName)) {
            return null;
        }

        const newUser: User = new User({
            userName,
            email
        });

        await newUser.setPassword(password);
        await newUser.save();

        return newUser;
    }
}
