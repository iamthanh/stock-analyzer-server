// const express = require("express");
const cors = require("cors");

const symbolRoutes = require("./api/Symbol.routes");
const dataToolsRoutes = require("./api/DataTools.routes");
const dynamicConditionsRoutes = require("./api/DynamicConditions.routes");

export const getRoutes = (app, corsOptions) => {
  app.use("/api/data/symbol/", cors(corsOptions), symbolRoutes);
  app.use("/api/data-tools/", cors(corsOptions), dataToolsRoutes);
  app.use("/api/dynamic-conditions/", cors(corsOptions), dynamicConditionsRoutes);

  return app;
};
