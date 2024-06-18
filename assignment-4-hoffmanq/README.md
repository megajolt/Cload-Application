# Assignment 4

**Assignment due at 11:59pm on Monday 6/4/2024**<br/>
**Demo due by 5:00pm on Friday 6/14/2024**

The goal of this assignment is to incorporate file storage into our API and to start using RabbitMQ to perform some basic offline data enrichment.  There are a few parts to this assignment, described below.

You are provided some starter code in this repository that uses MongoDB as a backing to implement a reduced subset of the businesses API we've been working with all term.  The starter code contains the following components:
  * An API server is implemented in `server.js`.
  * Individual API routes are modularized within the `api/` directory.
  * Sequelize models are implemented in the `models/` directory.
  * A script in `initDb.js` that populates the database with initial data from the `data/` directory.  You can run this script by running `npm run initdb`.

Feel free to use this code as your starting point for this assignment.  You may also use your own solution to assignment 2 and/or assignment 3 as your starting point if you like.

## 1. Support photo file uploads

Your first task for the assignment is to modify the `POST /photos` endpoint to support actual photo uploads.  Specifically, you should update this endpoint to expect a multipart form-data body that contains a `file` field in addition to the fields currently supported by the endpoint (`businessId` and `caption`).  In requests to this endpoint, the `file` field should specifically contain raw binary data for an image file.  The endpoint should accept images in either the JPEG (`image/jpeg`) or PNG (`image/png`) format.  Files in any other format should result in the API server returning an error response.

## 2. Store uploaded photo data and make photos available to download

Once your API successfully accepts image file uploads to the `POST /photos` endpoint, you should make sure photo data is being correctly stored by the API.  Photo files themselves can be stored in the API server's filesystem.  Photo metadata (e.g. the `businessId` and `caption` associated with the photo) should be stored in the database.

Once a photo has been uploaded and its information properly stored, you should make it available for download via a URL with the following format, where `{filename}` represents the assigned filename of the photo and the file extension (`.jpg` or `.png`) is based on the format of the uploaded image:
```
/media/photos/{filename}.jpg
```
OR
```
/media/photos/{filename}.png
```
Make sure to include this URL in responses from the `GET /photos/{id}` endpoint, so clients will know how to download the image.

## 3. Add an offline thumbnail generation process

Your final task in the assignment is to add an offline data enrichment process that generates a 100x100 thumbnail version of every photo uploaded to the API.  This offline data enrichment process should be facilitated using a RabbitMQ queue.  This task can be broken into a few separate steps:

  * **Start a RabbitMQ daemon running in a Docker container.**  You can do this with the [official RabbitMQ Docker image](https://hub.docker.com/_/rabbitmq/).

  * **Turn your API server into a RabbitMQ producer.**  Specifically, each time a new photo is uploaded and stored into your GridFS database, your API server should add a new task to a RabbitMQ queue corresponding to the new photo that was just uploaded.  The task should contain information (e.g. the database ID associated with the just-uploaded photo) that will eventually allow RabbitMQ consumers (which you'll write) to locate the original image file and update data for the photo in the database.

  * **Implement a RabbitMQ consumer that generates thumbnail images.**  Your consumer should specifically use information from each RabbitMQ message it processes to fetch a photo file from GridFS and generate a resized and/or cropped thumbnail version of that photo that is 100px wide and 100px high.  All thumbnail images should be in JPEG format (i.e. `image/jpeg`).

    Thumbnail images should be stored in the API server's filesystem in a *different* directory than the one where original images are stored.  **However, the thumbnail image should have the same filename as the original image** (making sure to use a `.jpg` extension if the original image was a PNG).

    There are multiple packages on NPM you can use to actually perform the image resizing itself, including [Jimp](https://www.npmjs.com/package/jimp) and [sharp](https://www.npmjs.com/package/sharp).  Each of these has a straightforward interface.  However, you're free to use whatever tool you like to perform the resizing.

  * **Record the path of the thumbnail in the database.**  After your RabbitMQ consumer generates a thumbnail image and stores it, you'll need to store its path so you can "find" the thumbnail from the original image.  In other words, once the thumbnail is generated and stored, you'll need to store update the database record for the original photo in the database to contain the path of the thumbnail.  For example, you could add a `thumbPath` field to the original photo's metatata:
    ```
    {
      "businessId": ObjectId("..."),
      "caption": "...",
      "thumbPath": "/path/to/thumbnail.jpg"
    }
    ```

    Doing this will allow you to easily access the thumbnail image once you've fetched the metadata for the original photo.

  * **Make the thumbnails available for download.**  Finally, once thumbnails are generated and linked to their originals, you should make it possible for clients to download them.  Thumbnails should be downloadable through a URL with the following format, where `{filename}` is the filename of both the *original* photo and the thumbnail:
    ```
    /media/thumbs/{filename}.jpg
    ```
    To facilitate downloading a photo's thumbnail, the thumbnail's URL should be included in the response from the `GET /photos/{id}` endpoint.

    **Again, it's important that the same filename should be used to download both the original photo and its thumbnail.**  For example the following requests should fetch a the original photo and the thumbnail for the same image:
    ```
    GET /media/photos/5ce48a2ddf60d448aed2b1c1.jpg
    GET /media/thumbs/5ce48a2ddf60d448aed2b1c1.jpg
    ```

When your consumer is working correctly, you should be able to launch one or more instances of the consumer running alongside your API server, the RabbitMQ daemon, and the MongoDB server, and you should be able to see the consumers processing photos as they're uploaded.  Note that only the RabbitMQ daemon and the MongoDB server need to be run within Docker containers.  The API server and RabbitMQ consumer(s) can run either in Docker or directly on your host machine.

## CS 599 only: run the entire application through Docker Compose

This assignment's challenge for students in the grad section of the course is to create a [Docker Compose](https://docs.docker.com/compose/) specification that allows you to start the entire application from scratch with a single command.  Docker Compose is a tool that allows you to define and run a multi-container application.  This can be very useful for complex applications with several different services each running in containers because it allows you to avoid the meticulous manual creation and maintenance of all those containers.  Instead, an application with a Docker Compose specification can be launched from scratch with a single command:
```
docker-compose up
```
Because this application has become fairly complex, with several different services running alongside each other, it is a good candidate for a Docker Compose specification.

If you're in the grad section of the course, you must create a Docker Compose specification that can be used to launch the application.  Your Docker Compose specification must satisfy the following criteria:
  * Your Docker Compose specification must capture all elements of the application, including the API server, the database server, the RabbitMQ server, and the thumbnail-generating RabbitMQ consumer.
  * You should be able to launch the entire application with a single invokation of `docker-compose up`.
  * You should be able to communicate with your API server from the outside world, so you'll need to publish a port on the API server container.  All other containers should be reachable only internally through a Docker network.

Here are a few considerations you'll want to keep in mind to get your Docker Compose specification to work:
  * The starter code contains a Dockerfile that you can use to build a Docker image for the API server.  With appropriate options specified in the Docker Compose specification, it may also be possible to use the same Docker image to run the RabbitMQ consumer.  However, you may also write a separate Dockerfile to build an image for the consumer.
  * The API server and the thumbnail-generating RabbitMQ consumer will both need access to the photo files that are uploaded to the API.  You will need to figure out how to make this work when both of these services are running in separate containers.
  * Problems can arise if you try to connect to the database server before it is initialized and ready for connections.  You may need to add a [health check](https://docs.docker.com/compose/compose-file/05-services/#healthcheck) that allows you to know when the database server is ready for connections before you try to connect to it from the API server.
  * It is possible to provide startup scripts to perform initialization within the container launched by the `mongo` image.  See "Initializing a fresh instance" under [the documentation for that image](https://hub.docker.com/_/mongo).  A lower-privileged MongoDB user can be created this way.

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

We'll be using GitHub Classroom for this assignment, and you will submit your assignment via GitHub.  Just make sure your completed files are committed and pushed by the assignment's deadline to the main branch of the GitHub repo that was created for you by GitHub Classroom.  A good way to check whether your files are safely submitted is to look at the main branch your assignment repo on the github.com website (i.e. https://github.com/osu-cs493-sp24/assignment-4-YourGitHubUsername/). If your changes show up there, you can consider your files submitted.

## Grading criteria

This assignment is worth 100 total points, broken down as follows:

  * 20 points: API has a `POST /photos` endpoint that supports image uploads through multipart formdata request bodies
    * 5 points: `POST /photos` endpoint correctly accepts multipart formdata bodies
    * 5 points: Image file data is correctly extracted from multipart formdata bodies
    * 5 points: Only JPG and PNG image files are accepted by `POST /photos`
    * 5 points: Non-file fields `businessId` and `caption` are correctly handled by `POST /photos`

  * 20 points: API correctly stores uploaded images and their metadata and makes them available for download
    * 5 points: Photo files are stored in the filesystem with an appropriate extension based on their file type
    * 5 points: `GET /photos/{id}` and `GET /businesses/{id}` correctly retrieve relevant photo meta data from the database (including download URL)
    * 10 points: Photo files can be downloaded through `GET /media/photos/{filename}.png` or `GET /media/photos/{filename}.jpg`

  * 60 points: API correctly uses an offline process powered by RabbitMQ to generate thumbnail images for all uploaded photos
    * 10 points: API server correctly generates a RabbitMQ task each time a photo is uploaded
    * 10 points: Offline process correctly consumes RabbitMQ tasks and reads photo files from the filesystem
    * 10 points: Offline process correctly generates a 100x100 thumbnail image of each uploaded photo
    * 10 points: Offline process correctly stores thumbnail images in a separate location from original photos
    * 5 points: Thumbnail info (e.g. URL) correctly included in photo metadata retrieved from `GET /photos/{id}`
    * 10 points: Thumbnail image files can be downloaded through `GET /media/thumbs/{filename}.jpg`
    * 5 points: `{filename}` in `GET /media/thumbs/{filename}.jpg` matches `{filename}` used in `GET /media/photos/{filename}.jpg`

In addition, the assignment for the grad section of the course has the following additional grading criteria, making the grad section's version of the assignment worth 125 points total:

  * 25 points: A Docker Compose specification is implemented to launch the application, as described above
    * It should be possible to launch the entire application from scratch via a single call to `docker-compose up`.
