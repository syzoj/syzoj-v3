import { UserGroupInstance, UserGroupModel } from "Models/UserGroupModel";
import UUIDHelper, { UUID } from "Helpers/UUIDHelper";

export interface IUserGroupBriefInfo {
    uuid: string;
    groupName: string;
}

export class UserGroup {
    private data: UserGroupInstance;

    constructor(data: any) {
        if (data instanceof UserGroupModel) {
            this.data = data;
        } else {
            this.data = new UserGroupModel(data);
        }
    }

    get uuid(): UUID { return this.data._id; }
    get groupName(): string { return this.data.groupName; }
    set groupName(groupName: string) { this.data.groupName = groupName; }
    get memberCount(): number { return this.data.memberCount; }
    set memberCount(memberCount: number) { this.data.memberCount = memberCount; }

    getBriefInfo(): IUserGroupBriefInfo {
        return {
            uuid: UUIDHelper.toString(this.uuid),
            groupName: this.groupName
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

    // Find a user by its groupName, return null if not found.
    static async findByGroupName(groupName: string): Promise<UserGroup> {
        const data: UserGroupInstance = await UserGroupModel.findOne({ groupName });
        return data ? new UserGroup(data) : null;
    }

    // A groupName is a string of 1 ~ 16 ASCII characters, and each character
    // is a uppercase / lowercase letter or a number or any of '-_.#$' and is
    // NOT '%'.
    static isValidGroupName(groupName: string): boolean {
        return /^[a-zA-Z0-9\-\_\.\#\$]{1,16}$/.test(groupName);
    }

    // Create a new UserGroup with input groupName.
    // Return the registered UserGroup object, or null if the groupName exists.
    static async createGroup(groupName: string): Promise<UserGroup> {
        if (await this.findByGroupName(groupName)) {
            return null;
        }

        const newUserGroup: UserGroup = new UserGroup({
            groupName
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
