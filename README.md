# About
Code related to my msc thesis.

# Measurements
The measurements are found in the `reporting/` directory and they have been processed using the `plots.py` script.

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

- `client/js/Parameters.js` - General parameter defaults
- `client/broadcaster.html` - Broadcaster overwrites; change stream type (dummy, whammy encoded), fanout, etc.  
- `client/index.html` - Viewer overwrites; overwrite ideal peer count, set dummy delay on connections, etc.  

# Tests
Tests are written using mocha
See [documentation](http://mochajs.org/) for more info.

## Install mocha
    npm install -g mocha

This step might require sudo

## Run client tests:
    cd client/
    mocha

## Run server tests
    cd server/
    mocha
