// Importing and initializing Express
const express = require('express');
const app = express();
// Importing mongoose ORM for Mongodb
const mongoose = require('mongoose');
// importing defined routes 
const routes = require('./routes/route');


//connection URI 
const url = 'mongodb+srv://admin:7blQQYL6MrnIenru@project1.mz5o4.mongodb.net/user?retryWrites=true&w=majority';

// connecting to Database
mongoose.connect(url, {useNewUrlParser: true ,useUnifiedTopology : true},() => console.log(`connected`));

// getting port from enviroment
const port = process.env.port || 5000 ; 

// middleware
app.use(express.json());


// routing
app.use('/user',routes);


// server set upp
app.listen(port,() => console.log(`listening`));



