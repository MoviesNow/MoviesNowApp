'use strict';

require('dotenv').config();
const express = require('express');
const app = express();





const PORT = process.env.PORT || 3001;






app.get('/hello', (request, response) => {
  response.status(200).send('Hello');
});





function errorHandler(err, request, response) {
  response.status(500).send('Sorry, something went wrong');
}

function developerErrorHandler(request, response) {
  response.status(404).send('sorry this request is not available yet');
}









app.use('*', developerErrorHandler);

app.get((error, req, res) => errorHandler(error, res));

app.listen(PORT, () => console.log(`Never Give up ${PORT}`));
