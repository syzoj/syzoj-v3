import { ProblemInstance, ProblemModel } from "Models/ProblemModel";
import { ProblemDetailInstance, ProblemDetailModel } from "Models/ProblemDetailModel";
import UUIDHelper, { UUID } from "Helpers/UUIDHelper";
import PermissionControlHelper from "Helpers/PermissionControlHelper";

import IPermissionControl from "Interfaces/IPermissionControl";

export interface IProblemPermissionControl {
    view: IPermissionControl;
    submit: IPermissionControl;
    modify: IPermissionControl;
}

export interface IProblemBriefInfo {
    uuid: string;
    id: number;
    name: string;
    permissionControl: IProblemPermissionControl;
    problemSet: string;
    ownUser: string;
    submitCount: number;
    acceptedCount: number;
    type: string;
    detail: string;
}

export default class Problem {
    private data: ProblemInstance;

    constructor(data: any) {
        if (data instanceof ProblemModel) {
            this.data = data;
        } else {
            this.data = new ProblemModel(data);
        }
    }

    get uuid(): UUID { return this.data._id; }
    get id(): number { return this.data.id; }
    set id(id: number) { this.data.id = id; }
    get name(): string { return this.data.name; }
    set name(name: string) { this.data.name = name; }
    get ownUser(): UUID { return this.data.ownUser; }
    set ownUser(ownUser: UUID) { this.data.ownUser = ownUser; }
    get submitCount(): number { return this.data.submitCount; }
    set submitCount(submitCount: number) { this.data.submitCount = submitCount; }
    get acceptedCount(): number { return this.data.acceptedCount; }
    set acceptedCount(acceptedCount: number) { this.data.acceptedCount = acceptedCount; }
    get problemSet(): UUID { return this.data.problemSet; }
    set problemSet(problemSet: UUID) { this.data.problemSet = problemSet; }
    get type(): string { return this.data.type; }
    set type(type: string) { this.data.type = type; }
    get detail(): UUID { return this.data.detail; }
    set detail(detail: UUID) { this.data.detail = detail; }

    getBriefInfo(): IProblemBriefInfo {
        return {
            uuid: UUIDHelper.toString(this.uuid),
            id: this.id,
            name: this.name,
            permissionControl: this.getPermissionControl(),
            problemSet: UUIDHelper.toString(this.problemSet),
            ownUser: UUIDHelper.toString(this.ownUser),
            submitCount: this.submitCount,
            acceptedCount: this.acceptedCount,
            type: this.type,
            detail: UUIDHelper.toString(this.detail)
        };
    }

    getPermissionControl(): IProblemPermissionControl {
        return {
            view: PermissionControlHelper.convertUUIDToString(this.data.permissionControl.view),
            submit: PermissionControlHelper.convertUUIDToString(this.data.permissionControl.submit),
            modify: PermissionControlHelper.convertUUIDToString(this.data.permissionControl.modify)
        } as IProblemPermissionControl;
    }

    setPermissionControl(permissionControl: IProblemPermissionControl): void {
        this.data.permissionControl.view = PermissionControlHelper.convertStringToUUID(permissionControl.view);
        this.data.permissionControl.submit = PermissionControlHelper.convertStringToUUID(permissionControl.submit);
        this.data.permissionControl.modify = PermissionControlHelper.convertStringToUUID(permissionControl.modify);
    }

    async save() {
        await this.data.save();
    }

    // Find a ProblemSet by a UUID, return null if the passed UUID is not found.
    static async findByUUID(uuid: UUID): Promise<Problem> {
        const data: ProblemInstance = await ProblemModel.findOne({ _id: uuid });
        return data ? new Problem(data) : null;
    }

    static async findByProblemSetAndID(problemSet: UUID, id: number): Promise<Problem> {
        const data: ProblemInstance = await ProblemModel.findOne({ problemSet, id });
        return data ? new Problem(data) : null;
    }

    // A Problem's name is a string of 1 ~ 50 non-newline characters.
    static isValidName(name: string): boolean {
        return name && /^[^\n]{1,50}$/.test(name);
    }

    static async create(id: number, name: string, problemSet: UUID, ownUser: UUID, type: string, detail: UUID): Promise<Problem> {
        const problem: Problem = new Problem({
            id,
            name,
            permissionControl: {
                view: { defaultAllow: false, guestAllow: false },
                submit: { defaultAllow: false, guestAllow: false },
                modify: { defaultAllow: false, guestAllow: false }
            },
            problemSet,
            ownUser,
            type,
            detail,
        });

        await problem.save();

        return problem;
    }
}
