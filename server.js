const express = require("express");
const symbolRoutes = require("./routes/api/Symbol.routes");
const dataToolsRoutes = require("./routes/api/DataTools.routes");
const { getRoutes } = require("./routes");

let app = express();
const port = process.env.PORT || 3001;

var whitelist = ["http://localhost:5173", "*"];
var corsOptions = {
  origin: function (origin, callback) {
    // if (whitelist.indexOf(origin) !== -1) {
    callback(null, true);
    // } else {
    //   callback(new Error("Not allowed by CORS"));
    // }
  },
};

// Add headers before the routes are defined
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// Setting up the routes
app = getRoutes(app, corsOptions);

// Handle other endpoints or invalid requests
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
