var assert = require("assert");
var Connection = require("../js/Connection.js");

var mockConnection = (function () {
    this.property = "a dummy value";
    this.close = function () {};
})

var mockChannel = (function (id) {
    this.id = id || 1;
    this.label = ""+id || "1";
    this.readyState = "open";
    this.send = function (message) {};
    this.close = function () {
        this.readyState = "closed";
        this.onclose();
    }
    this.onmessage = function (event) {};
    this.onerror = function (event) {};
    this.onclose = function (event) {};

    this.fireOnMessage = function (prefix, json) {
        json = json || null;
        this.onmessage({"data": prefix + JSON.stringify(json)});
    }
    this.fireOnClose = function () {
        this.readyState = "closed";
        this.onclose();
    }
});



describe('Connection', function () {
    var connection;
    afterEach(function () {
        connection.clearTimeouts();
    })
    describe('#constructor', function () {
        it('should return object', function () {
            var rtc_connection = new mockConnection();
            var rtc_channel = new mockChannel(1);
            connection = new Connection(rtc_connection, rtc_channel);
            assert.equal(typeof(connection), 'object');
        })
        it('should expose rtc connection and rtc channel', function () {
            var rtc_connection = new mockConnection();
            var rtc_channel = new mockChannel(1);
            connection = new Connection(rtc_connection, rtc_channel);
            assert.deepEqual(connection.rtcConnection, rtc_connection);
            assert.deepEqual(connection.rtcChannel, rtc_channel);
        })

        it('should set expire and heartbeat timeouts', function () {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 50;
            var heartbeatTimeoutDuration = 40;
            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);
            assert.equal(connection.expireTimeout._idleTimeout, expireTimeoutDuration);
            assert.equal(connection.heartbeatTimeout._idleTimeout, heartbeatTimeoutDuration);
        })
    })

    describe('#close', function () {
        it('should cause channel state closed and fire onclose', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 10;
            var heartbeatTimeoutDuration = 3;

            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);
            connection.onclose = function (event) {
                assert.equal(connection.rtcChannel.readyState, "closed");
                done();
            }
            setTimeout(function () {
                assert.equal(connection.rtcChannel.readyState, "open");
                connection.close();
            }, 7);

            this.timeout(50);
        })
    })

    describe('#timeouts', function () {
        it('should close channel and fire onclose when expireTimeout fires', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 10;
            var heartbeatTimeoutDuration = 3;

            var channel_is_closed = false;

            rtc_channel.onclose = function () {
                assert.equal(connection.rtcChannel.readyState, "closed");
                assert.equal(connection.heartbeatTimeout._idleTimeout, -1);
                assert.equal(connection.expireTimeout._idleTimeout, -1);
                channel_is_closed = true;
            }
            setTimeout(function () {
                assert.equal(connection.rtcChannel.readyState, "open");
            }, expireTimeoutDuration - 5);

            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);
            connection.onclose = function () {
                assert.equal(channel_is_closed, true);
                done();
            }

            this.timeout(50);
        })

        it('should send heartbeat and reset queue new heartbeatTimeout when heartbeatTimeout fires', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 10;
            var heartbeatTimeoutDuration = 3;

            rtc_channel.send = function (message) {
                // Check that a heartbeat message is being sent
                assert.equal(message.charAt(0), "h");

                // Check that expireTimeout is intact
                assert.equal(connection.expireTimeout._idleStart, initial_timers_start);

                // Check that new heartbeatTimeout has been added
                assert.equal(connection.heartbeatTimeout._idleStart > initial_timers_start, true);

                // Check that expire has not fired
                assert.equal(connection.rtcChannel.readyState, "open");
                done();
            }
            var initial_timers_start = Date.now();
            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);
            this.timeout(50);
        })

        it('should not fire more heartbeatTimeout when expireTimeout has fired', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 10;
            var heartbeatTimeoutDuration = 3;

            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);
            connection.onheartbeat = function () {
                assert.equal(true, false);
            }
            setTimeout(function () {
                assert.equal(connection.rtcChannel.readyState, "closed");
                done();
            }, 3*expireTimeoutDuration);

            this.timeout(50);
        })

        it('should extend expireTimeout and fire onmessage when receiving messages', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 10;
            var heartbeatTimeoutDuration = 3;

            var initial_expireTimeout_idleStart = Date.now();
            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);
            connection.onmessage = function (prefix, body) {
                assert.equal(prefix, "h");
                assert.equal(connection.expireTimeout._idleStart > initial_expireTimeout_idleStart, true);
            }

            setTimeout(function () {
                connection.rtcChannel.fireOnMessage("h");
            }, 5);

            connection.onclose = function () {
                assert.equal(true, false);
            }

            setTimeout(function () {
                assert.equal(connection.rtcChannel.readyState, "open");
                done();
            }, 13);

            this.timeout(50);
        })
    })

    describe('#onmessage', function () {
        it('should parse deep objects correctly', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 10;
            var heartbeatTimeoutDuration = 3;

            var orig_prefix = "d";
            var orig_body = {"foo": [{"bar": "baz"}, 1, "A", [0, 1]]};
            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);

            connection.onmessage = function (prefix, body) {
                assert.equal(prefix, orig_prefix);
                assert.deepEqual(body, orig_body);
                done();
            }
            connection.rtcChannel.fireOnMessage(orig_prefix, orig_body);
            this.timeout(50);
        })
    })

    describe('#send', function () {
        it('should return true if conncetion is open; false if expired', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 10;
            var heartbeatTimeoutDuration = 3;

            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);

            setTimeout(function () {
                assert.equal(connection.rtcChannel.readyState, "open");
                assert.equal(connection.send("d", "foobar"), true);
            }, 5);

            setTimeout(function () {
                assert.equal(connection.rtcChannel.readyState, "closed");
                assert.equal(connection.send("d", "foobar"), false);
                done();
            }, 12);
        })

        it('should cause heartbeatTimeout to reset', function (done) {
            var rtc_channel = new mockChannel(1);
            var expireTimeoutDuration = 15;
            var heartbeatTimeoutDuration = 5;

            connection = new Connection(new mockConnection(), rtc_channel, expireTimeoutDuration, heartbeatTimeoutDuration);
            assert.equal(connection.heartbeatTimeout._idleStart, Date.now());

            setTimeout(function () {
                var success = connection.send("d", {});
                var now = Date.now();
                assert.equal(success, true);
                assert.equal(connection.heartbeatTimeout._idleStart, now);
            }, 4)

            setTimeout(function () {
                var success = connection.send("d", {});
                var now = Date.now();
                assert.equal(success, true);
                assert.equal(connection.heartbeatTimeout._idleStart, now);
                done();
            }, 8);

            this.timeout(20);
        })
    })

})
