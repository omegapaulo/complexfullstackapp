const dotenv = require('dotenv').config();
const mongodb = require('mongodb');

const PORT = process.env.PORT;

// NOTE: Getting the database connection string from the dotenv file
mongodb.connect(process.env.CONNECTIONSTRING, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
  // NOTE: exporting the database data to be accessible in the other modules
  module.exports = client;
  // NOTE: Launching the app from here
  const app = require('./app.js');
  app.listen(PORT);
});
