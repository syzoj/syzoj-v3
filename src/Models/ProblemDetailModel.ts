import { model as createModel, Schema } from "mongoose";

export type ProblemDetailInstance = any;

const schema: Schema = new Schema({
    detail: Object
});

export const ProblemDetailModel = createModel("ProblemDetail", schema);
