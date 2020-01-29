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
  return superagent.get(query)
    .then(results => {
      // console.log(results.body);
      let movieArray = results.body;
      const movies = movieArray.map(movieArray => {
        let newMovie = new Movie(movieArray);
        addMovie(newMovie);
        grabImg(newMovie);
        // console.log('newMovie: ', newMovie);

      });
      // console.log('all movies: ', movies);
      response.status(200).render('index');
      return results;
    })
    .catch(error => errorHandler(error, request,response));
}
function grabImg(movie) {
  let query = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${movie.title}&page=1&include_adult=false`;
  // console.log('TMDB query: ', query);
  return superagent.get(query)
    .then(results => {
      updateImg(results);

      // console.log(`https://image.tmdb.org/t/p/w300_and_h450_bestv2${results.body.results[0].poster_path}`);
    });
}

function updateImg(results) {
  let sql = 'UPDATE movies SET img_url = $1 WHERE LOWER(title) = LOWER($2);';
  let moviePoster = '';
  results.body.results[0].poster_path === undefined ? moviePoster = `https://via.placeholder.com/300x450.JPEG?text=${(results.body.results[0].title).split(' ').join('+')}`
  : moviePoster = `https://image.tmdb.org/t/p/w300_and_h450_bestv2${results.body.results[0].poster_path}`;
  let safeWords = [moviePoster, results.body.results[0].title]
  client.query(sql,safeWords);
}

function todayDate() {
  let date = new Date();
  let dateValues = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  ];
  let today = dateValues.join('-');
  return today;
}
function addMovie(movie){
  // console.log('in addMovie');
  let sql = 'INSERT INTO movies (title, movie_description, ratings_code, runtime) VALUES ($1, $2, $3, $4);';
  let safeWords = [movie.title, movie.movie_description, movie.ratings_code, movie.runtime];
  client.query(sql,safeWords);
}
function Movie(data) {
  // console.log('in the constructor');
  this.title = data.title;
  data.shortDescription === undefined ? this.movie_description = "No description available."
  : this.movie_description = data.shortDescription;
  data.ratings !== undefined ? this.ratings_code = data.ratings[0].code : this.ratings_code = 'Unrated';
  this.runtime = data.runTime;
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



