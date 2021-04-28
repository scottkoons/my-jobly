"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "Senior Software Engineer",
        salary: 150000,
        equity: 0.05,
        companyHandle: 'c1'
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        newJob.id = job.id;
        job.equity = parseFloat(job.equity);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id=$1`, [job.id]);
        expect(result.rows).toEqual([
            {
                id: job.id,
                title: "Senior Software Engineer",
                salary: 150000,
                equity: "0.05",
                companyHandle: 'c1'
            },
        ]);
    });

    test("bad request with invalid company", async function () {
        try {
            newJob.companyHandle = 'failingHandle';
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j1",
                salary: 10000,
                equity: "0.01",
                companyHandle: "c1"
            },

            {
                id: expect.any(Number),
                title: "j2",
                salary: 20000,
                equity: "0.02",
                companyHandle: "c2"
            },

            {
                id: expect.any(Number),
                title: "j3",
                salary: 30000,
                equity: "0.03",
                companyHandle: "c3"
            }
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get("1");
        expect(job).toEqual({
            id: 1,
            title: "j1",
            salary: 10000,
            equity: "0.01",
            companyHandle: "c1"
        });
    });

    test("not found if no such company", async function () {
        try {
            await Job.get("nope");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "New",
        salary: 150000,
        equity: 0.5
    };

    test("works", async function () {
        let job = await Job.update("1", updateData);
        expect(job).toEqual({
            ...updateData,
            id: 1,
            companyHandle: "c1",
            equity: "0.5",
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id = 1`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "New",
            salary: 150000,
            equity: "0.5",
            company_handle: "c1"
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New",
            salary: null,
            equity: null,
        };

        let company = await Job.update("1", updateDataSetNulls);
        expect(company).toEqual({
            id: 1,
            companyHandle: "c1",
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id = 1`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "New",
            salary: null,
            equity: null,
            companyHandle: "c1"
        }]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update("nope", updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update("1", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove("1");
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=1");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove("nope");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
