# Movie Now App

As a Code Fellows student, I do not have much free time. When I do have free time, I really enjoy going to see movies in theaters. I would want an app/site that allows me to select the movie I want to see and an approximate time I want to see it, and give me as a result a local theater that will be playing that movie, at a time nearest to the time I selected. API utilized: Fandango

### Description

**Given** user has selected a time and entered in a zip code

**When** the user selects a movie

**Then** the user is returned a movie showtime, closest to their requested show time.

### MVP Features

 - A responsive website for desktop & mobile.
 - A clean user friendly UI.
 - Selectable proposed movie times.
 - Movie image & title cards that the user can click on.
 - User is returned the desired results.
 - User login.
 - SQL database to store user search results.
 - Database results expire after midnight local time.
 
 ### Stretch Goals

 - A `Go Now™` option that will take into consideration the user's current location (Google Maps JavaScript API (Links to an external site.)) along with the movie they want to see and calculate the expected drive time in order to provide the user with the earliest option to see the movie they want while excluding options that they would not be able to reach in time.
 - Option for `Go Now™` add 20 minutes to the reported show time for the Go See Now™ calculations, if the user doesn't care about seeing trailers.
 - Standard movie app features:
 - All movie times for chosen movie sorted by theaters closest to user's location.
 - List of all movie theaters sorted by closest to user's location.
 - Selecting a theater gives you all of the movies showing at the theater with their times.
 - Logged in users will be able to save favorite theaters.
 - Movie times for that day that are no longer available will be grayed out.
 - Select a date in the future to get movie times for that day.
 - Selecting a movie time at a theater will redirect user to an outside web page (Fandango ) where they will be presented with the ability to purchase movie tickets.

### [Project Board](https://github.com/MoviesNow/MoviesNowApp/projects/1)

 ### Wire Frames
 ![Mobile Main Page 1](/readme-assets/Main1-Mobile.jpg) ![Mobile Main Page 2](/readme-assets/Main2-Mobile.jpg)
 ![Mobile About Page 1](/readme-assets/About1-Mobile.jpg) ![Mobile About Page 2](/readme-assets/About2-Mobile.jpg)
 ![Mobile Sign-In Page 1](/readme-assets/SignIn1-Mobile.jpg) ![Mobile Sign-In Page 2](/readme-assets/SignIn2-Mobile.jpg)

 ### Domain Model
![Domain Model](/readme-assets/Domain-Model.jpg)

 ### Database Entity Relationship Diagram
![Database Entity Relationship Diagram](/readme-assets/Database-Entity-Relationship-Diagram.jpg)
