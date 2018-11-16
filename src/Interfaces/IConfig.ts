export default interface IConfig {
    server?: {
        // The hostname (or IP address) the API server listen on.
        // default: "127.0.0.1"
        listenHostname?: string;

        // The port number the API server listen on.
        // default: 9133
        listenPort?: number;
    };

    database?: {
        // The url to connect to mongodb.
        // default: "mongodb://localhost:27017/syzoj"
        mongoUrl?: string;
    };

    // This section's data is very important, don't leak!
    security?: {
        // The secret use to sign data related to session.
        // default randomly generated.
        sessionSecret?: string;
    };
}
