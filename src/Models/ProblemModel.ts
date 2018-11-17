import { model as createModel, Schema } from "mongoose";
import ObjectId = Schema.Types.ObjectId;

import PermissionControl from "Models/Interfaces/PermissionControl";

export type ProblemInstance = any;

// Problem is very abstract object - it can be various types.
// The properties that can't be shared between different type are stored in detail as
// a Object.
const schema: Schema = new Schema({
    name: String,
    permissionControl: {
        view: PermissionControl,
        submit: PermissionControl,
        modify: PermissionControl
    },
    ownUser: ObjectId,
    type: String,
    detail: Object
});

export const ProblemModel = createModel("Problem", schema);
