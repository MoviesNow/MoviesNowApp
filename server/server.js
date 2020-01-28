'use strict';



// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

// require ejs
require('ejs');

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.static('./public'));

// set up view engine for the routes
app.set('view engine', 'ejs');


// data base connection
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error('error'));



// routes
app.get('/', mainPageLoad);



// function for the routes to be view in localhost
function mainPageLoad (request, response) {
  let today = todayDate();
  let query = `http://data.tmsapi.com/v1.1/movies/showings?startDate=${today}&zip=98166&api_key=${process.env.TMS_API_KEY}`;
  response.status(200).render('index');
}

function todayDate() {
  let date = new Date();
  let dateValues = [
    date.getFullYear(),
    date.getMonth()+1,
    date.getDate(),
  ];
  let today = dateValues.join('-');
  return today;
}

// error function
function errorHandler(err, request, response) {
  response.status(500).send('Sorry, something went wrong');
}

function developerErrorHandler(request, response) {
  response.status(404).send('sorry this request is not available yet');
}




app.use('*', developerErrorHandler);

app.get((error, req, res) => errorHandler(error, res));

// server listen for PORT
app.listen(PORT, () => console.log(`Never Give up ${PORT}`));
'use strict';



