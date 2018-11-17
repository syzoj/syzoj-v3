import { model as createModel, Schema } from "mongoose";
import ObjectId = Schema.Types.ObjectId;

import PermissionControl from "Models/Interfaces/PermissionControl";

export type ProblemSetInstance = any;

// A ProblemSet can be a global ProblemSet or a private ProblemSet.
// A private user belongs to a user, each user has one and only one ProblemSet.
// When a normal user add a problem, it'll be added to its private ProblemSet.
const schema: Schema = new Schema({
    // Both private and global.
    problemCount: { type: Number, default: 0 },

    // Global only.
    name: String,
    urlName: String,
    permissionControl: {
        list: PermissionControl,
        modify: PermissionControl
    },

    // Private only.
    ownUser: ObjectId
});

export const ProblemSetModel = createModel("ProblemSet", schema);
