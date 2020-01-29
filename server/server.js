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
app.get('/', movie);
app.get('/about', aboutUs);
app.get('/register', formToFill);




// function for the routes to be view in localhost

function movie(request, response) {
  response.status(200).render('index');
}

function aboutUs(request, response) {
  response.status(200).render('about');
}

function formToFill(request, response) {

  response.status(200).render('register');
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



