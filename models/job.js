"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlFilterSelect } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { title, salary, equity, companyHandle }
     * 
     * throws BadRequestError if companyHandle does not exist in database
     *
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const noCompanyCheck = await db.query(
            `SELECT handle
      FROM companies
      WHERE handle=$1`,
            [companyHandle]
        );

        if (noCompanyCheck.rows.length === 0) {
            throw new BadRequestError(`Company with handle ${companyHandle} does not exist!`);
        }

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     * 
     * Filters results based on data
     * 
     * data can include {title, minSalary, hasEquity}
     *
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     * */

    static async findAll(data) {
        // Fill jsToSql only with the data that we need
        const jsToSql = {};
        let whereClause = ''; // if we arent filtering where clause should be empty
        let clauseValues = []; // if we arent filtering then there won't be anything in values
        if (data) {
            for (let key of Object.keys(data)) {
                if (key === 'minSalary') {
                    jsToSql[key] = 'salary';
                }
                else if (key === 'hasEquity') {
                    // in sqlFilterSelect we want equity > 0 not equity > true
                    data[key] = 0;
                    jsToSql[key] = 'equity';
                }
                else {
                    jsToSql[key] = key;
                }
            }
            // Create the WHERE clause based on the result from sqlFilterSelect
            if (Object.keys(data).length !== 0) {
                const { setCols, values } = sqlFilterSelect(data, jsToSql);
                clauseValues = values;
                whereClause = `WHERE ${setCols}`;
            }
        }

        const jobsRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      ${whereClause}
      ORDER BY title`, clauseValues);


        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if id is not a number
     * 
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        // Quickly throw an error if id is invalid
        if (isNaN(parseInt(id))) {
            throw new NotFoundError(`Job id must be a number!`);
        }
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id=$1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Given a company handle, return data about jobs in that company.
     *
     * Returns [{ id, title, salary, equity }, ...]
     *
     * Returns empty array if none found
     **/

    static async getByCompanyHandle(handle) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity
      FROM jobs
      WHERE company_handle=$1`,
            [handle]);

        const jobs = jobRes.rows;

        return jobs;
    }

    /** Update company data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, description, numEmployees, logoUrl}
     *
     * Returns {handle, name, description, numEmployees, logoUrl}
     * 
     * Throws NotFoundError if id is not a number
     * 
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        // Quickly throw an error if id is invalid
        if (isNaN(parseInt(id))) {
            throw new NotFoundError(`Job id must be a number!`);
        }
        const { setCols, values } = sqlForPartialUpdate(data, {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if id is not a number
     * 
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        // Quickly throw an error if id is invalid
        if (isNaN(parseInt(id))) {
            throw new NotFoundError(`Job id must be a number!`);
        }
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}


module.exports = Job;
