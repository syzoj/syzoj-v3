// tslint:disable-next-line
require("app-module-path").addPath(__dirname);

import app from "App";
import { useKoaServer } from "routing-controllers";

(async () => {
    const args = JSON.parse(process.argv[process.argv.length - 1]);

    await app.initialize(args.config);

    require("Session");

    try {
        useKoaServer(app.koaApp, {
            controllers: [
                __dirname + "/Controllers/*.ts"
            ],
            defaultErrorHandler: false
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

    app.start();
})();
