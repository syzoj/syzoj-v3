import "reflect-metadata";
import { JsonController, Param, BodyParam, QueryParam, State, Get, Post, OnUndefined } from "routing-controllers";

import App from "App";
import * as Mongoose from "mongoose";

import AuthError, { AuthErrorType } from "Errors/AuthError";

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
}
