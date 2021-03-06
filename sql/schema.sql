 
-- Drop movies table is exist,
DROP TABLE IF EXISTS movies;

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR (255),
  movie_description VARCHAR,
  ratings_code VARCHAR (255),
  img_url VARCHAR (255),
  runtime VARCHAR (255),
  date_time BIGINT
);



-- Drop search_results table if exist
DROP TABLE IF EXISTS search_results;

CREATE Table search_results(
  id SERIAL PRIMARY KEY,
  title VARCHAR (255),
  zip INT,
  theater VARCHAR (255),
  selected_time VARCHAR (255),
  date_time TIMESTAMP,
  expire_date_time TIMESTAMP
);

-- Drop users table if exist
DROP TABLE IF EXISTS users;

CREATE Table users(
  id SERIAL PRIMARY KEY,
  username VARCHAR (255),
  firstname VARCHAR (255),
  lastname VARCHAR (255),
  email VARCHAR (255)
);

