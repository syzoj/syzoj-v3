import { UserGroupInstance, UserGroupModel } from "Models/UserGroupModel";
import UUIDHelper, { UUID } from "Helpers/UUIDHelper";

export interface IUserGroupBriefInfo {
    uuid: string;
    name: string;
}

export default class UserGroup {
    private data: UserGroupInstance;

    constructor(data: any) {
        if (data instanceof UserGroupModel) {
            this.data = data;
        } else {
            this.data = new UserGroupModel(data);
        }
    }

    get uuid(): UUID { return this.data._id; }
    get name(): string { return this.data.name; }
    set name(name: string) { this.data.name = name; }
    get memberCount(): number { return this.data.memberCount; }
    set memberCount(memberCount: number) { this.data.memberCount = memberCount; }

    getBriefInfo(): IUserGroupBriefInfo {
        return {
            uuid: UUIDHelper.toString(this.uuid),
            name: this.name
        };
    }

    async save() {
        await this.data.save();
    }

    // Find a UserGroup by a UUID, return null if the passed UUID is illegal or not found.
    static async findByUUID(uuid: UUID): Promise<UserGroup> {
        // uuid may not be a legal object id.
        const data: UserGroupInstance = await UserGroupModel.findOne({ _id: uuid });
        return data ? new UserGroup(data) : null;
    }

    // Find a user by its name, return null if not found.
    static async findByName(name: string): Promise<UserGroup> {
        const data: UserGroupInstance = await UserGroupModel.findOne({ name });
        return data ? new UserGroup(data) : null;
    }

    // A name is a string of 1 ~ 16 ASCII characters, and each character
    // is a uppercase / lowercase letter or a number or any of '-_.#$' and is
    // NOT '%'.
    static isValidName(name: string): boolean {
        return name && /^[a-zA-Z0-9\-\_\.\#\$]{1,16}$/.test(name);
    }

    // Create a new UserGroup with input name.
    // Return the registered UserGroup object, or null if the name exists.
    static async createGroup(name: string): Promise<UserGroup> {
        if (await this.findByName(name)) {
            return null;
        }

        const newUserGroup: UserGroup = new UserGroup({
            name
        });

        await newUserGroup.save();

        return newUserGroup;
    }

    static async deleteGroup(group: UserGroup): Promise<void> {
        // TODO: Find all users in this group and let them leave.
        await UserGroupModel.deleteOne({
            _id: group.uuid
        });
    }
}
