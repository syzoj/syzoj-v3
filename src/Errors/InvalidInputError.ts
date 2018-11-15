import CommonError from "Errors/CommonError";

// The error is thrown when params of a request can't pass the validation.
export default class InvalidInputError extends CommonError {
    public fields;

    constructor(fields: object) {
        super();
        this.fields = fields;
    }

    toJSON() {
        const fieldNames: string[] = Object.keys(this.fields);
        if (fieldNames.length === 1) {
            return {
                error: "InvalidInputError",
                fieldName: fieldNames[0],
                value: this.fields[fieldNames[0]]
            };
        } else {
            return {
                error: "InvalidInputError",
                fields: fieldNames.map((key: string): any => ({
                    fieldName: key,
                    value: this.fields[key]
                }))
            };
        }
    }
}
