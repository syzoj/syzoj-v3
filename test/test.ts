import { expect } from "chai";
import "mocha";

import * as Request from "request-promise-native";

const request = Request.defaults({
    json: true,
    jar: true
});

const serverUrl: string = "http://localhost:9133";

describe("Drop database", () => {
    it("Drop database with test mode API", async () => {
        const result: any = await request.post(serverUrl + "/test/dropDatabase");

        expect(result).to.deep.equals({
            success: true
        });
    });
});

const users: string[] = [];

describe("User register & login", () => {
    it("A invalid userName should return InvalidInputError", async () => {
        const invalidUserName: string = "%%%Menci";
        const result: any = await request.post(serverUrl + "/auth/register", {
            form: {
                userName: invalidUserName,
                password: "123456",
                email: "mod@syz.oj"
            }
        });

        expect(result).to.deep.include({
            success: false,
            error: {
                error: "InvalidInputError",
                fieldName: "userName",
                value: invalidUserName
            }
        });
    });

    it("A invalid email should return InvalidInputError", async () => {
        const invalidEmail: string = "%%% @syz.oj";
        const result: any = await request.post(serverUrl + "/auth/register", {
            form: {
                userName: "syzoojx",
                password: "123456",
                email: invalidEmail
            }
        });

        expect(result).to.deep.include({
            success: false,
            error: {
                error: "InvalidInputError",
                fieldName: "email",
                value: invalidEmail
            }
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

        expect(result.success).to.equal(true);
        expect(result.result).to.deep.include({
            email,
            avatar: email,
            userName
        });
    });

    it("Logout should success", async () => {
        const result: any = await request.post(serverUrl + "/auth/logout");

        expect(result).to.deep.equal({
            success: true
        });
    });

    it("Login with non-existing userName should return NotFoundError", async () => {
        const userName: string = "Menci1";
        const result: any = await request.post(serverUrl + "/auth/login", {
            form: {
                userName: "Menci1",
                password: "123456"
            }
        });

        expect(result).to.deep.equal({
            success: false,
            error: {
                error: "NotFoundError",
                objectType: "User",
                match: {
                    userName
                }
            },
            errorString: `NotFoundError { objectType: 'User', match: { userName: '${userName}' } }`
        });
    });

    it("Login with wrong password should return AuthError", async () => {
        const userName: string = "Menci";
        const result: any = await request.post(serverUrl + "/auth/login", {
            form: {
                userName: "Menci",
                password: "0528"
            }
        });

        expect(result).to.deep.equal({
            success: false,
            error: {
                error: "AuthError",
                type: "WrongPassword"
            },
            errorString: "AuthError { type: 'WrongPassword' }"
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

        expect(result.success).to.equal(true);
        expect(result.result).to.deep.include({
            userName,
            uuid: users[0]
        });
    });

    it("Logout should success", async () => {
        const result: any = await request.post(serverUrl + "/auth/logout");

        expect(result).to.deep.equal({
            success: true
        });
    });

    it("Duplicate userName should return DuplicateError", async () => {
        const email: string = "menci1@syz.oj";
        const userName: string = "Menci";
        const result: any = await request.post(serverUrl + "/auth/register", {
            form: {
                userName,
                password: "123456",
                email
            }
        });

        expect(result).to.deep.include({
            success: false,
            error: {
                error: "DuplicateError",
                objectType: "User",
                match: {
                    userName
                }
            }
        });
    });

    it("Duplicate email should return DuplicateError", async () => {
        const email: string = "menci@syz.oj";
        const userName: string = "Menci1";
        const result: any = await request.post(serverUrl + "/auth/register", {
            form: {
                userName,
                password: "123456",
                email
            }
        });

        expect(result).to.deep.include({
            success: false,
            error: {
                error: "DuplicateError",
                objectType: "User",
                match: {
                    email
                }
            }
        });
    });
});
