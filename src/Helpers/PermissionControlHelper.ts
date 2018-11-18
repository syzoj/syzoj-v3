import IPermissionControl from "Interfaces/IPermissionControl";

import App from "App";
import UUIDHelper, { UUID } from "Helpers/UUIDHelper";

import User, { UserPrivilege } from "Services/User";
import UserGroup from "Services/UserGroup";

export default {
    // Convert a PermissionControl structure from database to
    // IPermissionControl. UUIDs should be converted to strings.
    convertUUIDToString(input: any): IPermissionControl {
        if (!input) {
            return null;
        }

        return {
            defaultAllow: !!input.defaultAllow,
            guestAllow: !!input.guestAllow,
            userUUIDs: input.userUUIDs.map((x: UUID): string => UUIDHelper.toString(x)),
            groupUUIDs: input.groupUUIDs.map((x: UUID): string => UUIDHelper.toString(x))
        } as IPermissionControl;
    },

    convertStringToUUID(input: IPermissionControl): any {
        if (!input) {
            return null;
        }

        return {
            defaultAllow: !!input.defaultAllow,
            guestAllow: !!input.guestAllow,
            userUUIDs: input.userUUIDs.map((x: string): UUID => UUIDHelper.fromString(x)),
            groupUUIDs: input.groupUUIDs.map((x: string): UUID => UUIDHelper.fromString(x))
        };
    },

    // Filter invalid properties / non-existing or exceeded user & groups in input
    // IPermissionControl, return a valid IPermissionControl.
    async normalize(input: IPermissionControl): Promise<IPermissionControl> {
        const result: IPermissionControl = {
            defaultAllow: !!input.defaultAllow,
            guestAllow: !!input.guestAllow,
            userUUIDs: [],
            groupUUIDs: []
        };

        if (Array.isArray(input.userUUIDs)) {
            for (let i = 0; i < Math.min(input.userUUIDs.length, App.config.limits.permissionControl.maxUserCount); i++) {
                const user: User = await User.findByUUID(UUIDHelper.fromString(input.userUUIDs[i]));
                const normalizedString: string = user ? UUIDHelper.toString(user.uuid) : null;
                if (normalizedString && !result.userUUIDs.includes(normalizedString)) {
                    result.userUUIDs.push(normalizedString);
                }
            }
        }

        if (Array.isArray(input.groupUUIDs)) {
            for (let i = 0; i < Math.min(input.groupUUIDs.length, App.config.limits.permissionControl.maxGroupCount); i++) {
                const group: UserGroup = await UserGroup.findByUUID(UUIDHelper.fromString(input.groupUUIDs[i]));
                const normalizedString: string = group ? UUIDHelper.toString(group.uuid) : null;
                if (normalizedString && !result.groupUUIDs.includes(normalizedString)) {
                    result.groupUUIDs.push(normalizedString);
                }
            }
        }

        return result;
    },

    // Check if this user has permission to something (or has a specified privilege).
    async checkPermission(user: User,
                          permissionControl: IPermissionControl,
                          privilege?: UserPrivilege): Promise<boolean> {
        if (!user) {
            return permissionControl.guestAllow;
        }

        if (privilege && User.checkPrivilege(user, privilege)) {
            return true;
        }

        let inEntities: boolean = false;

        if (permissionControl.userUUIDs.some((x: string): boolean => UUIDHelper.isEqual(UUIDHelper.fromString(x), user.uuid))) {
            inEntities = true;
        }

        if (!inEntities) {
            // TODO: Use a optimized algorithm for this.
            if (permissionControl.groupUUIDs.some((x: string): boolean => user.groups.some((y: UUID): boolean => UUIDHelper.isEqual(UUIDHelper.fromString(x), y)))) {
                inEntities = true;
            }
        }

        return permissionControl.defaultAllow ? !inEntities : inEntities;
    }
};
