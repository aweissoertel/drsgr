# Destination Recommender System for Group Recommendations (drsgr)

Repository for the front and back end of a destination recommender system. This application was implemented for a Master Thesis at [TUM](https://www.tum.de/) with the title "Extending a Web-based Destination Recommender System for Group Recommendations".
It is extending a [recommender system](https://github.com/asalnesar/destination-finder) developed for a single user.


## Demo

A demo of the interface is available on https://group-travel.fly.dev/

## Getting Started

To run the system yourself, clone it and install [node](https://nodejs.org/en/download) (if not already available).

### Install Dependencies

Inside the cloned directory, run

```
npm install
```

### Run the Application

This project uses `vite-express` to run the front end and back end simultaneously. Therefore, a single command is enough to run the development server:

```
npm start
```

Now browse to the app at http://localhost:8080/.

In order to run the frontend alone, run

```
npm run frontend
```

### Building

An optimized version can be built with

```
npm run build
```

You can run `npm run prod` afterwards in order to spawn a node process, which serves the frontend and runs the backend, which is what happens in the deployed version.<br/>
Alternatively, you can use the Dockerfile in this project.
