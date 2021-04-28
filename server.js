"use strict";

const app = require("./app");
const { PORT } = require("./config");

app.listen(PORT, function () {
  console.log(`Jobly app started on http://localhost:${PORT}`);
});
