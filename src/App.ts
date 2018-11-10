import * as KoaApp from "koa";
import * as KoaBodyParser from "koa-bodyparser";
import * as Mongoose from "mongoose";

import CommonError from "Errors/CommonError";

class SYZOJ {
    public koaApp: KoaApp;

    public initialize() {
        this.koaApp = new KoaApp();

        // This middleware make all request's response the same format:
        // { success: true/false, result/error }
        this.koaApp.use(async (ctx, next) => {
            try {
                await next();
                ctx.body = {
                    success: true,
                    result: ctx.body
                };
            } catch (err) {
                // If err is a HttpError, use the httpCode. Otherwise consider it as
                // a server error (likely a bug).
                ctx.status = err.httpCode ? err.httpCode : (err instanceof CommonError ? 200 : 500);
                ctx.body = {
                    success: false,
                    error: err,
                    errorString: require("util").inspect(err)
                };
            }
        });

        this.koaApp.use(KoaBodyParser());
    }

    public start() {
        Mongoose.connect("mongodb://localhost:27017/test", { useNewUrlParser: true });
        this.koaApp.listen(9133);
    }
}

const app: SYZOJ = new SYZOJ();

export default app;
