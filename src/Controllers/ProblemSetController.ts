import "reflect-metadata";
import { JsonController, Param, BodyParam, State, Get, Post, OnUndefined, Authorized } from "routing-controllers";

import IPermissionControl from "Interfaces/IPermissionControl";

import NotFoundError from "Errors/NotFoundError";
import AuthError, { AuthErrorType } from "Errors/AuthError";
import InvalidInputError from "Errors/InvalidInputError";
import DuplicateError from "Errors/DuplicateError";

import UUIDHelper from "Helpers/UUIDHelper";

import User, { UserPrivilege } from "Services/User";
import ProblemSet, { IProblemSetBriefInfo, IProblemSetPermissionControl } from "Services/ProblemSet";
import PermissionControlHelper from "Helpers/PermissionControlHelper";

@JsonController()
export class ProblemSetController {
    // Get a group's brief info by its uuid.
    @Get("/problemSet/getByUUID/:uuid")
    private async getByUUID(@State("user") currentUser: User,
                            @Param("uuid") uuid: string): Promise<IProblemSetBriefInfo> {
        const problemSet: ProblemSet = await ProblemSet.findByUUID(UUIDHelper.fromString(uuid));
        if (!problemSet) {
            throw new NotFoundError(ProblemSet, { uuid });
        }

        if (!await PermissionControlHelper.checkPermission(currentUser, problemSet.getPermissionControl().list, UserPrivilege.ManageProblems)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        // A non-manager user can't see the permission control
        const briefInfo: IProblemSetBriefInfo = await problemSet.getBriefInfo();
        if (briefInfo.ownUser || !User.checkPrivilege(currentUser, UserPrivilege.ManageProblems)) {
            delete briefInfo.permissionControl;
        }

        return briefInfo;
    }

    // Get a ProblemSet's brief info by its name.
    @Get("/problemSet/getByUrlName/:urlName")
    private async getByUrlName(@State("user") currentUser: User,
                               @Param("urlName") urlName: string): Promise<IProblemSetBriefInfo> {
        const problemSet: ProblemSet = await ProblemSet.findByUrlName(urlName);
        if (!problemSet) {
            throw new NotFoundError(ProblemSet, { urlName });
        }

        if (!await PermissionControlHelper.checkPermission(currentUser, problemSet.getPermissionControl().list, UserPrivilege.ManageProblems)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        // A non-manager user can't see the permission control
        const briefInfo: IProblemSetBriefInfo = await problemSet.getBriefInfo();
        if (briefInfo.ownUser || !User.checkPrivilege(currentUser, UserPrivilege.ManageProblems)) {
            delete briefInfo.permissionControl;
        }

        return briefInfo;
    }

    // Get a ProblemSet's brief info by its ownUser.
    @Get("/problemSet/getByOwnUser/:userUUID")
    private async getByOwnUser(@State("user") currentUser: User,
                               @Param("userUUID") userUUID: string): Promise<IProblemSetBriefInfo> {
        const problemSet: ProblemSet = await ProblemSet.findByOwnUser(UUIDHelper.fromString(userUUID));
        if (!problemSet) {
            throw new NotFoundError(ProblemSet, { ownUser: userUUID });
        }

        if (!await PermissionControlHelper.checkPermission(currentUser, problemSet.getPermissionControl().list, UserPrivilege.ManageProblems)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const briefInfo: IProblemSetBriefInfo = await problemSet.getBriefInfo();
        delete briefInfo.permissionControl;

        return briefInfo;
    }

    // Create a new ProblemSet.
    @Post("/problemSet/create")
    @Authorized()
    private async create(@State("user") currentUser: User,
                         @BodyParam("name") name: string,
                         @BodyParam("urlName") urlName: string): Promise<IProblemSetBriefInfo> {
        if (!User.checkPrivilege(currentUser, UserPrivilege.ManageProblems)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        if (!ProblemSet.isValidName(name)) {
            throw new InvalidInputError({ name });
        }

        if (!ProblemSet.isValidUrlName(urlName)) {
            throw new InvalidInputError({ urlName });
        }

        const problemSet: ProblemSet = await ProblemSet.createGlobal(name, urlName);
        if (!problemSet) {
            throw new DuplicateError(ProblemSet, { urlName });
        }

        return await problemSet.getBriefInfo();
    }

    // Delete a existing ProblemSet.
    @Post("/problemSet/delete")
    @OnUndefined(200)
    @Authorized()
    private async delete(@State("user") currentUser: User,
                         @BodyParam("uuid") uuid: string): Promise<void> {
        if (!User.checkPrivilege(currentUser, UserPrivilege.ManageProblems)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        const problemSet: ProblemSet = await ProblemSet.findByUUID(UUIDHelper.fromString(uuid));
        if (!problemSet) {
            throw new NotFoundError(ProblemSet, { uuid });
        }

        // A private ProblemSet can't be deleted.
        if (problemSet.ownUser) {
            throw new InvalidInputError({ uuid });
        }

        // A ProblemSet with problems can't be deleted.
        if (problemSet.problemCount) {
            throw new InvalidInputError({ uuid });
        }

        await ProblemSet.delete(problemSet);
    }

    // Update a ProblemSet's PermissionControl.
    @Post("/problemSet/updatePermissionControl/")
    @OnUndefined(200)
    @Authorized()
    private async updatePermissionControl(@State("user") currentUser: User,
                                          @BodyParam("uuid") uuid: string,
                                          @BodyParam("newPermissionControl") newPermissionControl: IProblemSetPermissionControl): Promise<void> {
        if (!User.checkPrivilege(currentUser, UserPrivilege.ManageProblems)) {
            throw new AuthError(AuthErrorType.PermissionDenied);
        }

        // Normalize (may be invalid) input data
        if (!newPermissionControl) {
            newPermissionControl = {} as IProblemSetPermissionControl;
        }
        if (!newPermissionControl.list) {
            newPermissionControl.list = {} as IPermissionControl;
        }
        if (!newPermissionControl.modify) {
            newPermissionControl.modify = {} as IPermissionControl;
        }

        if (newPermissionControl.modify.guestAllow) {
            throw new InvalidInputError({ "newPermissionControl.modify.guestAllow": newPermissionControl.modify.guestAllow });
        }

        const problemSet: ProblemSet = await ProblemSet.findByUUID(UUIDHelper.fromString(uuid));
        if (!problemSet) {
            throw new NotFoundError(ProblemSet, { uuid });
        }

        // A private ProblemSet doesn't have PermissionControl.
        if (problemSet.ownUser) {
            throw new InvalidInputError({ uuid });
        }

        const normalized: IProblemSetPermissionControl = {
            list: await PermissionControlHelper.normalize(newPermissionControl.list),
            modify: await PermissionControlHelper.normalize(newPermissionControl.modify)
        };

        problemSet.setPermissionControl(normalized);

        await problemSet.save();
    }
}
