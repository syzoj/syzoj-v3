import "reflect-metadata";
import { JsonController, Param, BodyParam, State, Get, Post, OnUndefined, Authorized } from "routing-controllers";

import NotFoundError from "Errors/NotFoundError";
import AuthError, { AuthErrorType } from "Errors/AuthError";
import InvalidInputError from "Errors/InvalidInputError";
import DuplicateError from "Errors/DuplicateError";

import UUIDHelper from "Helpers/UUIDHelper";

import User, { UserPrivilege } from "Services/User";
import UserGroup, { IUserGroupBriefInfo } from "Services/UserGroup";

@JsonController()
export class UserController {
    // Get a group's brief info by its uuid.
    @Get("/userGroup/getByUUID/:uuid")
    private async getByUUID(@Param("uuid") uuid: string): Promise<IUserGroupBriefInfo> {
        const group: UserGroup = await UserGroup.findByUUID(UUIDHelper.fromString(uuid));
        if (!group) {
            throw new NotFoundError(UserGroup, { uuid });
        }

        return await group.getBriefInfo();
    }

    // Get a group's brief info by its name.
    @Get("/userGroup/getByName/:name")
    private async getByName(@Param("name") name: string): Promise<IUserGroupBriefInfo> {
        const group: UserGroup = await UserGroup.findByName(name);
        if (!group) {
            throw new NotFoundError(UserGroup, { name });
        }

        return await group.getBriefInfo();
    }

    // Create a new group
    @Post("/userGroup/create")
    @Authorized()
    private async create(@State("user") currentUser: User,
                         @BodyParam("name") name: string): Promise<IUserGroupBriefInfo> {
        if (!User.checkPrivilege(currentUser, UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        if (!UserGroup.isValidName(name)) {
            throw new InvalidInputError({ name });
        }

        const group: UserGroup = await UserGroup.createGroup(name);
        if (!group) {
            throw new DuplicateError(UserGroup, { name });
        }

        return await group.getBriefInfo();
    }

    // Delete a existing group
    @Post("/userGroup/delete")
    @OnUndefined(200)
    @Authorized()
    private async delete(@State("user") currentUser: User,
                         @BodyParam("uuid") uuid: string): Promise<void> {
        if (!User.checkPrivilege(currentUser, UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const group: UserGroup = await UserGroup.findByUUID(UUIDHelper.fromString(uuid));
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
        if (!User.checkPrivilege(currentUser, UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const group: UserGroup = await UserGroup.findByUUID(UUIDHelper.fromString(groupUUID));
        if (!group) {
            throw new NotFoundError(UserGroup, { uuid: groupUUID });
        }

        const user: User = await User.findByUUID(UUIDHelper.fromString(userUUID));
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
        if (!User.checkPrivilege(currentUser, UserPrivilege.ManageUsers)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const group: UserGroup = await UserGroup.findByUUID(UUIDHelper.fromString(groupUUID));
        if (!group) {
            throw new NotFoundError(UserGroup, { uuid: groupUUID });
        }

        const user: User = await User.findByUUID(UUIDHelper.fromString(userUUID));
        if (!user) {
            throw new NotFoundError(User, { uuid: userUUID });
        }

        // Not joined?
        if (!await user.leaveGroup(group)) {
            throw new InvalidInputError({ groupUUID, userUUID });
        }
    }
}
