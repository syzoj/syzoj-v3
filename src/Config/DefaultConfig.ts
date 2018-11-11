import IConfig from "Config/IConfig";
import { generate as generatrRandomString } from "randomstring";

export default {
    server: {
        listenHostname: "127.0.0.1",
        listenPort: 9133
    },
    database: {
        mongoUrl: "mongodb://localhost:27017/syzoj"
    },
    security: {
        sessionSecret: generatrRandomString()
    }
} as IConfig;
