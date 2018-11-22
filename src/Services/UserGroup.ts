import { UserGroupInstance, UserGroupModel } from "Models/UserGroupModel";
import { UserUserGroupMapModel } from "Models/UserUserGroupMapModel";
import UUIDHelper, { UUID } from "Helpers/UUIDHelper";

import User from "./User";

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
        // Find all users in this group and let them leave.
        const mapRecords = await UserUserGroupMapModel.find({
            group: group.uuid
        });

        // Delete the group's uuid from users' groups property first.
        // It's equal to let every user leave the group one by one.
        for (const mapRecord of mapRecords) {
            const user: User = await User.findByUUID(mapRecord.get("user"));
            user.groups = user.groups.filter((id: UUID) => !UUIDHelper.isEqual(id, group.uuid));
            await user.save();
        }

        // Secondly, delete all user-and-group map records.
        // They can exist after users have leaved - won't cause system panic, because
        // the map records are used for delete the group - won't be used outside this method.
        await UserUserGroupMapModel.deleteMany({
            group: group.uuid
        });

        // Finally delete the group.
        await UserGroupModel.deleteOne({
            _id: group.uuid
        });
    }
}
