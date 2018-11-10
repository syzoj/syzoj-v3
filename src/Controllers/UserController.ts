import "reflect-metadata";
import { JsonController, Param, BodyParam, QueryParam, Get, Post, Put, Delete } from "routing-controllers";

import NotFoundError from "Errors/NotFoundError";
import { User, IUserBriefInfo } from "Services/User";

@JsonController()
export class UserController {
    // Get a user's brief info by its uuid.
    @Get("/user/uuid/:uuid")
    private async GET_user_uuid(@Param("uuid") uuid: string): Promise<IUserBriefInfo> {
        const user: User = await User.findByUUID(uuid);
        if (!user) {
            throw new NotFoundError(User, { uuid });
        }

        return await user.getBriefInfo();
    }

    // Get a user's brief info by its userName.
    @Get("/user/userName/:userName")
    private async GET_user_userName(@Param("userName") userName: string): Promise<IUserBriefInfo> {
        const user: User = await User.findByUserName(userName);
        if (!user) {
            throw new NotFoundError(User, { userName });
        }

        return await user.getBriefInfo();
    }
}
