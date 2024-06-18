# Assignment 1

**Assignment due at 11:59pm on Monday 4/22/2024**<br/>
**Demo due by 11:59pm on Monday 5/6/2024**

The goals of this assignment are to practice designing and implementing a RESTful API from an application description and to containerize your API using Docker.  The assignment has a few different parts, which are outlined below.

## 0. Familiarize yourself with Ed Discussion

This first part of this assignment is simple and doesn't involve coding.  Just visit our course forum on Ed Discussion and familiarize yourself with that platform.  You don't even have to post anything.  Just visit the forum so Ed registers you as being active there.

You can find a link to our Ed forum both on the course website and in Canvas within the course navigation bar for our course.  Most of you should already be automatically enrolled in our course on Ed with your @oregonstate.edu email address.  However, if you have trouble connecting to our course forum there, please catch up with me after lecture or drop into my office hours, and I’ll make sure you’re able to log in.

We'll be using Ed as our main communication platform for the course.  Ed is essentially a StackOverflow-style Q&A forum, where you can ask questions and answer your classmates’ questions.  Please use Ed exclusively for questions you have about the course, so all our course Q&A can live in one central, easily accessible place.  I (Hess) and the TAs will be on Ed, just like you and your fellow students, so you can feel confident about getting the answers you need there.

I strongly encourage you to also spend time answering your fellow classmates’ questions on Ed. This will not only enable everyone to get help quickly, but it will also help you improve your understanding of the material, since teaching someone else is the best way to learn something.  **As an extra incentive to answer questions on Ed, extra credit will be awarded to the most active Ed participants at the end of the course** (based on analytics tracked by Ed).

## 1. Design and implement a RESTful API for a Yelp-like application

Your main task for this assignment is to design and implement a RESTful API for a Yelp-like application.  This application will specifically be centered around businesses and user reviews of businesses in US cities.  The API you implement should support the following resources and actions:

### Businesses

  * Users who own businesses should be able to add their businesses to the application.  When a business owner adds their business they will need to include the following information:
    * Business name
    * Business street address
    * Business city
    * Business state
    * Business ZIP code
    * Business phone number
    * Business category and subcategories (e.g. category "Restaurant" and subcategory "Pizza")

    The following information may also optionally be included when a new business is added:
      * Business website
      * Business email

  * Business owners may modify any of the information listed above for an already-existing business they own.

  * Business owners may remove a business listing from the application.

  * Users may get a list of businesses.  The representations of businesses in the returned list should include all of the information described above.  In a later assignment, we will implement functionality to allow the user to list only a subset of the businesses based on some filtering criteria, but for now, assume that users will only want to fetch a list of all businesses.

  * Users may fetch detailed information about a business.  Detailed business information will include all of the information described above as well as reviews of the business and photos of the business (which we discuss below).

### Reviews

  * Users may write a review of an existing business.  A review will include the following information:
    * A "star" rating between 0 and 5 (e.g. 4 stars)
    * An "dollar sign" rating between 1 and 4, indicating how expensive the business is (e.g. 2 dollar signs)
    * An optional written review

  * Users may modify or delete any review they've written.

### Photos

  * Users may upload image files containing photos of an existing business.  Each photo may have an associated caption.

  * Users may remove any photo they've uploaded, and they may modify the caption of any photo they've uploaded.

### Data by user

  * Users may list all of the businesses they own.

  * Users may list all of the reviews they've written.

  * Users may list all of the photos they've uploaded.

**Make sure to read below for additional design and implementation requirements for your API.**

## 2. Create a prepared suite of requests to test your API

Once your API server is implemented (or, preferably, as you're implementing your server), your next task is to implement a suite of API requests to demonstrate the complete functionality of your API.  In particular, you should implement at least one request per API endpoint.  Each request can be very simple in nature, simply formulating an API request and displaying the response.  You *do not* need to perform any validation of the response you get back from the API.  For example, your test does not need to programmatically verify that the API response has a particular status code or that it contains correct data in the response body.  Instead, you can rely on simply displaying the response, and you can manually validate it by looking at it.

You may use any HTTP client you like to write these API requests.  I would recommend [Postman](https://www.postman.com/), which is the client I'll use during lectures, but [Insomnia](https://insomnia.rest/), [cURL](https://curl.haxx.se/), and other tools would also work.  So that the TA has these requests available to run when grading your assignment, you should commit and push a representation of them to your assignment repository on GitHub (e.g. by exporting them from Postman or Insomnia or by writing and committing a shell script with cURL commands).

## 3. Containerize your server using Docker

Your last task for this assignment is to write a Dockerfile that packages the API server you wrote into a Docker image along with all of the server's runtime dependencies.  Containers launched from this image should automatically start the server listening on a specified port, and you should be able to successfully make requests to the containerized server from the outside world (e.g. from your host machine).

## CS 599 only: Document your API using the OpenAPI spec

This assignment's challenge for students in the grad section of the course is to write documentation of your API using the [OpenAPI Specification](https://spec.openapis.org/oas/latest.html).  Documentation of an API is crucial for developers of API clients to understand how to use the API.  The OpenAPI Specification provides a standardized format for documenting a RESTful API, and [a number of tools](https://swagger.io/tools/open-source/) exist that can process an OpenAPI description to generate user-friendly API documentation or even to automatically generate server stubs and client libraries.

If you are in the grad section of the course, you must write an OpenAPI description of the API you designed and implemented above.  The definition should be complete, i.e. it should capture the behavior of each of your API's endpoints.  You may use either YAML or JSON to write your description.  Once your description is written, you should be able to use it to generate user-friendly documentation using either the [Swagger Editor](https://editor.swagger.io/) or the [Swagger UI tool](https://swagger.io/tools/swagger-ui/).

Note that the OpenAPI Specification link above is to the official documentation of the OpenAPI Specification, which, though complete, is perhaps not the easiest way for a beginner to learn how to use the OpenAPI Specification.  Here are some more user-friendly forms of documentation for the OpenAPI Specification:
  * [The SmartBear OpenAPI Tutorial](https://support.smartbear.com/swaggerhub/docs/en/get-started/openapi-3-0-tutorial.html)
  * [The OpenAPI Initiative's OpenAPI Guide](https://learn.openapis.org/)

## API design requirements

As you're designing your API, make sure to follow the best practices we're discussing in lecture, etc.  In particular, you'll need to think about the following:
  * What URL and HTTP method should represent each API method
  * What the request and/or response bodies should look like for the relevant API methods
  * What status code(s) each API method should use in its responses
  * Which API responses should be paginated
  * Which API responses should include HATEOAS links to other API resources (i.e. how your API will implement HATEOAS)

## API implementation requirements

After you've designed your API, you'll implement a server for it using Node.js and Express.  Your API implementation should meet the following requirements:

  * Your API server should implement a route for each element of the API functionality described above.

  * Any API endpoint with a parameterized route should perform basic verification of the specified route parameters.  For example, if you have a route with a parameter representing the ID of a specific business, you should verify that the ID is valid.

  * Any API endpoint that takes a request body should perform basic verification of the data provided in the request body.  You example, if one of your endpoints requires a request body that contains a business name and a business address, you should verify that those two fields are present in the request body.  More complex validation (e.g. verifying that a string is a valid URL or email address) is not required.

  * Each API endpoint should respond with an appropriate HTTP status code and, when needed, a response body.

  * API endpoints should have paginated responses where appropriate.

  * Your server should run on the TCP port specified by the `PORT` environment variable.

  * You should be able to launch your server using the command `npm start`.

## Application data

So you don't have to worry about generating and storing application data for your API, some simple application data is provided for you in the `data/` directory of this project.  Specifically, there are three separate JSON files respectively containing business, photo, and review data.  Use this data to bootstrap your API.  You should be able to directly import the JSON data using `require()`, e.g.:
```js
const businesses = require("./data/businesses.json")
```

**Importantly, do not worry about writing data back to these JSON files.**  The purpose of this assignment is not to set up a complex JSON-based data storage mechanism, but to practice designing and implementing the routes of an API.

## Submission

We'll be using GitHub Classroom for this assignment, and you will submit your assignment via GitHub.  Just make sure your completed files are committed and pushed by the assignment's deadline to the main branch of the GitHub repo that was created for you by GitHub Classroom.  A good way to check whether your files are safely submitted is to look at the main branch your assignment repo on the github.com website (i.e. https://github.com/osu-cs493-599-sp24/assignment-1-YourGitHubUsername/). If your changes show up there, you can consider your files submitted.

## Grading criteria

The base assignment is worth 100 points total.  This is broken down as follows.  A more detailed rubric for the assignment is available on Canvas.

  * 20 points: Successfully logged in to the CS 493/599 forum on Ed Discussion.
    * There’s no need to post anything, just log in.  This will be verified based on whether you are marked as “active” in Ed’s analytics at the assignment deadline.
    * This part of the grade is all-or-nothing.  You will earn 0/20 points if you don’t log in.

  * 60 points: Submission successfully implements API server as described above.
    * 20 points: API implementation contains endpoints supporting all actions described above.
      * Endpoints to not have to behave correctly to earn these points.  You just need an endpoint clearly corresponding to each action.
    * 15 points: All API endpoints use appropriate URLs and HTTP methods.
      * URLs should clearly indicate what kind(s) of resource the API endpoint operates on.
      * URLs should not be overly complex.  They should have a maximum of 3 segments unless it's absolutely necessary to have more.
      * URLs should contain parameters when appropriate.
      * Semantics associated with chosen HTTP methods should match the action being performed by the endpoint.
    * 15 points: All API endpoints use appropriate data representations.
      * Data representations in both API requests and API responses should be structured as simply as possible while still containing all relevant data.
      * Incoming data should be validated before use (e.g. you should make sure required fields are present in request bodies).
      * Outgoing data should be paginated when appropriate.
    * 10 points: API performs appropriate error handling.
      * API should respond with an appropriate HTTP status code and error message when some kind error occurs.

  * 10 points: Submission contains a suite of requests to test your API.
    * See above for more details.  For example, you do not need to programmatically validate data, just generate requests and display responses for manual validation.
    * Request suite can be written using any appropriate HTTP client, e.g. Insomnia, Postman, cURL, etc.

  * 10 points: Submission contains a correctly Dockerized version of the API server.
    * A Dockerfile is included that can be used to build a Docker image containing the API server and all of its dependencies.
    * Containers launched from the built image should successfully run the API, correctly receiving and handling requests, etc.

In addition, the assignment for the grad section of the course has the following additional grading criteria, making the grad section's version of the assignment worth 125 points total:

  * 25 points: A complete OpenAPI description is written for the API.
    * The description should include all behaviors of all API endpoints.
    * It should be possible to enter the description into the Swagger Editor or the Swagger UI tool to generate complete user-friendly documentation for the API.
