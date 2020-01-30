'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

// require ejs
require('ejs');

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.static('./public'));

// Application Middleware
app.use(express.urlencoded());
app.use(methodOverride('_method'));

// set up view engine for the routes
app.set('view engine', 'ejs');


// data base connection
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error('error'));

// routes
app.get('/', mainPage);
app.get('/result', resultPage);
app.get('/sign-in', signIn);
app.get('/register', registerPage);
app.get('/about', about);
app.post('/find', findTheater);

// function for the routes to be view in localhost
// calls getMovies function then renders index.ejs
function mainPage(request, response) {
  deleteData()
    .then(checkMovies)
    .then(movies => {
      let goodMovies = movies.rows;
      if(movies.rowCount >= 1) {
        console.log('Ive seen these');
        response.status(200).render('index.ejs', { posters: goodMovies });
      }
      else {
        getMovies()
          .then( movies => {
            response.status(200).render('index.ejs', { posters: movies });
          })
          .catch( e => console.error(e) );
      }
    });
}

function findTheater(request, response) {
  let {location, timeSelection, movieTitle} = request.body;
  console.log(`location: ${location} | timeSelection: ${timeSelection} | movieTitle: ${movieTitle}`);
  let query = `http://data.tmsapi.com/v1.1/movies/showings?startDate=${todayDate()}&zip=${location}&api_key=${process.env.TMS_API_KEY}`;
  // checkSearches(location, timeSelection, movieTitle)
  //   .then(results => {
  //     let searchResults = results.rows[0];
  //     if(results.rowCount > 0) {
  //     response.status(200).render('search.ejs', { results: searchResults });
  //     } else {
  // search(query);
  let movieArray = {};
  fakeResults.forEach(movie => {
    movie.title.toLowerCase() === ('Star Wars: The Rise of Skywalker').toLowerCase() ? movieArray = movie : null;
  });

  
  let selectedTime = parseInt(timeSelection.replace(':',''));
  console.log(selectedTime);

  let showtimeIndex;
  let smallestDiff = Infinity;
  movieArray.showtimes.forEach((showtime, index) => {
    let movieTime = parseInt((showtime.dateTime).substr(showtime.dateTime.length - 5).replace(':',''));
    console.log(movieTime);
    let timeDiff = movieTime - selectedTime;
    // console.log(showtime);
    if (timeDiff < 0) {
      console.log(timeDiff);
    } else if (timeDiff < smallestDiff) {
      smallestDiff = timeDiff;
      showtimeIndex = index;
      // console.log(showtimeIndex);
    }
  });
  console.log(movieArray.showtimes[showtimeIndex]);

  // console.log(timeValue > movieDateTime);
  // }
  // });
}

function search(query) {
  try {
    return superagent.get(query)
      .then(results => {
        let resultsArray = results.body;
        console.log(resultsArray);
        // const searchResultsArray = resultsArray.map( => addMovie(new Movie(movie)));
        return resultsArray;
      });
  }
  catch (error) {
    errorHandler(error, request, response);
  }
}

function checkSearches (location, timeSelection, movieTitle) {
  let sql = 'SELECT * FROM search_results WHERE zip = $1 AND selected_time = $2 AND title = $3;';
  let safeWords = [location, timeSelection, movieTitle];
  return client.query(sql, safeWords);
}

function checkMovies () {
  let sql = 'SELECT * FROM movies;';
  return client.query(sql);
}

function deleteData() {
  // 300000 = 5mn
  let sql = `DELETE FROM movies WHERE date_time + 300000 > ${Date.now()};`;
  return client.query(sql);
}

function signIn(request, response) {
  response.status(200).render('result');
}

function resultPage(request, response) {
  response.status(200).render('result');
}

function registerPage(request, response) {
  response.status(200).render('register');
}
// queries TMDB for currently in theater movies, calls constructor array to create movie objects and addMovie function to store them
function getMovies(request, response) {
  try {
    let query = `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1&region=US`;
    return superagent.get(query)
      .then(results => {
        let movieArray = results.body.results;
        const movies = movieArray.map(movie => addMovie(new Movie(movie)));
        return movies;
      });
  }
  catch (error) {
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
  client.query(sql, safeWords);
}

function about(request, response) {
  response.status(200).render('about');
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
function addMovie(movie) {
  //console.log(movie, 'movies to add to db')
  let sql = 'INSERT INTO movies (title, movie_description, img_url, date_time) VALUES ($1, $2, $3, $4);';
  let safeWords = [movie.title, movie.movieDescription, movie.img_url, Date.now()];
  client.query(sql, safeWords);
  return movie;
}

// Constructor to create movie object
function Movie(data) {
  this.title = data.title;
  this.movieDescription = data.overview;
  this.img_url = `https://image.tmdb.org/t/p/w300_and_h450_bestv2${data.poster_path}`;
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

const fakeSWResult = {
  tmsId: 'MV010023510000',
  rootId: '14097646',
  subType: 'Feature Film',
  title: 'Star Wars: The Rise of Skywalker',
  releaseYear: 2019,
  releaseDate: '2019-12-18',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Science fiction', 'Adventure', 'Action', 'Fantasy' ],
  longDescription:
'When it\'s discovered that the evil Emperor Palpatine did not die at the hands of Darth Vader, the rebels must race against the clock to find out his whereabouts. Finn and Poe lead the Resistance to put a stop to the First Order\'s plans to form a new Empire, while Rey anticipates her inevitable confrontation with Kylo Ren.',
  shortDescription:
'Rey and her allies prepare for a showdown against Kylo Ren and the First Order.',
  topCast: [ 'Carrie Fisher', 'Mark Hamill', 'Adam Driver' ],
  directors: [ 'J.J. Abrams' ],
  officialUrl:
'https://www.starwars.com/films/star-wars-episode-ix-the-rise-of-skywalker',
  qualityRating: { ratingsBody: 'TMS', value: '2.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Situations', 'Violence' ],
  runTime: 'PT02H22M',
  preferredImage:
{ width: '240',
  height: '360',
  caption: [Object],
  uri: 'assets/p14097646_p_v5_an.jpg',
  category: 'Poster Art',
  text: 'yes',
  primary: 'true' },
  showtimes:[
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T12:20',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T15:40',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T18:50',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T22:15',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '7885',
        'name': 'Regal Parkway Plaza Stadium 12'
      },
      'dateTime': '2020-01-30T13:20',
      'quals': 'Closed Captioned|Descriptive Video Services',
      'barg': true,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AANJP&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '7885',
        'name': 'Regal Parkway Plaza Stadium 12'
      },
      'dateTime': '2020-01-30T16:40',
      'quals': 'Closed Captioned|Descriptive Video Services',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AANJP&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '7885',
        'name': 'Regal Parkway Plaza Stadium 12'
      },
      'dateTime': '2020-01-30T19:25',
      'quals': 'Closed Captioned|Descriptive Video Services',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AANJP&m=173583&d=2020-01-30'
    }
  ] };



const fakeResults = [ { tmsId: 'MV012523700000',
  rootId: '16835712',
  subType: 'Feature Film',
  title: 'Hustlers',
  releaseYear: 2019,
  releaseDate: '2019-09-07',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Comedy drama' ],
  longDescription:
 'Working as a stripper to make ends meet, Destiny\'s life changes forever when she becomes friends with Ramona -- the club\'s top money earner. Ramona soon shows Destiny how to finagle her way around the wealthy Wall Street clientele who frequent the club. But when the 2008 economic collapse cuts into their profits, the gals and two other dancers devise a daring scheme to take their lives back.',
  shortDescription:
 'Four strippers turn the tables on their Wall Street clients after the 2008 economic collapse.',
  topCast: [ 'Constance Wu', 'Jennifer Lopez', 'Julia Stiles' ],
  directors: [ 'Lorene Scafaria' ],
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories:
 [ 'Adult Language',
   'Adult Situations',
   'Nudity',
   'Strong Sexual Content' ],
  runTime: 'PT01H50M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16835712_v_v5_ad.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object] ] },
{ tmsId: 'MV007920380000',
  rootId: '12028834',
  subType: 'Feature Film',
  title: 'Bad Boys for Life',
  releaseYear: 2020,
  releaseDate: '2020-01-16',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Action', 'Comedy' ],
  longDescription:
 'Old-school cops Mike Lowrey and Marcus Burnett team up with an elite unit to take down the vicious leader of a Miami drug cartel.',
  shortDescription:
 'Old-school cops team up with an elite unit to take down the vicious leader of a Miami drug cartel.',
  topCast: [ 'Will Smith', 'Martin Lawrence', 'Vanessa Hudgens' ],
  directors: [ 'Adil El Arbi', 'Bilall Fallah' ],
  officialUrl: 'https://www.sonypictures.com/movies/badboysforlife',
  qualityRating: { ratingsBody: 'TMS', value: '2.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Graphic Violence' ],
  runTime: 'PT02H04M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p12028834_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes:
 [ [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object] ] },
{ tmsId: 'MV012729530000',
  rootId: '17060373',
  subType: 'Feature Film',
  title: '1917',
  releaseYear: 2019,
  releaseDate: '2019-01-23',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'War', 'Historical drama' ],
  longDescription:
 'During World War I, two British soldiers -- Lance Cpl. Schofield and Lance Cpl. Blake -- receive seemingly impossible orders. In a race against time, they must cross over into enemy territory to deliver a message that could potentially save 1,600 of their fellow comrades -- including Blake\'s own brother.',
  shortDescription:
 'Two British soldiers cross over into enemy territory to save 1,600 comrades during World War I.',
  topCast: [ 'George MacKay', 'Dean-Charles Chapman', 'Mark Strong' ],
  directors: [ 'Sam Mendes' ],
  officialUrl: 'https://www.universalpictures.com/movies/1917',
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT01H59M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p17060373_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes:
 [ [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object] ] },
{ tmsId: 'MV012552960000',
  rootId: '16873842',
  subType: 'Feature Film',
  title: 'The Last Full Measure',
  releaseYear: 2020,
  releaseDate: '2020-01-24',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'War', 'Drama' ],
  longDescription:
 'Airman William H. Pitsenbarger Jr. is awarded the Medal of Honor for his service and actions on the battlefield.',
  shortDescription:
 'Airman William H. Pitsenbarger Jr. is awarded the Medal of Honor.',
  topCast: [ 'Sebastian Stan', 'Christopher Plummer', 'William Hurt' ],
  directors: [ 'Todd Robinson' ],
  officialUrl: 'https://www.thelastfullmeasurefilm.com/',
  qualityRating: { ratingsBody: 'TMS', value: '2.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT01H50M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16873842_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object], [Object], [Object] ] },
{ tmsId: 'MV012062730000',
  rootId: '16207756',
  subType: 'Feature Film',
  title: 'Spies in Disguise',
  releaseYear: 2019,
  releaseDate: '2019-08-09',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Comedy', 'Adventure', 'Action', 'Animated', 'Children' ],
  audience: 'Children',
  longDescription:
 'Super spy Lance Sterling and scientist Walter Beckett are almost exact opposites. Lance is smooth, suave and debonair. Walter is not. But what Walter lacks in social skills he makes up for in smarts and invention, creating the awesome gadgets Lance uses on his epic missions. But when events take an unexpected turn, Walter and Lance suddenly have to rely on each other in a whole new way. And if this odd couple can\'t learn to work as a team, the whole world is in peril.',
  shortDescription:
 'A suave super spy and a scientist-inventor must work together as a team in order to save the world.',
  topCast: [ 'Will Smith', 'Tom Holland', 'Rashida Jones' ],
  directors: [ 'Troy Quane', 'Nick Bruno' ],
  officialUrl: 'https://www.foxmovies.com/movies/spies-in-disguise',
  qualityRating: { ratingsBody: 'TMS', value: '3' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Situations', 'Violence' ],
  runTime: 'PT01H42M',
  animation: 'Animated',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16207756_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object] ] },
{ tmsId: 'MV012921070000',
  rootId: '17259997',
  subType: 'Feature Film',
  title: 'The Gentlemen',
  releaseYear: 2020,
  releaseDate: '2020-01-01',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Comedy', 'Crime drama' ],
  longDescription:
 'Mickey Pearson is an American expatriate who became rich by building a highly profitable marijuana empire in London. When word gets out that he\'s looking to cash out of the business, it soon triggers an array of plots and schemes -- including bribery and blackmail -- from shady characters who want to steal his domain.',
  shortDescription:
 'Shady characters launch an array of plots and schemes to steal a London drug lord\'s domain.',
  topCast:
 [ 'Matthew McConaughey', 'Charlie Hunnam', 'Michelle Dockery' ],
  directors: [ 'Guy Ritchie' ],
  qualityRating: { ratingsBody: 'TMS', value: '2.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT01H53M',
  preferredImage:
 { width: '240',
   height: '360',
   caption: [Object],
   uri: 'assets/p17259997_p_v5_ab.jpg',
   category: 'Poster Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object], [Object], [Object] ] },
{ tmsId: 'MV012684230000',
  rootId: '17008397',
  subType: 'Feature Film',
  title: 'Little Women',
  releaseYear: 2019,
  releaseDate: '2019-12-25',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Drama' ],
  longDescription:
 'In the years after the Civil War, Jo March lives in New York and makes her living as a writer, while her sister Amy studies painting in Paris. Amy has a chance encounter with Theodore, a childhood crush who proposed to Jo but was ultimately rejected. Their oldest sibling, Meg, is married to a schoolteacher, while shy sister Beth develops a devastating illness that brings the family back together.',
  shortDescription:
 'Jo March and her two sisters return home when shy sibling Beth develops a devastating illness.',
  topCast: [ 'Saoirse Ronan', 'Emma Watson', 'Florence Pugh' ],
  directors: [ 'Greta Gerwig' ],
  officialUrl: 'https://www.sonypictures.com/movies/littlewomen',
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Situations' ],
  runTime: 'PT02H15M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p17008397_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes:
 [ [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object] ] },
{ tmsId: 'MV011872380000',
  rootId: '15862829',
  subType: 'Feature Film',
  title: 'The Turning',
  releaseYear: 2020,
  releaseDate: '2020-01-23',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Horror', 'Thriller' ],
  longDescription:
 'Kate Mandell takes a job as a nanny for two young orphans at an isolated Gothic mansion in the Maine countryside. She soon learns that the children -- Miles and Flora -- are emotionally distant and unstable. When strange events start to plague Kate and the siblings, she begins to suspect that the estate\'s dark corridors are home to a malevolent entity.',
  shortDescription:
 'A nanny uncovers dark secrets while caring for two disturbed orphans at a haunted Maine mansion.',
  topCast: [ 'Mackenzie Davis', 'Finn Wolfhard', 'Brooklynn Prince' ],
  directors: [ 'Floria Sigismondi' ],
  officialUrl: 'https://www.theturningmovie.com/',
  qualityRating: { ratingsBody: 'TMS', value: '1.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT01H33M',
  preferredImage:
 { width: '240',
   height: '360',
   caption: [Object],
   uri: 'assets/p15862829_p_v5_aa.jpg',
   category: 'Poster Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object], [Object], [Object] ] },
{ tmsId: 'MV012052110000',
  rootId: '16195223',
  subType: 'Feature Film',
  title: 'Dolittle',
  releaseYear: 2020,
  releaseDate: '2020-01-17',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Fantasy', 'Adventure', 'Comedy', 'Animated', 'Children' ],
  audience: 'Children',
  longDescription:
 'Dr. John Dolittle lives in solitude behind the high walls of his lush manor in 19th-century England. His only companionship comes from an array of exotic animals that he speaks to on a daily basis. But when young Queen Victoria becomes gravely ill, the eccentric doctor and his furry friends embark on an epic adventure to a mythical island to find the cure.',
  shortDescription:
 'Dr. John Dolittle and an array of exotic animals embark on an epic adventure to a mythical island.',
  topCast: [ 'Robert Downey', 'Antonio Banderas', 'Michael Sheen' ],
  directors: [ 'Stephen Gaghan' ],
  officialUrl: 'https://www.dolittlethemovie.com/',
  qualityRating: { ratingsBody: 'TMS', value: '1.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations' ],
  runTime: 'PT01H40M',
  animation: 'Live action/animated',
  preferredImage:
 { width: '240',
   height: '360',
   caption: [Object],
   uri: 'assets/p16195223_p_v5_aa.jpg',
   category: 'Poster Art',
   text: 'yes',
   primary: 'true' },
  showtimes:
 [ [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object],
   [Object] ] },
{ tmsId: 'MV012777200000',
  rootId: '17115190',
  subType: 'Feature Film',
  title: 'Just Mercy',
  releaseYear: 2019,
  releaseDate: '2019-09-06',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Drama' ],
  longDescription:
 'After graduating from Harvard, Bryan Stevenson heads to Alabama to defend those wrongly condemned or those not afforded proper representation. One of his first cases is that of Walter McMillian, who is sentenced to die in 1987 for the murder of an 18-year-old girl, despite evidence proving his innocence. In the years that follow, Stevenson encounters racism and legal and political maneuverings as he tirelessly fights for McMillian\'s life.',
  shortDescription:
 'Lawyer Bryan Stevenson fights for the life of death row inmate Walter McMillian.',
  topCast: [ 'Michael B. Jordan', 'Jamie Foxx', 'Brie Larson' ],
  directors: [ 'Destin Daniel Cretton' ],
  officialUrl: 'https://www.warnerbros.com/movies/just-mercy',
  qualityRating: { ratingsBody: 'TMS', value: '3' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations' ],
  runTime: 'PT02H16M',
  preferredImage:
 { width: '240',
   height: '360',
   caption: [Object],
   uri: 'assets/p17115190_p_v5_aa.jpg',
   category: 'Poster Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object], [Object] ] },
{ tmsId: 'MV012952010000',
  rootId: '17290162',
  subType: 'Feature Film',
  title: 'Weathering With You',
  releaseYear: 2019,
  releaseDate: '2019-10-17',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Drama', 'Fantasy', 'Anime' ],
  longDescription:
 'A boy runs away to Tokyo and befriends a girl who appears to be able to manipulate the weather.',
  shortDescription:
 'A boy runs away to Tokyo and befriends a girl who appears to be able to manipulate the weather.',
  topCast: [ 'Kotaro Daigo' ],
  directors: [ 'Makoto Shinkai' ],
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT01H51M',
  animation: 'Anime',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p17290162_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object] ] },
{ tmsId: 'MV010023510000',
  rootId: '14097646',
  subType: 'Feature Film',
  title: 'Star Wars: The Rise of Skywalker',
  releaseYear: 2019,
  releaseDate: '2019-12-18',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Science fiction', 'Adventure', 'Action', 'Fantasy' ],
  longDescription:
 'When it\'s discovered that the evil Emperor Palpatine did not die at the hands of Darth Vader, the rebels must race against the clock to find out his whereabouts. Finn and Poe lead the Resistance to put a stop to the First Order\'s plans to form a new Empire, while Rey anticipates her inevitable confrontation with Kylo Ren.',
  shortDescription:
 'Rey and her allies prepare for a showdown against Kylo Ren and the First Order.',
  topCast: [ 'Carrie Fisher', 'Mark Hamill', 'Adam Driver' ],
  directors: [ 'J.J. Abrams' ],
  officialUrl:
 'https://www.starwars.com/films/star-wars-episode-ix-the-rise-of-skywalker',
  qualityRating: { ratingsBody: 'TMS', value: '2.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Situations', 'Violence' ],
  runTime: 'PT02H22M',
  preferredImage:
 { width: '240',
   height: '360',
   caption: [Object],
   uri: 'assets/p14097646_p_v5_an.jpg',
   category: 'Poster Art',
   text: 'yes',
   primary: 'true' },
  showtimes:[
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T12:20',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T15:40',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T18:50',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '9651',
        'name': 'AMC Southcenter 16'
      },
      'dateTime': '2020-01-30T22:15',
      'quals': 'Closed Captioned|Descriptive Video Services|Reserved Seating',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AAUXG&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '7885',
        'name': 'Regal Parkway Plaza Stadium 12'
      },
      'dateTime': '2020-01-30T13:20',
      'quals': 'Closed Captioned|Descriptive Video Services',
      'barg': true,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AANJP&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '7885',
        'name': 'Regal Parkway Plaza Stadium 12'
      },
      'dateTime': '2020-01-30T16:40',
      'quals': 'Closed Captioned|Descriptive Video Services',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AANJP&m=173583&d=2020-01-30'
    },
    {
      'theatre': {
        'id': '7885',
        'name': 'Regal Parkway Plaza Stadium 12'
      },
      'dateTime': '2020-01-30T19:25',
      'quals': 'Closed Captioned|Descriptive Video Services',
      'barg': false,
      'ticketURI': 'http://www.fandango.com/tms.asp?t=AANJP&m=173583&d=2020-01-30'
    }
  ] },
{ tmsId: 'MV012662370000',
  rootId: '16981625',
  subType: 'Feature Film',
  title: 'Knives Out',
  releaseYear: 2019,
  releaseDate: '2019-09-07',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Mystery', 'Comedy drama' ],
  longDescription:
 'When renowned crime novelist Harlan Thrombey dies just after his 85th birthday, the inquisitive and debonair Detective Benoit Blanc arrives at his estate to investigate. From Harlan\'s dysfunctional family to his devoted staff, Blanc sifts through a web of red herrings and self-serving lies to uncover the truth behind Thrombey\'s untimely demise.',
  shortDescription:
 'A detective interviews the quirky relatives of a patriarch who died just after his 85th birthday.',
  topCast: [ 'Daniel Craig', 'Chris Evans', 'Ana de Armas' ],
  directors: [ 'Rian Johnson' ],
  officialUrl: 'https://www.lionsgate.com/movies/knives-out',
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT02H10M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16981625_v_v5_ac.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object], [Object] ] },
{ tmsId: 'MV011111610000',
  rootId: '15446613',
  subType: 'Feature Film',
  title: 'Jumanji: The Next Level',
  releaseYear: 2019,
  releaseDate: '2019-12-04',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Adventure', 'Action', 'Comedy', 'Fantasy' ],
  longDescription:
 'When Spencer goes back into the fantastical world of Jumanji, pals Martha, Fridge and Bethany re-enter the game to bring him home. But the game is now broken -- and fighting back. Everything the friends know about Jumanji is about to change, as they soon discover there\'s more obstacles and more danger to overcome.',
  shortDescription:
 'Martha, Fridge and Bethany re-enter the fantastical world of Jumanji to bring Spencer home.',
  topCast: [ 'Dwayne Johnson', 'Kevin Hart', 'Jack Black' ],
  directors: [ 'Jake Kasdan' ],
  officialUrl: 'http://www.jumanjimovie.com/',
  qualityRating: { ratingsBody: 'TMS', value: '2.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations' ],
  runTime: 'PT02H03M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p15446613_v_v5_af.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes:
 [ [Object], [Object], [Object], [Object], [Object], [Object] ] },
{ tmsId: 'MV012678360000',
  rootId: '16965677',
  subType: 'Feature Film',
  title: 'Parasite',
  releaseYear: 2019,
  releaseDate: '2019-05-21',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Dark comedy', 'Thriller' ],
  longDescription:
 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
  shortDescription:
 'Greed and class discrimination threaten the relationship between a poor family and a wealthy family.',
  topCast: [ 'Song Kang-ho', 'Yeo-jeong Jo', 'So-dam Park' ],
  directors: [ 'Bong Joon-ho' ],
  officialUrl: 'https://www.parasite-movie.com/',
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT02H12M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16965677_v_v5_ad.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object] ] },
{ tmsId: 'MV011872310000',
  rootId: '15862751',
  subType: 'Feature Film',
  title: 'The Rhythm Section',
  releaseYear: 2020,
  releaseDate: '2020-01-08',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Action', 'Thriller' ],
  longDescription:
 'Stephanie Patrick veers down a path of self-destruction after a tragic plane crash kills her family. When Stephanie discovers it wasn\'t an accident, she soon embarks on a bloody quest for revenge to punish those responsible.',
  shortDescription:
 'A woman embarks on a quest for revenge to punish those responsible for the death of her family.',
  topCast: [ 'Blake Lively', 'Jude Law', 'Sterling K. Brown' ],
  directors: [ 'Reed Morano' ],
  officialUrl: 'https://www.paramount.com/movies/rhythm-section',
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Violence' ],
  runTime: 'PT01H49M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p15862751_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object] ] },
{ tmsId: 'MV012896380000',
  rootId: '17232014',
  subType: 'Feature Film',
  title: 'Gretel & Hansel',
  releaseYear: 2020,
  releaseDate: '2020-01-31',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Horror', 'Fantasy' ],
  longDescription:
 'A girl and her younger brother unwittingly stumble upon the house of an evil witch in the dark woods.',
  shortDescription:
 'A girl and her brother unwittingly stumble upon the house of an evil witch in the dark woods.',
  topCast: [ 'Sophia Lillis', 'Alice Krige', 'Sammy Leakey' ],
  directors: [ 'Osgood Perkins' ],
  officialUrl: 'https://orionpictures.com/projects/gretel-hansel',
  ratings: [ [Object] ],
  advisories: [ 'Adult Situations' ],
  runTime: 'PT01H27M',
  preferredImage:
 { width: '240',
   height: '360',
   caption: [Object],
   uri: 'assets/p17232014_p_v5_ac.jpg',
   category: 'Poster Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object] ] },
{ tmsId: 'MV013748160000',
  rootId: '17866980',
  subType: 'Feature Film',
  title: 'Street Dancer 3D',
  releaseYear: 2020,
  releaseDate: '2020-01-24',
  titleLang: 'en',
  entityType: 'Movie',
  genres: [ 'Drama' ],
  topCast: [ 'Varun Dhawan', 'Shraddha Kapoor', 'Prabhu Deva' ],
  directors: [ 'Remo D\'Souza' ],
  runTime: 'PT02H26M',
  preferredImage: { uri: 'tvbanners/generic/generic_tvbanners_v5.png' },
  showtimes: [ [Object], [Object], [Object] ] },
{ tmsId: 'MV013604630000',
  rootId: '17705623',
  subType: 'Feature Film',
  title: 'Tanhaji: The Unsung Warrior',
  releaseYear: 2020,
  releaseDate: '2020-01-10',
  titleLang: 'en',
  entityType: 'Movie',
  genres: [ 'Action', 'Drama' ],
  topCast: [ 'Ajay Devgn', 'Saif Ali Khan', 'Kajol' ],
  directors: [ 'Om Raut' ],
  advisories: [ 'Adult Situations', 'Violence' ],
  runTime: 'PT02H11M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p17705623_v_v5_aa.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object], [Object] ] },
{ tmsId: 'MV012578350000',
  rootId: '16929579',
  subType: 'Feature Film',
  title: 'A Beautiful Day in the Neighborhood',
  releaseYear: 2019,
  releaseDate: '2019-09-07',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Biography', 'Drama' ],
  longDescription:
 'Lloyd Vogel is an investigative journalist who receives an assignment to profile Fred Rogers, aka Mr. Rogers. He approaches the interview with skepticism, as he finds it hard to believe that anyone can have such a good nature. But Roger\'s empathy, kindness and decency soon chips away at Vogel\'s jaded outlook on life, forcing the reporter to reconcile with his own painful past.',
  shortDescription:
 'A jaded journalist learns about empathy, kindness and decency from Fred Rogers, aka Mr. Rogers.',
  topCast: [ 'Tom Hanks', 'Matthew Rhys', 'Susan Kelechi Watson' ],
  directors: [ 'Marielle Heller' ],
  officialUrl:
 'https://www.sonypictures.com/movies/abeautifuldayintheneighborhood',
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations' ],
  runTime: 'PT01H47M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16929579_v_v5_ac.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object], [Object] ] },
{ tmsId: 'MV004672090000',
  rootId: '9811134',
  subType: 'Feature Film',
  title: 'Miracle in Cell No. 7',
  releaseYear: 2013,
  releaseDate: '2013-03-08',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Comedy drama' ],
  longDescription:
 'Inmates at a Korean prison join forces to protect a comrade and his young daughter, who cannot bear to be separated for even a moment.',
  shortDescription:
 'Prisoners unite to protect a convict who cannot be separated from his young daughter.',
  topCast: [ 'Seung-Ryong Ryu', 'Shin-hye Park', 'Dal-Soo Oh' ],
  directors: [ 'Lee Hwan-Gyeong' ],
  runTime: 'PT02H07M',
  preferredImage: { uri: 'tvbanners/generic/generic_tvbanners_v5.png' },
  showtimes: [ [Object], [Object], [Object] ] },
{ tmsId: 'MV012845300000',
  rootId: '16949721',
  subType: 'Feature Film',
  title: 'Pain and Glory',
  releaseYear: 2019,
  releaseDate: '2019-05-16',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Drama' ],
  longDescription:
 'An aging Spanish film director in the middle of a creative crisis revisits memorable events of his past.',
  shortDescription:
 'An aging film director in the middle of a creative crisis revisits memorable events of his past.',
  topCast: [ 'Antonio Banderas', 'Asier Etxeandia', 'Penélope Cruz' ],
  directors: [ 'Pedro Almodóvar' ],
  officialUrl: 'https://www.sonyclassics.com/painandglory/#',
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations', 'Nudity' ],
  runTime: 'PT01H53M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16949721_v_v5_ac.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object] ] },
{ tmsId: 'MV012528700000',
  rootId: '16843164',
  subType: 'Feature Film',
  title: 'Ford v Ferrari',
  releaseYear: 2019,
  releaseDate: '2019-05-11',
  titleLang: 'en',
  descriptionLang: 'en',
  entityType: 'Movie',
  genres: [ 'Historical drama', 'Biography' ],
  longDescription:
 'American automotive designer Carroll Shelby and fearless British race car driver Ken Miles battle corporate interference, the laws of physics and their own personal demons to build a revolutionary vehicle for the Ford Motor Co. Together, they plan to compete against the race cars of Enzo Ferrari at the 24 Hours of Le Mans in France in 1966.',
  shortDescription:
 'An auto designer builds a revolutionary race car to compete against the Ferrari at the 1966 Le Mans.',
  topCast: [ 'Matt Damon', 'Christian Bale', 'Jon Bernthal' ],
  directors: [ 'James Mangold' ],
  officialUrl: 'https://www.foxmovies.com/movies/ford-v-ferrari',
  qualityRating: { ratingsBody: 'TMS', value: '3.5' },
  ratings: [ [Object] ],
  advisories: [ 'Adult Language', 'Adult Situations' ],
  runTime: 'PT02H32M',
  preferredImage:
 { width: '240',
   height: '360',
   uri: 'assets/p16843164_v_v5_ao.jpg',
   category: 'VOD Art',
   text: 'yes',
   primary: 'true' },
  showtimes: [ [Object] ] },
{ tmsId: 'EV000000223789',
  rootId: '167926',
  subType: 'Theatre Event',
  title: 'Animated',
  titleLang: 'en',
  entityType: 'Movie',
  preferredImage: { uri: 'tvbanners/generic/generic_tvbanners_v5.png' },
  showtimes: [ [Object] ] },
{ tmsId: 'EV000000225458',
  rootId: '168920',
  subType: 'Theatre Event',
  title: 'Oscar Animated and Live Action Shorts',
  titleLang: 'en',
  entityType: 'Movie',
  preferredImage: { uri: 'tvbanners/generic/generic_tvbanners_v5.png' },
  showtimes: [ [Object] ] } ];
