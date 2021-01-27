// importing mongoose ORM for Mongo
const mongoose = require('mongoose');

// designing Schema for Mongo
const clients = mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      min: 10,
      max: 255,
    },
    password: {
      type: String,
      required: true,
      max: 1024,
    },
  },
  { versionKey: false }
);

// exporting Schemas
module.exports = mongoose.model('Client', clients);
