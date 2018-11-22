import { model as createModel, Schema } from "mongoose";
import ObjectId = Schema.Types.ObjectId;

import PermissionControl from "Models/Interfaces/PermissionControl";

export type ProblemInstance = any;

// Problem is very abstract object - it can be various types.
// The properties that can't be shared between different type are stored in a
// ProblemDetail object which is referenced by detail.
const schema: Schema = new Schema({
    id: { type: Number, index: true },
    name: String,
    permissionControl: {
        view: PermissionControl,
        submit: PermissionControl,
        modify: PermissionControl
    },
    problemSet: { type: ObjectId, index: true },
    ownUser: { type: ObjectId, index: true },
    submitCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    type: { type: String, index: true },
    detail: ObjectId
});

export const ProblemModel = createModel("Problem", schema);
