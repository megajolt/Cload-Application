# Assignment 3

**Assignment due at 11:59pm on Monday 5/20/2024**<br/>
**Demo due by 11:59pm on Monday 6/3/2024**

The goal of this assignment is to incorporate authorization and authentication into our businesses API.  There are a few parts to this assignment, as described below.

You are provided some starter code in this repository that implements a MySQL/Sequelize-based solution to assignment 2.  The starter code contains the following components:
  * An API server is implemented in `server.js`.
  * Individual API routes are modularized within the `api/` directory.
  * Sequelize models are implemented in the `models/` directory.
  * Tests and a testing environment for the API are included in the `tests/` directory. You can import these tests into either Postman or Insomnia and build on them if you like. Note that, depending on where you're running your API server, you may need to update the `baseUrl` variable in the included testing environment to reflect the URL for your own server.
  * A script in `initDb.js` that populates the database with initial data from the `data/` directory.  You can run this script by running `npm run initdb`.
  * For those who are curious, I'm also including a directory `replication-setup/` containing a set of scripts and configurations for setting up a MySQL group replication cluster using Docker.  This is not needed for this assignment, but I thought some folks might be interested in seeing it.

Feel free to use this code as your starting point for this assignment.  You may also use your own solution to assignment 2 as your starting point if you like, or you may convert the existing solution to use MongoDB.  If you do either of those things, you must ensure that your API implementation matches the one from the starter code (i.e. it has all the same endpoints, etc.).

## 1. Implement an API endpoint for creating new users

Your first task for this assignment is to implement an API endpoint to enable the creation and storage of application users.  Specifically, you should create a `POST /users` API endpoint through which new users can register.  When a user registers, they should provide their name, email address, and password, and you should salt and hash the password on the server before storing it.

If you work with the starter code for this assignment, you'll need to create a Sequelize `User` model to represent users.  If you work with another version of the code, you'll have to model users in an appropriate way.  However you do it, you should store the following information for each user:
  * `id` - The primary key for the user (if you're using MongoDB, it's fine to stick with the default primary key name `_id`)
  * `name` - User's full name
  * `email` - User's email address (which must be unique among all users)
  * `password` - User's hashed/salted password
  * `admin` - A boolean flag indicating whether the user has administrative permissions (`false` by default)

Importantly, you'll need to make sure you hash and salt users passwords before storing them in your database.  If you stick with the Sequelize implementation from the starter code, the easiest way to do this is to use a [Sequelize setter](https://sequelize.org/docs/v6/core-concepts/getters-setters-virtuals/#setters) for your password field.  If you do this, note that a Sequelize setter cannot contain asynchronous code, so you'll have to use [ bcryptjs's synchronous `hashSync()` function](https://github.com/dcodeIO/bcrypt.js#usage---sync).

Also, note that the starter code contains some user data in `data/users.json`, which you can use to populate some initial users into your database.  If you're using the starter code's Sequelize implementation and populate your database using `initDb.js`, you can add additional code there to populate the users table in a manner similar to the way business, review, and photo data is populated using `bulkCreate()`.  If you do this, the values of the `ownerId` field in the initial business data should map to the correct users from the initial user data.

Finally, note that you may have to manually connect to the database (e.g. using the MySQL terminal monitor) to insert at least one user with administrative permissions (i.e. for whom the `admin` flag is `true`).  If you do this, you can use the following pre-salted/hashed version of the password "hunter2":
```
$2a$08$Y00/JO/uN9n0dHKuudRX2eKksWMIHXDLzHWKuz/K67alAYsZRRike
```

## 2. Enable JWT-based user logins and implement a user data access endpoint

Once you have enabled user registration for your application, implement a new `POST /users/login` API endpoint that allows a registered user to log in by sending their email address and password.  If the email/password combination is valid, you should respond with a JWT token, which the user can then send with future requests to authenticate themselves.  The JWT token payload should contain the user's ID (with which you should be able to fetch details about the user from the database) and any other information needed to implement the features described in this assignment, and it should expire after 24 hours.

If a user attempts to log in with an invalid username or password, you should respond with a 401 error.

In addition, you should create a `GET /users/{userId}` API endpoint that returns information about the specified user (excluding their password).

## 3. Require authorization to perform certain API actions

Once users can log in, modify your API to implement the following authorization scheme:
  * Only an authorized user can see their own user data and their own lists of businesses, reviews, and photos.  In other words, the following API endpoints should verify that the `userId` specified in the URL path matches the ID of the logged-in user (as indicated by a valid JWT provided by the client):
    * `GET /users/{userId}`
    * `GET /users/{userId}/businesses`
    * `GET /users/{userId}/photos`
    * `GET /users/{userId}/reviews`

  * Only an authorized user can create new businesses, reviews, and photos.  In other words, the following API endpoints must ensure that a user is logged in and that the user ID specified in the POST request body matches the ID of the logged-in user:
    * `POST /businesses`
    * `POST /photos`
    * `POST /reviews`

  * Only an authorized user can modify or delete their own businesses, reviews, and photos.  In other words, the following API endpoints must ensure that a user is logged in and that the user ID for the entity being modified/deleted matches the ID of the logged-in user:
    * `PUT /businesses`, `DELETE /businesses`
    * `PUT /photos`, `DELETE /photos`
    * `PUT /reviews`, `DELETE /reviews`

  * A user with `admin` permissions may perform any action, including creating content or fetching/modifying/deleting the content of any user.

  * Only a user with `admin` permissions may create other `admin` users, i.e. the creation of `admin` users must be accompanied by a valid JWT for a logged-in `admin` user.

All authorized endpoints should respond with an error if the logged-in user is not authorized or if no user is logged in (i.e. no JWT is provided).

## CS 599 only: use the HTTPS protocol

This application's challenge for students in the grad section of the course is to adapt your API server to use the encrypted [HTTPS protocol](https://aws.amazon.com/compare/the-difference-between-https-and-http/) instead the unencrypted HTTP protocol.  As we discussed in class, sending sensitive information like user credentials across an unencrypted channel between the client and the server is a major vulnerability, since anyone between the client and the server could easily read that sensitive information in plain text.  Using HTTPS ensures information travelling between the client and server is encrypted from end to end, so no one in between can easily access that information.  This is required in any production application where the client and server exchange sensitive information.

If you're in the grad section of the course you must set up your API server so that all traffic to the server uses HTTPS instead of HTTP.  In other words, when making requests to your API server, it should be possible to use an `https://...` URL instead of an `http://...` URL for all API endpoints.

Note that to set up an HTTPS server, you need a certificate that would normally be signed by a public [certificate authority (CA)](https://en.wikipedia.org/wiki/Certificate_authority) in order to verify the identity of your application.  For this application, you should use a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate).

## Extra credit: rate limiting

For 10 points of extra credit, you can implement a rate-limiting scheme that works as follows:

  * Requests that do not come from an authenticated user are rate-limited on a per-IP address basis.  These unauthenticated requests can be made at a rate of 5 requests per minute.

  * Requests that come from an authenticated user are rate-limited on a per-user basis.  These authenticated requests can be made at a rate of 10 requests per minute.

This rate-limiting scheme should be backed by a Redis cache that runs in a Docker container.

This extra credit is available to students in either section of the course.

## Running code in GitHub Codespaces

For this assignment, I've enabled a feature called [GitHub Codespaces](https://docs.github.com/en/codespaces/) that will provide you with a private online environment where you can develop and test your code for the assignment.  This environment will be centered around a browser-based version of the [VS Code](https://code.visualstudio.com/) editor.  You can access the Codespace by clicking "Create codespace on main" under the "Code" button in your assignment repository on GitHub:

![Image of GitHub Codespaces button](https://www.dropbox.com/s/wvijvh130fjuud5/Screen%20Shot%202022-05-24%20at%2011.17.58%20AM.png?raw=true)

You may use this browser-based editor as much or as little as you like, and in general, I encourage you to stick with whatever development setup already works best for you (i.e. your preferred editor running on your preferred development machine).

The reason I'm providing the Codespace is to provide an environment where it will be easy to use Docker if you've been having trouble running Docker on your development machine.  In particular, Docker should be already installed in the Codespace when you launch it, and you can use it through the Codespace terminal just as we discussed in lecture.

You can access the Codespace terminal through the menu of the browser-based version of VS Code associated with the Codespace:

![Image of Codespace terminal access](https://www.dropbox.com/s/nqebudssjvcwyw5/Screen%20Shot%202022-05-24%20at%2011.45.34%20AM.png?raw=true)

Inside this terminal, you should be able to run your code as described above.

If you're editing outside the browser-based version of VS Code associated with your Codespace, and you want to test your code inside the Codespace, you'll need to make sure you use Git to pull your most recent commit(s) into the Codespace.  You can do this through the browser-based VS Code's Git integration:

![Image of VS Code Git pull command](https://www.dropbox.com/s/d4rlv954af0q6r4/Screen%20Shot%202022-05-24%20at%2011.37.23%20AM.png?raw=true)

## Submission

We'll be using GitHub Classroom for this assignment, and you will submit your assignment via GitHub.  Just make sure your completed files are committed and pushed by the assignment's deadline to the main branch of the GitHub repo that was created for you by GitHub Classroom.  A good way to check whether your files are safely submitted is to look at the main branch your assignment repo on the github.com website (i.e. https://github.com/osu-cs493-599-sp24/assignment-3-YourGitHubUsername/). If your changes show up there, you can consider your files submitted.

## Grading criteria

This assignment is worth 100 points total. This is broken down as follows. A more detailed rubric for the assignment is available on Canvas.

  * 30 points: API allows the creation of new users via a `POST /users` endpoint
    * 10 points: API correctly models User entity (e.g. through a Sequelize model or another mechanism)
        * User entity should contain fields listed above
    * 10 points: API contains a `POST /users` endpoint that correctly stores users in the database based on information passed in request body
    * 10 points: API correctly hashes and salts passwords before storing them in the database

  * 30 points: API allows users to log in via a `POST /users/login` endpoint
    * 10 points: API contains a `POST /users/login` endpoint that correctly accepts user credentials in the request body
    * 10 points: API correctly validates provided user credentials against stored user credentials to authenticate users
    * 5 points: API correctly generates a JWT and sends it back to the client when the user successfully authenticates
    * 5 points: API responds with a 401 "Unauthorized" status on unsuccessful authentication attempts

  * 5 points: API has a `GET /users/{userId}` endpoint that returns appropriate data
    * Should return all data about the user except their password
    * You can earn these points without correctly authorizing this endpoint.  Authorization is covered below.

  * 35 points: API correctly requires authentication to perform certain actions, as described above
    * 5 points: All `GET /users/{userId}/...` endpoints can only be used by an authorized user with ID `userId`
    * 5 points: Only authorized users can create businesses, photos, and reviews
      * User/owner ID for created entity must match authorized user ID
    * 5 points: Only authorized users can modify businesses, photos, and reviews
      * User/owner ID for modified entity must match authorized user ID
    * 5 points: Only authorized users can delete businesses, photos, and reviews
      * User/owner ID for deleted entity must match authorized user ID
    * 5 points: Authorized users with `admin` role can perform any action
      * Includes creating content and fetching/modifying/deleting content owned by any user
    * 5 points: Only an authorized user with the `admin` tole can create other users with the `admin role
    * 5 points: All authorized API endpoints respond with an appropriate error response if the logged-in user is not authorized or if no user is logged in

In addition, the assignment for the grad section of the course has the following additional grading criteria, making the grad section's version of the assignment worth 125 points total:

  * 25 points: API server correctly implements HTTPS
    * All requests to every one of the API endpoints should be able to use HTTPS.

Anyone from either section of the course can earn 10 points of extra credit as described above.
