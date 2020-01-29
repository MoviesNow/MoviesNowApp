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
app.get('/', mainPage);

// function for the routes to be view in localhost
// calls getMovies function then renders index.ejs
function mainPage (request, response) {
  getMovies(request,response)
    .then(movies => response.status(200).render('index.ejs', {posters: movies,}));
}

// queries TMDB for currently in theater movies, calls constructor array to create movie objects and addMovie function to store them
function getMovies (request, response) {
  try {
    let query = `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1&region=US`;
    return superagent.get(query)
      .then(results => {
        let movieArray = results.body.results;
        const movies = movieArray.map(movie => addMovie(new Movie(movie)));
        return movies;
      });
  }
  catch(error) {
    errorHandler(error, request, response);
  }
}

// likely no longer needed
function grabImg(movie) {
  let query = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${movie.title}&page=1&include_adult=false`;
  return superagent.get(query)
    .then(results => {
      updateImg(results);
    });
}

// likely no longer needed
function updateImg(results) {
  let sql = 'UPDATE movies SET img_url = $1 WHERE LOWER(title) = LOWER($2);';
  let moviePoster = '';
  results.body.results[0].poster_path === undefined ? moviePoster = `https://via.placeholder.com/300x450.JPEG?text=${(results.body.results[0].title).split(' ').join('+')}`
    : moviePoster = `https://image.tmdb.org/t/p/w300_and_h450_bestv2${results.body.results[0].poster_path}`;
  let safeWords = [moviePoster, results.body.results[0].title];
  client.query(sql,safeWords);
}

// will likely need. Get's today's date and returns it formatted as YYYY-(M)M-DD
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

// Inserts values from each movie obj into movies table
function addMovie(movie){
  let sql = 'INSERT INTO movies (title, movie_description, img_url) VALUES ($1, $2, $3);';
  let safeWords = [movie.title, movie.movieDescription, movie.imgURL];
  client.query(sql,safeWords);
  return movie;
}

// Constructor to create movie object
function Movie(data) {
  this.title = data.title;
  this.movieDescription = data.overview;
  this.imgURL = `https://image.tmdb.org/t/p/w300_and_h450_bestv2${data.poster_path}`;
  // data.ratings !== undefined ? this.ratings_code = data.ratings[0].code : this.ratings_code = 'Unrated';
  // this.runtime = data.runTime;
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



