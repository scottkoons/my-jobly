const { BadRequestError, ExpressError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

const OPERATOR_MAP = {
  'minEmployees': '>',
  'minSalary': '>',
  'hasEquity': '>',
  'maxEmployees': '<',
  'name': ' ILIKE ',
  'title': ' ILIKE '
};

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  /**
   * Takes in an object, converts the keys of the object to their
   * corresponding SQL column names, and returns the SET portion of an UPDATE SQL
   * query involving those keys.
   * 
   * For example, if dataToUpdate = {firstName: 'Bilbo', age: 25, isAdmin: false}, 
   *         and     jsToSql      = {firstName: 'first_name', isAdmin: 'is_admin'} (age does not vary),
   * setCols would become: '"first_name"=$1, "age"=$2, "is_admin"=$3' &
   * values would become: ['Bilbo', 25, false]
   * 
   * This allows us to create dynamic UPDATE queries.
   */

  // If no data is passed
  if (!dataToUpdate) throw new BadRequestError("No data");

  const keys = Object.keys(dataToUpdate);
  // If data is empty
  if (keys.length === 0) throw new BadRequestError("No data");

  // jsToSql is passed by backend, so we throw an Internal Server error if its empty
  if (!jsToSql) throw new ExpressError("Internal Server Error", 500);

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`,);

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


function sqlFilterSelect(dataToUpdate, jsToSql) {
  /**
   * Takes in an object, converts the keys of the object to their
   * corresponding SQL column names, and returns the WHERE portion of a SELECT SQL
   * query involving those keys.
   * 
   * For example, if dataToUpdate = {name: 'Bilbo', minEmployees: 25, maxEmployees: 40}, 
   *         and     jsToSql      = {name: 'name', minEmployees: 'num_employees', maxEmployees: 'num_employees'},
   * setCols would become: '"name" ILIKE $1, "num_employees">$2, "num_employees"<$3' &
   * values would become: ['Bilbo', 25, 40]
   * 
   * This allows us to create dynamic SELECT queries.
   */
  if (!dataToUpdate) throw new BadRequestError("No data");

  const keys = Object.keys(dataToUpdate);

  if (keys.length === 0) throw new BadRequestError("No data");

  // jsToSql is passed by backend, so we throw an Internal Server error if its empty
  if (!jsToSql) throw new ExpressError("Internal Server Error", 500);

  // In the case of company filtering, we need minEmployees & maxEmployees to become num_employees, so we throw an error if jsToSql isnt passed
  if (Object.keys(jsToSql).length === 0) throw new ExpressError("Internal Server Error", 500);
  if (keys.length !== Object.keys(jsToSql).length) throw new ExpressError("Internal Server Error", 500);

  // {firstName: 'Bob', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => {
    let operator = OPERATOR_MAP[colName] || '=';
    return `"${jsToSql[colName] || colName}"${operator}$${idx + 1}`;
  });

  return {
    setCols: cols.join(" AND "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate, sqlFilterSelect };
