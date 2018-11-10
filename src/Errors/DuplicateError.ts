import CommonError from "Errors/CommonError";

// The error is thrown when a request is creating a object but another
// existing object conflicts with the requested parameters.
export default class DuplicateError extends CommonError {
    public objectType: string;
    public match: object;

    constructor(objectType: { new(...args: [any]) }, match: object) {
        super();
        this.objectType = objectType.name;
        this.match = match;
    }

    toJSON() {
        return {
            error: "DuplicateError",
            objectType: this.objectType,
            match: this.match
        };
    }
}
