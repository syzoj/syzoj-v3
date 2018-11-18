import "reflect-metadata";
import { JsonController, Param, BodyParam, QueryParam, State, Get, Post, OnUndefined } from "routing-controllers";

import NotFoundError from "Errors/NotFoundError";
import InvalidInputError from "Errors/InvalidInputError";
import DuplicateError from "Errors/DuplicateError";
import AuthError, { AuthErrorType } from "Errors/AuthError";

import User, { IUserBriefInfo } from "Services/User";
import ProblemSet from "Services/ProblemSet";

@JsonController()
export class AuthController {
    @Post("/auth/register")
    private async register(@State() state,
                           @BodyParam("userName") userName: string,
                           @BodyParam("password") password: string,
                           @BodyParam("email") email: string): Promise<IUserBriefInfo> {
        if (state.user) {
            throw new AuthError(AuthErrorType.AlreadyLoggedIn);
        }

        if (!User.isValidUserName(userName)) {
            throw new InvalidInputError({ userName });
        }

        if (!User.isValidEmail(email)) {
            throw new InvalidInputError({ email });
        }

        const user: User = await User.registerNewUser(userName, password, email);
        if (!user) {
            throw new DuplicateError(User, { userName });
        }

        await user.save();

        state.user = user;

        // Create the user's private ProblemSet.
        await ProblemSet.createPrivate(user.uuid);

        return await user.getBriefInfo();
    }

    @Post("/auth/login")
    private async login(@State() state,
                        @BodyParam("userName") userName: string,
                        @BodyParam("password") password: string): Promise<IUserBriefInfo> {
        if (state.user) {
            throw new AuthError(AuthErrorType.AlreadyLoggedIn);
        }

        const user: User = await User.findByUserName(userName);
        if (!user) {
            throw new NotFoundError(User, { userName });
        }

        if (!await user.checkPassword(password)) {
            throw new AuthError(AuthErrorType.WrongPassword);
        }

        state.user = user;

        return await user.getBriefInfo();
    }

    @Post("/auth/logout")
    @OnUndefined(200)
    private async logout(@State() state): Promise<void> {
        if (!state.user) {
            throw new AuthError(AuthErrorType.NotLoggedIn);
        }

        delete state.user;
    }
}
