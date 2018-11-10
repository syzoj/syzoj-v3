import CommonError from "Errors/CommonError";

// The error is thrown when a request is finding a object but a object
// matching the requested parameters is not found.
export default class NotFoundError extends CommonError {
    public objectType: string;
    public match: object;

    constructor(objectType: { new(...args: [any]) }, match: object) {
        super();
        this.objectType = objectType.name;
        this.match = match;
    }

    toJSON() {
        return {
            error: "NotFoundError",
            objectType: this.objectType,
            match: this.match
        };
    }
}
