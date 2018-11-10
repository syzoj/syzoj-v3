// tslint:disable-next-line
require("app-module-path").addPath(__dirname);

import app from "App";

app.initialize();

import "Session";

import { useKoaServer } from "routing-controllers";

useKoaServer(app.koaApp, {
    controllers: [
        __dirname + "/Controllers/*.ts"
    ],
    defaultErrorHandler: false
});

// Handle invalid URLs.
app.koaApp.use(async (ctx, next) => {
    throw {
        httpCode: 400,
        message: "Invalid URL"
    };
});

app.start();
