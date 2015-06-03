var assert = require("assert");
var ConnectionManager = require("../src/ConnectionManager.js");

describe("CoordinateAwareConnectionManager", function () {

    var Socket = (function (id) {
        this.id = id;
    })

    var alice = new Socket("a");
    var bob = new Socket("b");
    var carol = new Socket("c");
    var darth = new Socket("d");

    describe("#constructor", function () {
        var cm = new ConnectionManager();

        it("should expose array connections", function () {
            assert.equal(Object.prototype.toString.call(cm.connections), "[object Array]");
        })
        it("should expose function add", function () {
            assert.equal(Object.prototype.toString.call(cm.add), "[object Function]");
        })
        it("should expose function remove", function () {
            assert.equal(Object.prototype.toString.call(cm.remove), "[object Function]");
        })
        it("should expose function getParentCandidates", function () {
            assert.equal(Object.prototype.toString.call(cm.getParentCandidates), "[object Function]");
        })
        it("should expose function getChildCandidates", function () {
            assert.equal(Object.prototype.toString.call(cm.getChildCandidates), "[object Function]");
        })
        it("should expose function setupChannel", function () {
            assert.equal(Object.prototype.toString.call(cm.setupChannel), "[object Function]");
        })
        it("should expose function getReceiverInChannel", function () {
            assert.equal(Object.prototype.toString.call(cm.getReceiverInChannel), "[object Function]");
        })
    })

    describe("#add", function () {
        var alice = new Socket("a");
        it("should insert element into connections array", function () {
            var cm = new ConnectionManager();
            assert.equal(cm.connections.length, 0);
            cm.add(alice);
            assert.equal(cm.connections.length, 1);
        })
        it("should wrap added socket in an object containing socket, coordinate and distance properties", function () {
            var cm = new ConnectionManager();
            cm.add(alice);
            assert(cm.connections[0].hasOwnProperty("socket"));
            assert(cm.connections[0].hasOwnProperty("coordinate"));
            assert(cm.connections[0].hasOwnProperty("distance"));

            assert.deepEqual(cm.connections[0].socket, alice);
            assert(cm.connections[0].coordinate.hasOwnProperty("x"));
            assert(cm.connections[0].coordinate.hasOwnProperty("y"));

            assert.equal(Math.sqrt(Math.pow(cm.connections[0].coordinate.x, 2) + Math.pow(cm.connections[0].coordinate.y, 2)), cm.connections[0].distance)
        })

        it("should take x and y as optional parameters for the coordinate", function () {
            var cm = new ConnectionManager();
            cm.add(alice, 3, 4);
            var coordinate = cm.connections[0].coordinate;
            assert.equal(coordinate.x, 3);
            assert.equal(coordinate.y, 4);
            assert.equal(cm.connections[0].distance, 5);
        })

        it("should not chose random coordinate where x or y is less than 1 and no greater than 100 unless forced through optional parameters", function () {
            var used_coordinates = {};
            for (var i = 0; i < 1; i++) {
                var cm = new ConnectionManager();
                cm.add(alice);
                var coordinate = cm.connections[0].coordinate;
                if (JSON.stringify(coordinate) in used_coordinates) {
                    assert(false, "Coordinate was reused in round " + (i+1));
                }
                assert(coordinate.x > 1);
                assert(coordinate.x < 100);
                assert(coordinate.y > 1);
                assert(coordinate.x < 100);
                used_coordinates[JSON.stringify(coordinate)] = i;
            }
        })

        it("should fire onHostAdded callback when socket is added with coordinate 0, 0", function (done) {
            var cm = new ConnectionManager();
            cm.onHostAdded = function (connection) {
                assert.deepEqual(connection.socket, bob);
                done();
            }
            var bob = new Socket("b");
            cm.add(alice);
            cm.add(bob, 0, 0);
        })

        it("should sort connections on ascending distance [ordered insert]", function () {
            var cm = new ConnectionManager();

            cm.add(alice, 0, 0);
            assert.deepEqual(cm.connections[0].socket, alice);
            cm.add(bob, 1, 1);
            assert.deepEqual(cm.connections[0].socket, alice);
            assert.deepEqual(cm.connections[1].socket, bob);
            cm.add(carol, 2, 2);
            assert.deepEqual(cm.connections[0].socket, alice);
            assert.deepEqual(cm.connections[1].socket, bob);
            assert.deepEqual(cm.connections[2].socket, carol);
            cm.add(darth, 3, 3);
            assert.deepEqual(cm.connections[0].socket, alice);
            assert.deepEqual(cm.connections[1].socket, bob);
            assert.deepEqual(cm.connections[2].socket, carol);
            assert.deepEqual(cm.connections[3].socket, darth);
        })
        it("should sort connections on ascending distance [reverse order insert]", function () {
            var cm = new ConnectionManager();

            cm.add(alice, 3, 3);
            assert.deepEqual(cm.connections[0].socket, alice);
            cm.add(bob, 2, 2);
            assert.deepEqual(cm.connections[0].socket, bob);
            assert.deepEqual(cm.connections[1].socket, alice);
            cm.add(carol, 1, 1);
            assert.deepEqual(cm.connections[0].socket, carol);
            assert.deepEqual(cm.connections[1].socket, bob);
            assert.deepEqual(cm.connections[2].socket, alice);
            cm.add(darth, 0, 0);
            assert.deepEqual(cm.connections[0].socket, darth);
            assert.deepEqual(cm.connections[1].socket, carol);
            assert.deepEqual(cm.connections[2].socket, bob);
            assert.deepEqual(cm.connections[3].socket, alice);
        })
        it("should return the added connection", function () {
            var cm = new ConnectionManager();
            var connection = cm.add(alice, 3, 4);
            assert.deepEqual(connection.socket, alice);
            assert.equal(connection.coordinate.x, 3);
            assert.equal(connection.coordinate.y, 4);
            assert.equal(connection.distance, 5);
        })
    })

    describe("#remove", function () {
        it("should remove the connection object and cause array to shrink or return null if not found", function () {
            var cm = new ConnectionManager();

            var _alice = cm.add(alice);
            var _bob = cm.add(bob);
            var _carol = cm.add(carol);
            assert.equal(cm.connections.length, 3);
            assert.deepEqual(cm.remove(alice), _alice);
            assert.equal(cm.connections.length, 2);
            assert.deepEqual(cm.remove(bob), _bob);
            assert.equal(cm.connections.length, 1);
            assert.deepEqual(cm.remove(bob), null);
            assert.equal(cm.connections.length, 1);
        })

        it("should fire onDisconnect callback", function (done) {
            var cm = new ConnectionManager();

            var _alice = cm.add(alice);
            var _bob = cm.add(bob);
            var _carol = cm.add(carol);

            cm.onDisconnect = function (connection) {
                assert.deepEqual(connection, _bob);
                assert.equal(cm.connections.length, 2);
                done();
            }
            cm.remove(bob);
        })
    })

    describe("#getParentCandidates", function () {
        it("should return at most n candidates with distance lower than the connection itself, but not host [handmade]", function () {
            var cm = new ConnectionManager();
            var _alice = cm.add(alice, 0, 0);
            var _bob = cm.add(bob, 1, 1);
            var _carol = cm.add(carol, 2, 2);
            var _darth = cm.add(darth, 3, 3);

            assert.deepEqual(cm.getParentCandidates(_alice), []);
            assert.deepEqual(cm.getParentCandidates( _bob ), []);
            assert.deepEqual(cm.getParentCandidates(_carol), [_bob]);

            var str_candidates = JSON.stringify(cm.getParentCandidates(_darth, 1));
            assert(str_candidates, JSON.stringify([_bob]) || str_candidates, JSON.stringify([_carol]))

            str_candidates = JSON.stringify(cm.getParentCandidates(_darth));
            assert(str_candidates === JSON.stringify([_bob, _carol]) || str_candidates === JSON.stringify([_carol, _bob]));
        })

        it("should return at most n candidates with distance lower than the connection itself, but not host [generated]", function () {
            var cm = new ConnectionManager();
            var host = cm.add(connection, 0, 0);
            for (var i = 0; i < 1000; i++) {
                var connection = cm.add(connection);
                var parents = cm.getParentCandidates(connection).forEach(function (parent) {
                    assert(parent.distance < connection.distance);
                    assert(parent.distance > host.distance);
                });
            }
        })
    })

    describe("#getChildCandidates", function () {
        it("should return at most n candidates with distance higher than the connection itself [handmade]", function () {
            var cm = new ConnectionManager();
            var _alice = cm.add(alice, 0, 0);
            var _bob = cm.add(bob, 1, 1);
            var _carol = cm.add(carol, 2, 2);
            var _darth = cm.add(darth, 3, 3);

            assert.deepEqual(cm.getChildCandidates(_darth), []);
            assert.deepEqual(cm.getChildCandidates(_carol), [_darth]);

            var str_candidates = JSON.stringify(cm.getChildCandidates(_bob, 1));
            assert(str_candidates, JSON.stringify([_carol]) || str_candidates, JSON.stringify([_darth]))

            str_candidates = JSON.stringify(cm.getChildCandidates(_bob));
            assert(str_candidates === JSON.stringify([_darth, _carol]) || str_candidates === JSON.stringify([_carol, _darth]));
        })
        it("should return at most n candidates with distance higher than the connection itself [generated]", function () {
            var cm = new ConnectionManager();
            var host = cm.add(connection, 0, 0);
            for (var i = 0; i < 1000; i++) {
                var connection = cm.add(connection);
                var children = cm.getChildCandidates(connection).forEach(function (child) {
                    assert(child.distance > connection.distance);
                    assert(child.distance > host.distance);
                });
            }
        })
    })

    describe("#setupChannel", function () {
        it("should add to channel object with correct initiator and responder connections", function () {
            var cm = new ConnectionManager();
            var _alice = cm.add(alice);
            var _bob = cm.add(bob);
            var channel_id = cm.setupChannel(_alice, _bob, 20);
            assert(cm.channels[channel_id].hasOwnProperty("initiator"));
            assert.deepEqual(cm.channels[channel_id].initiator, _alice);
            assert(cm.channels[channel_id].hasOwnProperty("responder"));
            assert.deepEqual(cm.channels[channel_id].responder, _bob);
        })
        it("should expire and be deleted after given duration", function (done) {
            var cm = new ConnectionManager();
            var _alice = cm.add(alice);
            var _bob = cm.add(bob);
            var channel_id = cm.setupChannel(_alice, _bob, 20);

            assert(cm.channels[channel_id].hasOwnProperty("initiator"));
            assert.deepEqual(cm.channels[channel_id].initiator, _alice);
            assert(cm.channels[channel_id].hasOwnProperty("responder"));
            assert.deepEqual(cm.channels[channel_id].responder, _bob);

            setTimeout(function () {
                assert.equal(cm.channels[channel_id], undefined);
                done();
            }, 25);
        })
    })

    describe("#getReceiverInChannel", function () {
        it("should return responder socket when request is sent from initiator", function () {
            var cm = new ConnectionManager();
            var _alice = cm.add(alice);
            var _bob = cm.add(bob);
            var channel_id = cm.setupChannel(_alice, _bob, 20);
            assert.deepEqual(cm.getReceiverInChannel(channel_id, alice), _bob);
        })
        it("should return initiator socket when request is sent from responder", function () {
            var cm = new ConnectionManager();
            var _alice = cm.add(alice);
            var _bob = cm.add(bob);
            var channel_id = cm.setupChannel(_alice, _bob, 20);
            assert.deepEqual(cm.getReceiverInChannel(channel_id, bob), _alice);
        })
        it("should return null if channel does not exist or socket is not in channel", function () {
            var cm = new ConnectionManager();
            var _alice = cm.add(alice);
            var _bob = cm.add(bob);
            var channel_id = cm.setupChannel(_alice, _bob, 20);
            assert.deepEqual(cm.getReceiverInChannel(channel_id, carol), null);
            assert.deepEqual(cm.getReceiverInChannel(channel_id+1, bob), null);
        })
    })
})
