import { UserInstance, UserModel } from "Models/UserModel";
import { UserUserGroupMapInstance, UserUserGroupMapModel } from "Models/UserUserGroupMapModel";
import UUIDHelper, { UUID } from "Helpers/UUIDHelper";
import { isEmail } from "validator";

import * as bcrypt from "bcrypt";

import IPermissionControl from "Interfaces/IPermissionControl";

import UserGroup from "Services/UserGroup";

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

export default class User {
    private data: UserInstance;

    constructor(data: any) {
        if (data instanceof UserModel) {
            this.data = data;
        } else {
            this.data = new UserModel(data);
        }
    }

    get uuid(): UUID { return this.data._id; }
    get userName(): string { return this.data.userName; }
    set userName(userName: string) { this.data.userName = userName; }
    get description(): string { return this.data.description; }
    set description(description: string) { this.data.description = description; }
    get email(): string { return this.data.email; }
    set email(email: string) { this.data.email = email; }
    get isAdmin(): boolean { return this.data.isAdmin; }
    set isAdmin(isAdmin: boolean) { this.data.isAdmin = isAdmin; }
    get groups(): UUID[] { return this.data.groups; }
    set groups(groups: UUID[]) { this.data.groups = groups; }

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

    // true - Success.
    // false - Already added.
    addPrivilege(privilege: UserPrivilege): boolean {
        // Privileges are stored in a array, not a set.
        // Perform a check to ensure uniqueness.
        if (User.checkPrivilege(this, privilege)) {
            return false;
        }

        this.data.privileges.push(privilege);
        return true;
    }

    // true - Success.
    // false - Doesn't have.
    delPrivilege(privilege: UserPrivilege): boolean {
        if (!User.checkPrivilege(this, privilege)) {
            return false;
        }

        this.data.privileges = this.data.privileges.filter((x: string) => x !== privilege);
        return true;
    }

    getBriefInfo(): IUserBriefInfo {
        return {
            uuid: UUIDHelper.toString(this.uuid),
            userName: this.userName,
            description: this.description,
            email: this.email,
            avatar: this.email, // TODO: Generate Gravatar URL
            isAdmin: this.isAdmin
        };
    }

    async save() {
        await this.data.save();
    }

    // Find a user by a UUID, return null if the passed UUID is not found.
    static async findByUUID(uuid: UUID): Promise<User> {
        // uuid may not be a legal object id.
        const data: UserInstance = await UserModel.findOne({ _id: uuid });
        return data ? new User(data) : null;
    }

    // Find a user by its userName, return null if not found.
    static async findByUserName(userName: string): Promise<User> {
        const data: UserInstance = await UserModel.findOne({ userName });
        return data ? new User(data) : null;
    }

    // Find a user by its email, return null if not found.
    static async findByEmail(email: string): Promise<User> {
        const data: UserInstance = await UserModel.findOne({ email });
        return data ? new User(data) : null;
    }

    static isValidEmail(email: string): boolean {
        return isEmail(email);
    }

    // A userName is a string of 1 ~ 16 ASCII characters, and each character
    // is a uppercase / lowercase letter or a number or any of '-_.#$' and is
    // NOT '%'.
    static isValidUserName(userName: string): boolean {
        return userName && /^[a-zA-Z0-9\-\_\.\#\$]{1,16}$/.test(userName);
    }

    // Register a new user with input userName / password / email.
    // Return [registered user object, null], or [null, conflit fleid] if the userName exists.
    static async registerNewUser(userName: string,
                                 password: string,
                                 email: string): Promise<[User, any]> {
        if (await this.findByUserName(userName)) {
            return [null, { userName }];
        }

        if (await this.findByEmail(email)) {
            return [null, { email }];
        }

        const newUser: User = new User({
            userName,
            email
        });

        await newUser.setPassword(password);
        await newUser.save();

        return [newUser, null];
    }

    inGroup(group: UserGroup): boolean {
        return this.groups.some((x: UUID): boolean => x.equals(group.uuid));
    }

    // Join a UserGroup. With call to .save() inside.
    // true - Success.
    // false - Already joined.
    async joinGroup(group: UserGroup): Promise<boolean> {
        if (this.inGroup(group)) {
            return false;
        }

        // TODO: Use a transaction.
        const mapInstance: UserUserGroupMapInstance = new UserUserGroupMapModel({
            user: this.uuid,
            group: group.uuid
        });

        await mapInstance.save();

        group.memberCount++;
        await group.save();

        this.groups.push(group.uuid);
        await this.save();

        return true;
    }

    // Leave a UserGroup. With call to .save() inside.
    // true - Success.
    // false - Not joined.
    async leaveGroup(group: UserGroup): Promise<boolean> {
        if (!this.inGroup(group)) {
            return false;
        }

        // TODO: Use a transaction.
        const mapInstance: UserUserGroupMapInstance = await UserUserGroupMapModel.findOneAndDelete({
            user: this.uuid,
            group: group.uuid
        });

        group.memberCount--;
        await group.save();

        this.groups = this.groups.filter((x: UUID) => !x.equals(group.uuid));
        await this.save();

        return true;
    }

    static checkPrivilege(user: User, privilege: UserPrivilege): boolean {
        // A user with isAdmin = true has all privileges.
        return user.data.isAdmin || user.data.privileges.includes(privilege);
    }
}
