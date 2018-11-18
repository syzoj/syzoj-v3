import { expect } from "chai";
import "mocha";

import * as Request from "request-promise-native";

const request = Request.defaults({
    json: true,
    jar: Request.jar()
});

const requestNoLogin = Request.defaults({
    json: true,
    jar: false
});

const requestAdmin = Request.defaults({
    json: true,
    jar: Request.jar()
});

const requestUnprivileged = Request.defaults({
    json: true,
    jar: Request.jar()
});

const serverUrl: string = "http://localhost:9133";

describe("Drop database", () => {
    it("Drop database with test mode API", async () => {
        const result: any = await request.post(serverUrl + "/test/dropDatabase");

        expect(result).to.deep.include({
            success: true
        });
    });
});

const users: string[] = [];

describe("Auth", () => {
    it("A invalid userName should return InvalidInputError", async () => {
        const invalidUserName: string = "%%%Menci";
        const result: any = await requestNoLogin.post(serverUrl + "/auth/register", {
            form: {
                userName: invalidUserName,
                password: "123456",
                email: "mod@syz.oj"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "InvalidInputError",
            fieldName: "userName",
            value: invalidUserName
        });
    });

    it("A invalid email should return InvalidInputError", async () => {
        const invalidEmail: string = "%%% @syz.oj";
        const result: any = await requestNoLogin.post(serverUrl + "/auth/register", {
            form: {
                userName: "syzoojx",
                password: "123456",
                email: invalidEmail
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "InvalidInputError",
            fieldName: "email",
            value: invalidEmail
        });
    });

    it("A valid userName & email should be registered successfully", async () => {
        const email: string = "menci@syz.oj";
        const userName: string = "Menci";
        const result: any = await request.post(serverUrl + "/auth/register", {
            form: {
                userName,
                password: "123456",
                email
            }
        });

        users.push(result.result.uuid);

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            email,
            avatar: email,
            userName
        });
    });

    it("Logout should success", async () => {
        const result: any = await request.post(serverUrl + "/auth/logout");

        expect(result).to.deep.include({
            success: true
        });
    });

    it("Login with non-existing userName should return NotFoundError", async () => {
        const userName: string = "Menci1";
        const result: any = await requestNoLogin.post(serverUrl + "/auth/login", {
            form: {
                userName: "Menci1",
                password: "123456"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "NotFoundError",
            objectType: "User",
            match: {
                userName
            }
        });
    });

    it("Login with wrong password should return AuthError", async () => {
        const userName: string = "Menci";
        const result: any = await requestNoLogin.post(serverUrl + "/auth/login", {
            form: {
                userName: "Menci",
                password: "0528"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "WrongPassword"
        });
    });

    it("Login with right password should success", async () => {
        const userName: string = "Menci";
        const result: any = await request.post(serverUrl + "/auth/login", {
            form: {
                userName: "Menci",
                password: "123456"
            }
        });

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            userName,
            uuid: users[0]
        });
    });

    it("Duplicate userName should return DuplicateError", async () => {
        const email: string = "menci1@syz.oj";
        const userName: string = "Menci";
        const result: any = await requestNoLogin.post(serverUrl + "/auth/register", {
            form: {
                userName,
                password: "123456",
                email
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "DuplicateError",
            objectType: "User",
            match: {
                userName
            }
        });
    });

    it("Duplicate email should return DuplicateError", async () => {
        const email: string = "menci@syz.oj";
        const userName: string = "Menci1";
        const result: any = await requestNoLogin.post(serverUrl + "/auth/register", {
            form: {
                userName,
                password: "123456",
                email
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "DuplicateError",
            objectType: "User",
            match: {
                email
            }
        });
    });

    it("Logout without logged in should return AuthError", async () => {
        const result: any = await requestNoLogin.post(serverUrl + "/auth/logout");

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "NotLoggedIn"
        });
    });
});

describe("User", () => {
    it("Get self without logged in should return AuthError", async () => {
        const result: any = await requestNoLogin.get(serverUrl + "/user/getSelf");

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "NotLoggedIn"
        });
    });

    it("Get self with logged in should return AuthError", async () => {
        const result: any = await request.get(serverUrl + "/user/getSelf");

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            userName: "Menci",
            email: "menci@syz.oj"
        });
    });

    it("Get user brief info by UUID with logged in should success", async () => {
        const result: any = await requestNoLogin.get(serverUrl + "/user/getByUUID/" + users[0]);

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            userName: "Menci",
            email: "menci@syz.oj"
        });
    });

    it("Get user brief info by UUID without logged in should success", async () => {
        const result: any = await request.get(serverUrl + "/user/getByUUID/" + users[0]);

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            userName: "Menci",
            email: "menci@syz.oj"
        });
    });

    it("Get user brief info by user name with logged in should success", async () => {
        const result: any = await requestNoLogin.get(serverUrl + "/user/getByUserName/" + "Menci");

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            userName: "Menci",
            email: "menci@syz.oj"
        });
    });

    it("Get user brief info by user name without logged in should success", async () => {
        const result: any = await request.get(serverUrl + "/user/getByUserName/" + "Menci");

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            userName: "Menci",
            email: "menci@syz.oj"
        });
    });

    it("Update user's info without privilege should return AuthError", async () => {
        const result: any = await request.post(serverUrl + "/user/update/" + users[0], {
            body: {
                userName: "Menci1"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Register a admin user", async () => {
        const result: any = await requestAdmin.post(serverUrl + "/auth/register", {
            body: {
                userName: "admin",
                email: "ad@m.in",
                password: "233"
            }
        });

        expect(result).to.deep.include({
            success: true
        });

        users.push(result.result.uuid);

        const result2: any = await requestAdmin.post(serverUrl + "/test/setAdmin", {
            body: {
                uuid: users[1],
                isAdmin: true
            }
        });

        expect(result2).to.deep.include({
            success: true
        });
    });

    it("Update user's info with privilege should success", async () => {
        const result: any = await requestAdmin.post(serverUrl + "/user/update/" + users[0], {
            body: {
                userName: "Menci1",
                description: "Menci~ Menci~ Menci~ www",
                oldPassword: "",
                newPassword: "",
                email: "men.ci@ic.nem"
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });

    it("Find user by its old user name should return NotFoundError", async () => {
        const result: any = await request.get(serverUrl + "/user/getByUserName/" + "Menci");

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "NotFoundError",
            objectType: "User",
            match: {
                userName: "Menci"
            }
        });
    });

    it("Find user by its new user name should success", async () => {
        const result: any = await request.get(serverUrl + "/user/getByUserName/" + "Menci1");

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            userName: "Menci1",
            email: "men.ci@ic.nem"
        });
    });

    it("Update a user's privilege without privilege should return AuthError", async () => {
        const result: any = await request.post(serverUrl + "/user/updatePrivilege/" + users[0], {
            body: {
                privilege: "ManageUser",
                grant: true
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Update a user's privilege with privilege should success", async () => {
        const result: any = await requestAdmin.post(serverUrl + "/user/updatePrivilege/" + users[0], {
            body: {
                privilege: "ManageUsers",
                grant: true
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });

    it("Update user's info with ManageUsers privilege should success", async () => {
        const result: any = await request.post(serverUrl + "/user/update/" + users[1], {
            body: {
                userName: "admin_test",
                description: "it's a admin!!!!!qwq",
                oldPassword: "",
                newPassword: "",
                email: "adm.in@ni.mda"
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });

    it("User should be updated successfully", async () => {
        const result: any = await request.get(serverUrl + "/user/getByUserName/" + "admin");

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "NotFoundError",
            objectType: "User",
            match: {
                userName: "admin"
            }
        });

        const result2: any = await request.get(serverUrl + "/user/getByUserName/" + "admin_test");

        expect(result2).to.deep.include({
            success: true
        });
        expect(result2.result).to.deep.include({
            userName: "admin_test",
            email: "adm.in@ni.mda"
        });
    });
});

const groups: string[] = [];

describe("UserGroup", () => {
    it("Register a unprivileged user", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/auth/register", {
            body: {
                userName: "unprivileged",
                email: "unprivileged@us.er",
                password: "2332222222222222233333333333333333333333333333333333333"
            }
        });

        expect(result).to.deep.include({
            success: true
        });

        users.push(result.result.uuid);
    });

    it("Create UserGroup without privilege should return AuthError", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/userGroup/create", {
            body: {
                name: "testGroup"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Create UserGroup with privilege should success", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/create", {
            body: {
                name: "testGroup"
            }
        });

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            name: "testGroup"
        });

        groups.push(result.result.uuid);
    });

    it("Create UserGroup with duplicated name should return DuplicateError", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/create", {
            body: {
                name: "testGroup"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "DuplicateError",
            objectType: "UserGroup",
            match: {
                name: "testGroup"
            }
        });
    });

    it("Delete UserGroup without privilege should return AuthError", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/userGroup/delete", {
            body: {
                name: "testGroup"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Create another UserGroup", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/create", {
            body: {
                name: "toDelete"
            }
        });

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            name: "toDelete"
        });

        groups.push(result.result.uuid);
    });

    it("Delete UserGroup with privilege should success", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/delete", {
            body: {
                uuid: groups.pop()
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });

    it("Add user to UserGroup with privilege should success", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/addUser", {
            body: {
                userUUID: users[0],
                groupUUID: groups[0]
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });

    it("Add user to UserGroup without privilege should return AuthError", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/userGroup/addUser", {
            body: {
                userUUID: users[1],
                groupUUID: groups[0]
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Add user which is already added to UserGroup should return InvalidInputError", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/addUser", {
            body: {
                userUUID: users[0],
                groupUUID: groups[0]
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "InvalidInputError",
            fields: [
                {
                    fieldName: "groupUUID",
                    value: groups[0]
                },
                {
                    fieldName: "userUUID",
                    value: users[0]
                }
            ]
        });
    });

    it("Del user which is not added to UserGroup should return InvalidInputError", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/delUser", {
            body: {
                userUUID: users[1],
                groupUUID: groups[0]
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "InvalidInputError",
            fields: [
                {
                    fieldName: "groupUUID",
                    value: groups[0]
                },
                {
                    fieldName: "userUUID",
                    value: users[1]
                }
            ]
        });
    });

    it("Del user to UserGroup without privilege should return AuthError", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/userGroup/delUser", {
            body: {
                userUUID: users[0],
                groupUUID: groups[0]
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Del user to UserGroup with privilege should success", async () => {
        const result: any = await request.post(serverUrl + "/userGroup/delUser", {
            body: {
                userUUID: users[0],
                groupUUID: groups[0]
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });
});

const problemSets: string[] = [];

describe("ProblemSet", () => {
    it("Create ProblemSet without privilege should return AuthError", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/problemSet/create", {
            body: {
                name: "测试题库",
                urlName: "test"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Grant ManageProblems privilege for a user", async () => {
        const result: any = await requestAdmin.post(serverUrl + "/user/updatePrivilege/" + users[0], {
            body: {
                privilege: "ManageProblems",
                grant: true
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });

    it("Create ProblemSet with privilege should success", async () => {
        const result: any = await request.post(serverUrl + "/problemSet/create", {
            body: {
                name: "测试题库",
                urlName: "test"
            }
        });

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            name: "测试题库",
            urlName: "test"
        });

        problemSets.push(result.result.uuid);
    });

    it("Create ProblemSet with duplicated name should success", async () => {
        const result: any = await request.post(serverUrl + "/problemSet/create", {
            body: {
                name: "测试题库",
                urlName: "test1"
            }
        });

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            name: "测试题库",
            urlName: "test1"
        });

        problemSets.push(result.result.uuid);
    });

    it("Create ProblemSet with duplicated url name should return DuplicateError", async () => {
        const result: any = await request.post(serverUrl + "/problemSet/create", {
            body: {
                name: "测试题库1",
                urlName: "test"
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "DuplicateError",
            objectType: "ProblemSet",
            match: {
                urlName: "test"
            }
        });
    });

    it("Delete ProblemSet without privilege should return AuthError", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/problemSet/delete", {
            body: {
                uuid: problemSets[0]
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Delete ProblemSet with privilege should success", async () => {
        const result: any = await request.post(serverUrl + "/problemSet/delete", {
            body: {
                uuid: problemSets.pop()
            }
        });

        expect(result).to.deep.include({
            success: true
        });
    });

    it("Update ProblemSet's PermissionControl without privilege should return AuthError", async () => {
        const result: any = await requestUnprivileged.post(serverUrl + "/problemSet/updatePermissionControl", {
            body: {
                uuid: problemSets[0],
                newPermissionControl: {
                    list: {
                        guestAllow: true,
                        defaultAllow: true,
                        userUUIDs: [users[0], users[1]],
                        groupUUIDs: [groups[0]]
                    },
                    modify: {
                        guestAllow: false,
                        defaultAllow: false,
                        userUUIDs: [users[0]],
                        groupUUIDs: []
                    }
                }
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "AuthError",
            type: "PermissionDenied"
        });
    });

    it("Update ProblemSet's PermissionControl with privilege should success", async () => {
        const newPermissionControl: any = {
            list: {
                guestAllow: true,
                defaultAllow: true,
                userUUIDs: [users[0], users[1]],
                groupUUIDs: [groups[0]]
            },
            modify: {
                guestAllow: false,
                defaultAllow: false,
                userUUIDs: [users[0]],
                groupUUIDs: []
            }
        };

        const result: any = await request.post(serverUrl + "/problemSet/updatePermissionControl", {
            body: {
                uuid: problemSets[0],
                newPermissionControl
            }
        });

        expect(result).to.deep.include({
            success: true
        });

        const result2: any = await request.get(serverUrl + "/problemSet/getByUUID/" + problemSets[0]);

        expect(result2).to.deep.include({
            success: true
        });

        expect(result2.result).to.deep.include({
            name: "测试题库",
            urlName: "test",
            permissionControl: newPermissionControl
        });
    });

    it("Update ProblemSet's PermissionControl without list.guestAllow = true should return InvalidInputError", async () => {
        const newPermissionControl: any = {
            modify: {
                guestAllow: true,
            }
        };

        const result: any = await request.post(serverUrl + "/problemSet/updatePermissionControl", {
            body: {
                uuid: problemSets[0],
                newPermissionControl
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "InvalidInputError",
            fieldName: "newPermissionControl.modify.guestAllow",
            value: true
        });
    });

    it("Registered user should have a private ProblemSet created automatically", async () => {
        const result: any = await request.get(serverUrl + "/problemSet/getByOwnUser/" + users[0]);

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result).to.deep.include({
            ownUser: users[0]
        });

        problemSets.push(result.result.uuid);
    });

    it("Update a private ProblemSet's PermissionControl should return InvalidInputError", async () => {
        const result: any = await request.post(serverUrl + "/problemSet/updatePermissionControl", {
            body: {
                uuid: problemSets[1],
                newPermissionControl: {}
            }
        });

        expect(result).to.deep.include({
            success: false
        });
        expect(result.error).to.deep.include({
            error: "InvalidInputError",
            fieldName: "uuid",
            value: problemSets[1]
        });
    });

    it("ProblemSet's brief info got by a unprivileged user shouldn't contain PermissionControl", async () => {
        const result: any = await requestUnprivileged.get(serverUrl + "/problemSet/getByUUID/" + problemSets[0]);

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result.permissionControl).to.be.undefined; // tslint:disable-line
    });

    it("Private ProblemSet's brief info shouldn't contain PermissionControl", async () => {
        const result: any = await request.get(serverUrl + "/problemSet/getByUUID/" + problemSets[1]);

        expect(result).to.deep.include({
            success: true
        });
        expect(result.result.permissionControl).to.be.undefined; // tslint:disable-line
    });
});
