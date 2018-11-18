import IConfig from "Interfaces/IConfig";
import { generate as generatrRandomString } from "randomstring";

export default (testMode: boolean): IConfig => ({
    server: {
        listenHostname: "127.0.0.1",
        listenPort: 9133
    },
    database: {
        mongoUrl: "mongodb://localhost:27017/" + (testMode ? "test_" : "") + "syzoj"
    },
    security: {
        sessionSecret: generatrRandomString()
    },
    limits: {
        permissionControl: {
            maxUserCount: 10,
            maxGroupCount: 10
        }
    }
});
