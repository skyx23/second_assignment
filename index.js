// Importing and initializing Express
const express = require('express');
const app = express();
// Importing mongoose OGETRM for Mongodb
const mongoose = require('mongoose');
// importing defined routesGETGET
const routes = require('./routes/route');
// importing dotenv
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');


require('./middleware/passport')(passport);
// initializing dotenv file
dotenv.config();

// connecting to Database
mongoose.connect(
  process.env.CONNECTION_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log(`connected`)
);

// getting port from enviroment
const port = process.env.port || 5001;

// middleware
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie :{maxAge :   (60*60*1000)}
}))
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session()); 


// routing
app.use('/user', routes);

// server set upp
app.listen(port, () => console.log(`listening`));

