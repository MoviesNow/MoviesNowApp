Vision
As a Code Fellows student, I do not have much free time. When we do have free time, some of us really enjoy going to see movies in theaters. We will create an app/site that allows  users to select the movie their want to see and an approximate time their want to see it, and give them as a result a local theater that will be playing that movie, at a time nearest to the time they selected.

Scope (In/Out)
-	IN
The Movies Now App will how user’s different theater and movie’s which is playing in their areas and their can select their preferences based on the time and the day is been playing.
The Movies Now App will be easy to use for any people at any age who is willing to watch movies at their free time.
-	Out
The movies App Now will not for anyone who does not like to watch movies

MVP Features
•	A responsive website for desktop & mobile.
•	A clean user-friendly UI.
•	Selectable proposed movie times.
•	Movie image & title cards that the user can click on.
•	User is returned the desired results.
•	User login.
•	SQL database to store user search results.
•	Database results expire after midnight local time.
Stretch Goals
•	A Go See Now™ option that will take into consideration the user's current location (Google Maps JavaScript API (Links to an external site.)) along with the movie they want to see and calculate the expected drive time in order to provide the user with the earliest option to see the movie they want while excluding options that they would not be able to reach in time.
•	Option for Go See Now™ add 20 minutes to the reported show time for the Go See Now™ calculations, if the user doesn't care about seeing trailers.
•	Standard movie app features:
o	All movie times for chosen movie sorted by theaters closest to user's location.
o	List of all movie theaters sorted by closest to user's location.
	Selecting a theater gives you all of the movies showing at the theater with their times.
o	Logged in users will be able to save favorite theaters.
o	Movie times for that day that are no longer available will be grayed out.
o	Select a date in the future to get movie times for that day.
o	Selecting a movie time at a theater will redirect user to an outside web page (Fandango) where they will be presented with the ability to purchase movie tickets.
Functional Requirements
-	The users will fill out a form
-	The users can be able to see the result to their request.
-	The users can be able to update and delete the movie.
Data Flow
First the user will fill out a form to request the movies and the theater they want.
Their form will go to the server and check in the form if movies data is stored in the database
If information is stored it will send it back to the user for the result.
If information is not stored in the data base, the server will go to fandango api to get information and store it in the server and then send it back to the user.
Non-Functional Requirement
All keys will be store in dotenv,
We will be using public file where the application will be,
Usability: Available on all plate form with mobile first view,
Testability: checking movies from application and comparing to outside sources.


