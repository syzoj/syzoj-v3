import { ProblemSetInstance, ProblemSetModel } from "Models/ProblemSetModel";
import UUIDHelper, { UUID } from "Helpers/UUIDHelper";
import PermissionControlHelper from "Helpers/PermissionControlHelper";

import IPermissionControl from "Interfaces/IPermissionControl";

export interface IProblemSetPermissionControl {
    list: IPermissionControl;
    modify: IPermissionControl;
}

export interface IProblemSetBriefInfo {
    uuid: string;
    problemCount: number;
    name: string;
    urlName: string;
    permissionControl: IProblemSetPermissionControl;
    ownUser: string;
}

export default class ProblemSet {
    private data: ProblemSetInstance;

    constructor(data: any) {
        if (data instanceof ProblemSetModel) {
            this.data = data;
        } else {
            this.data = new ProblemSetModel(data);
        }
    }

    get uuid(): UUID { return this.data._id; }
    get problemCount(): number { return this.data.problemCount; }
    set problemCount(problemCount: number) { this.data.problemCount = problemCount; }
    get name(): string { return this.data.name; }
    set name(name: string) { this.data.name = name; }
    get urlName(): string { return this.data.urlName; }
    set urlName(urlName: string) { this.data.urlName = urlName; }
    get ownUser(): UUID { return this.data.ownUser; }
    set ownUser(ownUser: UUID) { this.data.ownUser = ownUser; }

    getBriefInfo(): IProblemSetBriefInfo {
        return {
            uuid: UUIDHelper.toString(this.uuid),
            problemCount: this.problemCount,
            name: this.name,
            urlName: this.urlName,
            permissionControl: this.getPermissionControl(),
            ownUser: UUIDHelper.toString(this.ownUser)
        };
    }

    getPermissionControl(): IProblemSetPermissionControl {
        return {
            list: PermissionControlHelper.convertUUIDToString(this.data.permissionControl.list),
            modify: PermissionControlHelper.convertUUIDToString(this.data.permissionControl.modify)
        } as IProblemSetPermissionControl;
    }

    setPermissionControl(permissionControl: IProblemSetPermissionControl): void {
        this.data.permissionControl.list = PermissionControlHelper.convertStringToUUID(permissionControl.list);
        this.data.permissionControl.modify = PermissionControlHelper.convertStringToUUID(permissionControl.modify);
    }

    async save() {
        await this.data.save();
    }

    // Find a ProblemSet by a UUID, return null if the passed UUID is not found.
    static async findByUUID(uuid: UUID): Promise<ProblemSet> {
        // uuid may not be a legal object id.
        const data: ProblemSetInstance = await ProblemSetModel.findOne({ _id: uuid });
        return data ? new ProblemSet(data) : null;
    }

    static async findByUrlName(urlName: string): Promise<ProblemSet> {
        const data: ProblemSetInstance = await ProblemSetModel.findOne({ urlName });
        return data ? new ProblemSet(data) : null;
    }

    static async findByOwnUser(userUUID: UUID): Promise<ProblemSet> {
        const data: ProblemSetInstance = await ProblemSetModel.findOne({ ownUser: userUUID });
        return data ? new ProblemSet(data) : null;
    }

    // A ProblemSet's name is a string of 1 ~ 50 non-newline characters.
    static isValidName(name: string): boolean {
        return name && /^[^\n]{1,50}$/.test(name);
    }

    // A ProblemSet's name is a string of 1 ~ 16 ASCII characters, and each character
    // is a uppercase / lowercase letter or a number or any of '-_.#$%'.
    static isValidUrlName(name: string): boolean {
        return name && /^[a-zA-Z0-9\-\_\.\#\$\%]{1,16}$/.test(name);
    }

    // Create a new global ProblemSet with input name & urlName.
    // Return the created ProblemSet object, or null if the urlName exists.
    // Notice that two ProblemSet's names can be the same.
    static async createGlobal(name: string, urlName: string): Promise<ProblemSet> {
        if (await this.findByUrlName(urlName)) {
            return null;
        }

        const newProblemSet: ProblemSet = new ProblemSet({
            name,
            urlName,
            permissionControl: {
                list: { defaultAllow: false, guestAllow: false },
                modify: { defaultAllow: false, guestAllow: false }
            }
        });

        await newProblemSet.save();

        return newProblemSet;
    }

    // Create a new private ProblemSet for a user.
    // Return the created ProblemSet object.
    static async createPrivate(userUUID: UUID): Promise<ProblemSet> {
        const newProblemSet: ProblemSet = new ProblemSet({
            ownUser: userUUID,
            permissionControl: null
        });

        await newProblemSet.save();

        return newProblemSet;
    }

    static async delete(problemSet: ProblemSet): Promise<void> {
        // TODO: Find all problems in this ProblemSet and (move them to somewhere?).
        await ProblemSetModel.deleteOne({
            _id: problemSet.uuid
        });
    }
}
