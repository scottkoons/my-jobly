const { sqlForPartialUpdate, sqlFilterSelect } = require('./sql');
const { BadRequestError, ExpressError } = require('../expressError');

// First suite, testing missing or partial database updates
describe('sqlForPartialUpdate', () => {
    test('works: valid data w/ complete jsToSql', () => {
        const data = { firstName: 'Bobo', lastName: 'Monkey', age: 52, numEmployees: 3, logoUrl: 'google.com' };
        const jsToSql = { firstName: 'first_name', age: 'age', lastName: 'last_name', numEmployees: 'num_employees', logoUrl: 'logo_url' };

        const { setCols, values } = sqlForPartialUpdate(data, jsToSql);

        expect(values).toEqual(['Bobo', 'Monkey', 52, 3, 'google.com']);
        expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2, "age"=$3, "num_employees"=$4, "logo_url"=$5`);
    });

    test('works: valid data w/ incomplete jsToSql', () => {
        const data = { first_name: 'Bobo', lastName: 'Monkey', age: 52, numEmployees: 3, logoUrl: 'google.com' };
        const jsToSql = { lastName: 'last_name', numEmployees: 'num_employees', logoUrl: 'logo_url' };

        const { setCols, values } = sqlForPartialUpdate(data, jsToSql);

        expect(values).toEqual(['Bobo', 'Monkey', 52, 3, 'google.com']);
        expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2, "age"=$3, "num_employees"=$4, "logo_url"=$5`);
    });

    test('works: valid data w/ empty jsToSql', () => {
        const data = { firstName: 'Bobo', lastName: 'Monkey', age: 52, numEmployees: 3, logoUrl: 'google.com' };

        const { setCols, values } = sqlForPartialUpdate(data, {});

        expect(values).toEqual(['Bobo', 'Monkey', 52, 3, 'google.com']);
        expect(setCols).toEqual(`"firstName"=$1, "lastName"=$2, "age"=$3, "numEmployees"=$4, "logoUrl"=$5`);
    });

    test('fails: valid data w/ missing jsToSql', () => {
        const data = { firstName: 'Bobo', lastName: 'Monkey', age: 52, numEmployees: 3, logoUrl: 'google.com' };

        expect(() => {
            sqlForPartialUpdate(data);
        }).toThrowError(new ExpressError("Internal Server Error", 500));
    });

    test('fails: empty data, empty jsToSql', () => {
        const data = {};
        const jsToSql = {};
        expect(() => {
            sqlForPartialUpdate(data, jsToSql);
        }).toThrowError(new BadRequestError('No data'));
    });

    test('fails: missing params', () => {
        expect(() => {
            sqlForPartialUpdate();
        }).toThrowError(new BadRequestError('No data'));
    });

});

// Second suite, testing database updates
describe('sqlFilterSelect', () => {
    test('works: valid complete data w/ complete jsToSql', () => {
        const data = { name: 'Bobo', minEmployees: 3, maxEmployees: 10 };
        const jsToSql = { name: 'name', minEmployees: 'num_employees', maxEmployees: 'num_employees' };

        const { setCols, values } = sqlFilterSelect(data, jsToSql);

        expect(values).toEqual(['Bobo', 3, 10]);
        expect(setCols).toEqual(`"name" ILIKE $1 AND "num_employees">$2 AND "num_employees"<$3`);
    });

    test('works: valid just-name data w/ just-name jsToSql', () => {
        const data = { name: 'Bobo' };
        const jsToSql = { name: 'name' };

        const { setCols, values } = sqlFilterSelect(data, jsToSql);

        expect(values).toEqual(['Bobo']);
        expect(setCols).toEqual(`"name" ILIKE $1`);
    });

    test('works: valid just-minEmps data w/ just-minEmp jsToSql', () => {
        const data = { minEmployees: 3 };
        const jsToSql = { minEmployees: 'num_employees' };

        const { setCols, values } = sqlFilterSelect(data, jsToSql);

        expect(values).toEqual([3]);
        expect(setCols).toEqual(`"num_employees">$1`);
    });

    test('works: valid just-maxEmps data w/ just-maxEmps jsToSql', () => {
        const data = { maxEmployees: 10 };
        const jsToSql = { maxEmployees: 'num_employees' };

        const { setCols, values } = sqlFilterSelect(data, jsToSql);

        expect(values).toEqual([10]);
        expect(setCols).toEqual(`"num_employees"<$1`);
    });

    test('fails: valid data w/ incomplete jsToSql', () => {
        const data = { name: 'Bobo', minEmployees: 3, maxEmployees: 10 };
        const jsToSql = { name: 'name' };

        expect(() => {
            sqlFilterSelect(data, jsToSql);
        }).toThrowError(new ExpressError("Internal Server Error", 500));
    });

    test('fails: valid data w/ empty jsToSql', () => {
        const data = { name: 'Bobo', minEmployees: 3, maxEmployees: 10 };

        expect(() => {
            sqlFilterSelect(data, {});
        }).toThrowError(new ExpressError("Internal Server Error", 500));
    });

    test('fails: valid data w/ missing jsToSql', () => {
        const data = { name: 'Bobo', minEmployees: 3, maxEmployees: 10 };

        expect(() => {
            sqlFilterSelect(data);
        }).toThrowError(new ExpressError("Internal Server Error", 500));
    });

    test('fails: empty data, empty jsToSql', () => {
        const data = {};
        const jsToSql = {};
        expect(() => {
            sqlFilterSelect(data, jsToSql);
        }).toThrowError(new BadRequestError('No data'));
    });

    test('fails: missing params', () => {
        expect(() => {
            sqlFilterSelect();
        }).toThrowError(new BadRequestError('No data'));
    });

});