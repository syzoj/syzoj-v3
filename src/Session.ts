import app from "App";
import * as KoaSession from "koa-session";

import UUIDHelper from "Helpers/UUIDHelper";
import { User } from "Services/User";

app.koaApp.keys = [app.config.security.sessionSecret];
app.koaApp.use(KoaSession({
    rolling: true,
    signed: true
}, app.koaApp));

// Because a user's info can be modified when it's logged in,
// we don't store its info in session but store the user's uuid
// in session and get the user object before any action and store
// it into Koa's state.
// After actions are done, if the state no longer exists, which
// means the user likely did a logout, clear the user uuid in session.
app.koaApp.use(async (ctx, next) => {
    if (ctx.session.user) {
        const user: User = await User.findByUUID(UUIDHelper.fromString(ctx.session.user as string));
        if (user) {
            (ctx.state.user as User) = user;
        }
    }

    if (!ctx.state.user) {
        // Workaround: The @State() in "routing-controllers" has a bug -- if
        // the state is null or undefined, it will throw a error.
        ctx.state.user = false;
    }

    await next();

    if (ctx.state.user) {
        // User logged in.
        (ctx.session.user as string) = await UUIDHelper.toString((ctx.state.user as User).uuid);
    } else {
        delete ctx.session.user;
    }
});
