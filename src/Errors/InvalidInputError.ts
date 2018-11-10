import CommonError from "Errors/CommonError";

// The error is thrown when a param of a request can't pass the validation.
export default class InvalidInputError extends CommonError {
    public fieldName: string;
    public value: any;

    constructor(field: object) {
        super();
        this.fieldName = Object.keys(field)[0];
        this.value = field[this.fieldName];
    }

    toJSON() {
        return {
            error: "InvalidInputError",
            fieldName: this.fieldName,
            value: this.value
        };
    }
}
