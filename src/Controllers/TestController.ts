import "reflect-metadata";
import { JsonController, Param, BodyParam, QueryParam, State, Get, Post, OnUndefined } from "routing-controllers";

import App from "App";
import * as Mongoose from "mongoose";

import AuthError, { AuthErrorType } from "Errors/AuthError";

import UUIDHelper from "Helpers/UUIDHelper";

import User from "Services/User";

@JsonController()
export class TestController {
    @Post("/test/dropDatabase")
    @OnUndefined(200)
    private async dropDatabase(): Promise<void> {
        if (App.testMode) {
            App.logger.warn("/test/dropDatabase requested, invoking Mongoose.connection.db.dropDatabase().");
            await Mongoose.connection.db.dropDatabase();
        } else {
            App.logger.warn("/test/dropDatabase requested but app not running under test mode, ignoring.");
            throw new AuthError(AuthErrorType.PermissionDenied);
        }
    }

    @Post("/test/setAdmin")
    @OnUndefined(200)
    private async setAdmin(@BodyParam("uuid") uuid: string,
                           @BodyParam("isAdmin") isAdmin: boolean): Promise<void> {
        if (App.testMode) {
            const user: User = await User.findByUUID(UUIDHelper.fromString(uuid));
            if (user) {
                App.logger.warn(`/test/setAdmin requested, updating isAdmin for user '${user.userName}'.`);
                user.isAdmin = !!isAdmin;
                await user.save();
            } else {
                App.logger.warn(`/test/setAdmin requested, but a user with uuid = ${uuid} is not found, ignoring.`);
            }
        } else {
            App.logger.warn("/test/setAdmin requested but app not running under test mode, ignoring.");
            throw new AuthError(AuthErrorType.PermissionDenied);
        }
    }
}
