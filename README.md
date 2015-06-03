# About
Code related to my msc thesis.

# Setting up and running the server
    cd server/
    npm install
    node src/server.js 

# Running the client
Requires a running server.
The different parts can be accessed through the following URLs:

- viewer @ `http://localhost:2000/`
- broadcaster @ `http://localhost:2000/broadcaster.html`
- test application:
    - experiment A (churn)  @ `http://localhost:2000/a.html`
    - experiment B (stable) @ `http://localhost:2000/b.html`

Configuration can be done through the following files

General parameter defaults:
    client/js/Parameters.js     
    
Broadcaster overwrites: change stream type (dummy, whammy encoded), fanout, etc.
    client/broadcaster.html 
Viewer overwrites: overwrite ideal peer count, set dummy delay on connections, etc.
    client/index.html       

# Tests
Tests are written using mocha
See [documentation](http://mochajs.org/) for more info.

## Install mocha
    npm install -g mocha // (might require sudo)

## Run client tests:
    cd client/
    mocha

## Run server tests
    cd server/
    mocha
