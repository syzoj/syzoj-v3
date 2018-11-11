// tslint:disable-next-line
require("app-module-path").addPath(__dirname);

import app from "App";
import * as Commander from "commander";
import { useKoaServer } from "routing-controllers";

(async () => {
    const packageInfo = require("../package");
    Commander
        .name(packageInfo.name)
        .usage("--config <file>")
        .version(packageInfo.version)
        .option("-c, --config <file>", "Configuration file (If the path don't exist, it will be created automatically)")
        .parse(process.argv);

    if (!Commander.config) {
        Commander.help();
    }

    await app.initialize(Commander.config);

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
