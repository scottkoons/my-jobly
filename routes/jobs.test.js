"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    adminToken,
    userToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 150000,
        equity: 0.05,
        companyHandle: "c1"
    };

    test("ok for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        newJob.id = resp.body.job.id;
        expect(resp.body).toEqual({
            job: newJob,
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 10
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: "not-numeric-type",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("unauth for non admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${userToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: "j1",
                        salary: 10000,
                        equity: 0.01,
                        companyHandle: "c1"
                    },

                    {
                        id: expect.any(Number),
                        title: "j2",
                        salary: 20000,
                        equity: 0.02,
                        companyHandle: "c2"
                    },

                    {
                        id: expect.any(Number),
                        title: "j3",
                        salary: 30000,
                        equity: 0.03,
                        companyHandle: "c3"
                    }
                ]
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "j1",
                salary: 10000,
                equity: 0.01,
                company: expect.any(Object)
            }
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/99`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "j1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "j1-new",
                salary: 10000,
                equity: 0.01,
                companyHandle: "c1"
            }
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "j1-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "j1-new",
            })
            .set("authorization", `Bearer ${userToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/99`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                id: 4,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on company handle change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                companyHandle: "c2",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: "not-an-int",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: "1" });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${userToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/nope`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
