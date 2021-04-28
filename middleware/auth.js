"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

// Middleware that checks the payload to see if the user is logged in as admin. If not, then throw error.
function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();  // Runs if no user object
    if (!res.locals.user.isAdmin) throw new UnauthorizedError();  // Runs if isAdmin valie is false
    return next();
  }
  catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must be logged in to the user whom they are trying to view, edit, or delete.
 *
 * If not logged in, raised Unauthorized
 * If not correct user, check if admin
 * If not, raises Unauthorized.
 * 
 * We use this instead of ensureCorrectUser AND ensureAdmin because if an error is thrown, execution stops
 * 
 * An ensureCorrectUser func could be implemented seperately if needed as a feature, but admins have all permissions 
 * in this app
 */

//  Middleware that checks if the user logged in is the correct user or is an admin. If not, then throw an error.
function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();  // Runs if no user object
    if (res.locals.user.username !== req.params.username) {  // Checks to see if the user is the auhorized user
      ensureAdmin(req, res, next);  // If not correct user, checks to see if isAdmin is true. If not then return error.
    }
    else {
      return next();
    }
  }
  catch (err) {
    return next(err);
  }
}

// --------------------------

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin
};
