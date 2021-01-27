// Importing and initializing Express
const express = require('express');
const app = express();
// Importing mongoose ORM for Mongodb
const mongoose = require('mongoose');
// importing defined routes
const routes = require('./routes/route');
// importing dotenv
const dotenv = require('dotenv');
// importing md5
const md5 =  require('md5');

// initializing dotenv file
dotenv.config();

// connecting to Database
mongoose.connect(
  process.env.CONNECTION_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log(`connected`)
);

// getting port from enviroment
const port = process.env.port || 5000;

// middleware
app.use(express.json());

// routing
app.use('/user', routes);

// server set upp
app.listen(port, () => console.log(`listening`));


// let a = Math.floor(Math.random()*(10**16));
