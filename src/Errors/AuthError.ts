import CommonError from "Errors/CommonError";

export enum AuthErrorType {
    AlreadyLoggedIn = "AlreadyLoggedIn",
    NotLoggedIn = "NotLoggedIn",
    PermissionDenied = "PermissionDenied",

    WrongPassword = "WrongPassword"
}

// The error is thrown when a request is attemping a action which
// is not permitted for the current user or "not logged in" state.
export default class AuthError extends CommonError {
    public type: AuthErrorType;

    constructor(type: AuthErrorType) {
        super();
        this.type = type;
    }

    toJSON() {
        return {
            error: "AuthError",
            type: this.type
        };
    }
}
