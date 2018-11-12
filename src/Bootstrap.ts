// tslint:disable-next-line
require("app-module-path").addPath(__dirname);

import AuthError, { AuthErrorType } from "Errors/AuthError";

import app from "App";
import { useKoaServer, Action } from "routing-controllers";

(async () => {
    // Parse command line arguments.
    const args = JSON.parse(process.argv[process.argv.length - 1]);

    // Initialize application.
    await app.initialize(args.config);

    // Load session support.
    require("Session");

    // Load controllers.
    try {
        useKoaServer(app.koaApp, {
            controllers: [
                __dirname + "/Controllers/*.ts"
            ],
            defaultErrorHandler: false,
            authorizationChecker: async (action: Action): Promise<boolean> => {
                if (!action.context.state.user) {
                    throw new AuthError(AuthErrorType.NotLoggedIn);
                }
                return true;
            }
        });
        app.logger.info(`Successfully loaded controllers.`);
    } catch (e) {
        app.logger.error(`Error loading controllers - ${e.stack}.`);
        process.exit(1);
    }

    // Handle invalid URLs.
    app.koaApp.use(async (ctx, next) => {
        throw {
            httpCode: 400,
            message: "Invalid URL"
        };
    });

    // Start application.
    app.start();
})();
