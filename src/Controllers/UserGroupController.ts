import "reflect-metadata";
import { JsonController, Param, BodyParam, State, Get, Post, OnUndefined, Authorized } from "routing-controllers";

import NotFoundError from "Errors/NotFoundError";
import AuthError, { AuthErrorType } from "Errors/AuthError";
import InvalidInputError from "Errors/InvalidInputError";

import { User, UserPrivilege } from "Services/User";
import { UserGroup, IUserGroupBriefInfo } from "Services/UserGroup";
import DuplicateError from "Errors/DuplicateError";

@JsonController()
export class UserController {
    // Get a group's brief info by its uuid.
    @Get("/userGroup/getByUUID/:uuid")
    private async getByUUID(@Param("uuid") uuid: string): Promise<IUserGroupBriefInfo> {
        const group: UserGroup = await UserGroup.findByUUID(uuid);
        if (!group) {
            throw new NotFoundError(UserGroup, { uuid });
        }

        return await group.getBriefInfo();
    }

    // Get a group's brief info by its name.
    @Get("/userGroup/getByGroupName/:groupName")
    private async getByGroupName(@Param("groupName") groupName: string): Promise<IUserGroupBriefInfo> {
        const group: UserGroup = await UserGroup.findByGroupName(groupName);
        if (!group) {
            throw new NotFoundError(UserGroup, { groupName });
        }

        return await group.getBriefInfo();
    }

    // Create a new group
    @Post("/userGroup/create")
    @Authorized()
    private async create(@State("user") currentUser: User,
                         @BodyParam("groupName") groupName: string): Promise<IUserGroupBriefInfo> {
        if (!currentUser.hasPrivilege(UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        if (!UserGroup.isValidGroupName(groupName)) {
            throw new InvalidInputError({ groupName });
        }

        const group: UserGroup = await UserGroup.createGroup(groupName);
        if (!group) {
            throw new DuplicateError(UserGroup, { groupName });
        }

        return await group.getBriefInfo();
    }

    // Delete a existing group
    @Post("/userGroup/delete")
    @OnUndefined(200)
    @Authorized()
    private async delete(@State("user") currentUser: User,
                         @BodyParam("uuid") uuid: string): Promise<void> {
        if (!currentUser.hasPrivilege(UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const group: UserGroup = await UserGroup.findByUUID(uuid);
        if (!group) {
            throw new NotFoundError(UserGroup, { uuid });
        }

        await UserGroup.deleteGroup(group);
    }

    // Add a user to a group
    @Post("/userGroup/addUser/")
    @OnUndefined(200)
    @Authorized()
    private async addUser(@State("user") currentUser: User,
                          @BodyParam("groupUUID") groupUUID: string,
                          @BodyParam("userUUID") userUUID: string): Promise<void> {
        if (!currentUser.hasPrivilege(UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const group: UserGroup = await UserGroup.findByUUID(groupUUID);
        if (!group) {
            throw new NotFoundError(UserGroup, { uuid: groupUUID });
        }

        const user: User = await User.findByUUID(userUUID);
        if (!user) {
            throw new NotFoundError(User, { uuid: userUUID });
        }

        // Already joined?
        if (!await user.joinGroup(group)) {
            throw new InvalidInputError({ groupUUID, userUUID });
        }
    }

    // Remove a user from a group
    @Post("/userGroup/delUser/")
    @OnUndefined(200)
    @Authorized()
    private async delUser(@State("user") currentUser: User,
                          @BodyParam("groupUUID") groupUUID: string,
                          @BodyParam("userUUID") userUUID: string): Promise<void> {
        if (!currentUser.hasPrivilege(UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const group: UserGroup = await UserGroup.findByUUID(groupUUID);
        if (!group) {
            throw new NotFoundError(UserGroup, { uuid: groupUUID });
        }

        const user: User = await User.findByUUID(userUUID);
        if (!user) {
            throw new NotFoundError(User, { uuid: userUUID });
        }

        // Not joined?
        if (!await user.leaveGroup(group)) {
            throw new InvalidInputError({ groupUUID, userUUID });
        }
    }
}
