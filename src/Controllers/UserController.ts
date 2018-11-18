import "reflect-metadata";
import { JsonController, Param, BodyParam, State, Get, Post, OnUndefined, Authorized } from "routing-controllers";

import NotFoundError from "Errors/NotFoundError";
import AuthError, { AuthErrorType } from "Errors/AuthError";
import InvalidInputError from "Errors/InvalidInputError";

import UUIDHelper from "Helpers/UUIDHelper";

import User, { IUserBriefInfo, UserPrivilege } from "Services/User";

@JsonController()
export class UserController {
    // Get a user's brief info by its uuid.
    @Get("/user/getByUUID/:uuid")
    private async getByUUID(@Param("uuid") uuid: string): Promise<IUserBriefInfo> {
        const user: User = await User.findByUUID(UUIDHelper.fromString(uuid));
        if (!user) {
            throw new NotFoundError(User, { uuid });
        }

        return await user.getBriefInfo();
    }

    // Get a user's brief info by its userName.
    @Get("/user/getByUserName/:userName")
    private async getByUserName(@Param("userName") userName: string): Promise<IUserBriefInfo> {
        const user: User = await User.findByUserName(userName);
        if (!user) {
            throw new NotFoundError(User, { userName });
        }

        return await user.getBriefInfo();
    }

    // Get a logged in user's brief info.
    @Get("/user/getSelf")
    @Authorized()
    private async getSelf(@State("user") user: User): Promise<IUserBriefInfo> {
        return await user.getBriefInfo();
    }

    // Update a user's infomation.
    // userName:    Can only be modified by a "ManageUsers" privileged user.
    //
    // description: Can be modified by the user itself or a "ManageUsers" privileged user.
    //
    // password:    Can be modified by the user itself with the old password (for security)
    //              and a "ManageUsers" privileged can modify anyone's password without
    //              old password (including itself).
    //
    // email:       Can be modified by the user itself with a verify code sent to the new
    //              email address and a "ManageUsers" privileged user can modify anyone's
    //              email without verify (including itself).
    @Post("/user/update/:uuid")
    @OnUndefined(200)
    @Authorized()
    private async update(@State("user") currentUser: User,
                         @Param("uuid") uuid: string,
                         @BodyParam("userName") userName: string,
                         @BodyParam("description") description: string,
                         @BodyParam("oldPassword") oldPassword: string,
                         @BodyParam("newPassword") newPassword: string,
                         @BodyParam("email") email: string): Promise<void> {
        const targetUser: User = await User.findByUUID(UUIDHelper.fromString(uuid));
        if (!targetUser) {
            throw new NotFoundError(User, { uuid });
        }

        const privileged: boolean = User.checkPrivilege(currentUser, UserPrivilege.ManageUsers);

        // Only a "ManageUsers" privileged user can modify another user.
        if (!privileged && await targetUser.uuid !== await currentUser.uuid) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        if (!privileged && targetUser.userName !== userName) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }
        if (!User.isValidUserName(userName)) {
            throw new InvalidInputError({ userName });
        }
        targetUser.userName = userName;

        targetUser.description = description;

        if (newPassword) {
            if (!privileged && !await targetUser.checkPassword(oldPassword)) {
                throw new AuthError(AuthErrorType.WrongPassword);
            }
            await targetUser.setPassword(newPassword);
        }

        // TODO: Send verify email.
        if (!privileged && targetUser.email !== email) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }
        if (!User.isValidEmail(email)) {
            throw new InvalidInputError({ email });
        }
        targetUser.email = email;

        await targetUser.save();
    }

    @Post("/user/updatePrivilege/:uuid")
    @OnUndefined(200)
    @Authorized()
    private async updatePrivilege(@State("user") currentUser: User,
                                  @Param("uuid") uuid: string,
                                  @BodyParam("privilege") privilege: string,
                                  @BodyParam("grant") grant: boolean): Promise<void> {
        if (!currentUser.isAdmin) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const user: User = await User.findByUUID(UUIDHelper.fromString(uuid));
        if (!user) {
            throw new NotFoundError(User, { uuid });
        }

        if (!(privilege in UserPrivilege)) {
            throw new InvalidInputError({ privilege });
        }

        if (grant) {
            user.addPrivilege(privilege as UserPrivilege);
        } else {
            user.delPrivilege(privilege as UserPrivilege);
        }

        await user.save();
    }
}
