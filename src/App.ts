import * as KoaApp from "koa";
import * as KoaBodyParser from "koa-bodyparser";
import * as Mongoose from "mongoose";
import * as Winston from "winston";
import * as fs from "fs-extra";
import * as Lodash from "lodash";

import CommonError from "Errors/CommonError";

import IConfig from "Config/IConfig";
import DefaultConfig from "Config/DefaultConfig";

class SYZOJ {
    public koaApp: KoaApp;
    public logger: Winston.Logger;
    public config: IConfig;

    public async initialize(configFile: string, version: any) {
        this.logger = Winston.createLogger({
            level: "info",
            format: Winston.format.combine(
                Winston.format.timestamp(),
                Winston.format.printf(((info) => { info.level = Lodash.padStart(info.level, 5).toUpperCase(); return info; }) as any),
                Winston.format.colorize(),
                Winston.format.printf((info) => `${info.timestamp.replace(/T|Z/g, " ").trim()} ${info.level}: ${info.message}`)
            ),
            transports: [new Winston.transports.Console()]
        });

        this.logger.info(`Starting SYZOJ-v3 version ${version.versionString}.`);
        if (version.gitVersion) {
            this.logger.warn(`This is a git version (${version.gitVersion}) and maybe unstable, use it with caution in production!`);
        }

        // If the configuration file doesn't exist, write the default configuration
        // file to it.
        // If the configuration file exists, merge it with the default configuration
        // and update the file (for upgrading).
        if (!await fs.pathExists(configFile)) {
            this.logger.warn(`The specified configuration file ${configFile} doesn't exist, attempting to create a default one.`);
            this.config = DefaultConfig;
            try {
                await fs.outputJSON(configFile, this.config, { spaces: 1 });
                this.logger.info(`Successfully written default configuration to '${configFile}'.`);
            } catch (e) {
                this.logger.error(`Can't write default configuration to '${configFile}' - ${e}.`);
                process.exit(1);
            }
        } else {
            try {
                const parsedConfig: IConfig = await fs.readJSON(configFile);
                this.logger.info(`Successfully read configuration from '${configFile}'.`);

                // Check if there's new keys in this version's DefaultConfig, if so,
                // update the configuration file.
                this.config = Lodash.merge(DefaultConfig, parsedConfig);
                if (!Lodash.isEqual(this.config, parsedConfig)) {
                    this.logger.info(`Configuration upgraded with default values for new keys.`);
                    try {
                        await fs.outputJSON(configFile, this.config, { spaces: 1 });
                        this.logger.info(`Successfully written upgraded configuration to '${configFile}'.`);
                    } catch (e) {
                        // Can't update the configuration file, but server can run.
                        this.logger.warning(`Can't write upgraded configuration to '${configFile}, check file permissions' - ${e}.`);
                    }
                }
            } catch (e) {
                this.logger.error(`Can't read configuration from '${configFile}' - ${e}.`);
                process.exit(1);
            }
        }

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

        this.logger.info("Application initialized successfully.");
    }

    public start() {
        Mongoose.connect(this.config.database.mongoUrl, { useNewUrlParser: true });
        this.logger.info("Database connected successfully.");
        this.koaApp.listen(this.config.server.listenPort, this.config.server.listenHostname).on("error", (err) => {
            this.logger.error(`Can't start HTTP server on ${this.config.server.listenHostname}:${this.config.server.listenPort} - ${err}`);
            process.exit(1);
        }).on("listening", () => {
            this.logger.info(`Started HTTP server on ${this.config.server.listenHostname}:${this.config.server.listenPort}.`);
        });
    }
}

const app: SYZOJ = new SYZOJ();

export default app;
