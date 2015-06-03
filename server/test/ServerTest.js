/*
'use strict'

var assert = require("assert");

var ConnectionManager = require("../src/ConnectionManager.js");
var Server = require("../src/server.js");





describe('Server', function () {
    var mockDispatcher = (function () {
        return {
            sendBootstrapChannels: function (socket, message) { socket.emit("bootstrap_channels", message); },
            sendSignal: function (socket, message) { socket.emit("signaling", message); }
        }
    });

    var mockIOConnection = (function (id) {
        return {
            id: id,
            emit: function () {}
        }
    })

    var mockMessage = (function (type, channel_id) {
        return {"_type": type, "_channel_id": channel_id};
    })
    describe('#constructor', function () {
        it('should return object', function () {
            var server = new Server(new mockDispatcher());
            assert.equal(typeof(server), 'object');
        })
    })

    describe('dispatcher#onBootstrap', function () {
        it('should add node to manager', function () {
            var server = new Server(new mockDispatcher);

            assert.equal(typeof(server.dispatcher.onBootstrap), "function");
            assert.equal(server.connections.size(), 0);

            var socket = new mockIOConnection("id");

            server.dispatcher.onBootstrap(socket, "");
            assert.equal(server.connections.size(), 1);
        })
        it('should send response containing bootstrap nodes', function (done) {
            var server = new Server(new mockDispatcher);
            var mocksocket = new mockIOConnection("id");

            mocksocket.emit = function (subject, message) {
                assert.deepEqual(subject, "bootstrap_channels");
                assert.deepEqual(JSON.parse(message).channels, []);
                done();
            }


            server.dispatcher.onBootstrap(mocksocket, "");
        })
        it('should send numerous bootstrap nodes if available', function (done) {
            var server = new Server(new mockDispatcher);
            var alice = new mockIOConnection("alice");
            var bob = new mockIOConnection("bob");
            var carol = new mockIOConnection("carol");

            var alice_bootstrap_done = false;
            var bob_bootstrap_done = false;

            alice.emit = function (subject, message) {
                assert.deepEqual(JSON.parse(message).channels, []);
                alice_bootstrap_done = true;
            }

            bob.emit = function (subject, message) {
                assert(alice_bootstrap_done);
                assert.deepEqual(subject, "bootstrap_channels");

                var channels = JSON.parse(message).channels;
                assert.equal(channels.length, 1);
                var peer = channels[0];
                assert(peer.hasOwnProperty("channel_id"));
                assert(peer.hasOwnProperty("coordinate"));
                assert.equal(peer.channel_id, 1);
                bob_bootstrap_done = true;
            }


            carol.emit = function (subject, message) {
                assert(alice_bootstrap_done);
                assert(bob_bootstrap_done);
                assert.deepEqual(subject, "bootstrap_channels");

                var channels = JSON.parse(message).channels;
                assert.equal(channels.length, 2);
                assert.equal(channels[0].channel_id, 2);
                assert.equal(channels[1].channel_id, 3);
                done();
            }

            server.dispatcher.onBootstrap(alice, "");
            server.dispatcher.onBootstrap(bob, "");
            server.dispatcher.onBootstrap(carol, "");
        })
    })

    describe('dispatcher#onSignaling', function () {
        it('should forward _offer to correct receiver with injected coordinate', function (done) {
            var server = new Server(new mockDispatcher);
            var alice = new mockIOConnection("alice");
            var bob = new mockIOConnection("bob");

            server.dispatcher.onBootstrap(alice, "");
            server.dispatcher.onBootstrap(bob, ""); // should get bootstrap nodes [{cid: 1, x: #, y: #}]

            // Offer from bob to alice
            var offer = JSON.stringify(new mockMessage("offer", 1));

            alice.emit = function (subject, message) {
                assert.equal(subject, "signaling");
                var json = JSON.parse(message);
                assert(json.hasOwnProperty("_coordinate"));
                delete json._coordinate;
                message = JSON.stringify(json);
                assert.equal(message, offer);
                done();
            }

            // bob sends offer to alice (received at server)
            server.dispatcher.onSignaling(bob, offer);
        })
        it('should forward corresponding _answer to correct receiver', function (done) {
            var server = new Server(new mockDispatcher);
            var alice = new mockIOConnection("alice");
            var bob = new mockIOConnection("bob");

            server.dispatcher.onBootstrap(alice, "");
            server.dispatcher.onBootstrap(bob, ""); // should get bootstrap nodes [{cid: 1, x: #, y: #}]

            var answer = JSON.stringify(new mockMessage("answer", 1));

            bob.emit = function (subject, message) {
                assert.equal(subject, "signaling");
                assert.equal(message, answer);
                done();
            }
            server.dispatcher.onSignaling(alice, answer);
        })
    })
})
*/
