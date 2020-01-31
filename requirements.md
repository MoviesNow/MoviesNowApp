### Vision
As a Code Fellows student, I do not have much free time. When we do have free time, some of us really enjoy going to see movies in theaters. We will create an app/site that allows  users to select the movie their want to see and an approximate time their want to see it, and give them as a result a local theater that will be playing that movie, at a time nearest to the time they selected.

### Scope (In/Out)
**IN**
- The MoviesNOW app will show users a list of movies playing in theaters nationally.
- The MoviesNOW app will allow users to input their location, their preferred movie time, and movie selection.
- The MoviesNOW app will provide results to the users based on user input.
- The MoviesNOW app will be easy to use for people at any age who.

**Out**
- The MoviesNOW app will not provide driving directions to the theater location.

### MVP Features
-	A responsive website for mobile.
-	A clean user-friendly UI.
-	Selectable proposed movie times.
-	Movie image & title cards that the user can click on.
-	User is returned the desired results.
-	SQL database to store movie information.
-	Database results that will expire after a specified interval.

### Stretch Goals
-	A Go See Now™ option that will take into consideration the user's current location (Google Maps JavaScript API (Links to an external site.)) along with the movie they want to see and calculate the expected drive time in order to provide the user with the earliest option to see the movie they want while excluding options that they would not be able to reach in time.
-	Option for Go See Now™ add 20 minutes to the reported show time for the Go See Now™ calculations, if the user doesn't care about seeing trailers.
-	Standard movie app features:
  -	All movie times for chosen movie sorted by theaters closest to user's location.
  - List of all movie theaters sorted by closest to user's location.
    - Selecting a theater gives you all of the movies showing at the theater with their times.
  - Logged in users will be able to save favorite theaters.
  - Movie times for that day that are no longer available will be grayed out.
  - Select a date in the future to get movie times for that day.
  - Selecting a movie time at a theater will redirect user to an outside web page (Fandango) where they will be presented with the ability to purchase movie tickets.

### Functional Requirements
-	The users will be able to type in a zip code, select a preferred time from a drop down menu, and select a movie
-	The users will have their results presented to them after submitting their selections.

### Data Flow
When the page loads, the server will first check to see if the values stored in the movies table are out dated and delete as needed.
If the valid current data is present in the table, it will be used to render the images on the web app.
Otherwise the server will make an API call to TMDB to retrieve current data to render to the page.
The user will then make 3 selections and submit the form.
The server will make an API call to the TMS api to retrieve what movies are playing locally and all showtimes available in the area.
The server will then perform the logic required to present the user with their results.

### Non-Functional Requirement
All keys will be store in dotenv,
Usability: Available only on mobile
Testability: Verify that the results provided match what is available on mainstream apps.


