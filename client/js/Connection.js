'use strict'

var Connection = (function (rtcConnection, rtcChannel, expireTimeoutDuration, heartbeatTimeoutDuration, scoreDecayInterval) {
    var self = this;

    // crashes tests since btoa is not defined in nodejs
    if (typeof(btoa) === "function") {
        this.id = btoa(""+parseInt(Math.random()*100000000)+ (""+Date.now()).substr(-6));
    }
    this.rtcConnection = rtcConnection;
    this.rtcChannel = rtcChannel;
    this.score = 4;
    this.coordinate = null;

    /*
    this.scoreTimer = setInterval(function () {
        self.reduceScore();
    }, scoreDecayInterval);
    */

    this.increaseScore = function () {
        this.score++;
        this.onScoreChange();
    };
    this.reduceScore = function () {
        this.score = Math.max(this.score/2, 1);
        this.onScoreChange();
    };
    this.onScoreChange = function (score) {};

    this.rtcChannel.onmessage = function (event) {
        clearTimeout(self.expireTimeout);
        self.expireTimeout = setTimeout(function () { self._onexpire() }, expireTimeoutDuration);

        // Handle arrayBuffers
        if (Object.prototype.toString.call(event.data) === "[object ArrayBuffer]") {
            //var header = new Uint8Array(event.data, 0, Chunk.HEADER_BYTE_LENGTH)
            var data = new Uint8Array(event.data);
            self.onbinarymessage(data);
        }
        // Handle strings
        else {
            var prefix = event.data.charAt(0);
            var body = event.data.substr(1) || "null";
            self.onmessage(prefix, JSON.parse(body));
        }
    }

    var expireTimeoutDuration = expireTimeoutDuration || 10000;
    var heartbeatTimeoutDuration = heartbeatTimeoutDuration || 3000;
    this.expireTimeout = setTimeout(function () { self._onexpire() }, expireTimeoutDuration);
    this.heartbeatTimeout = setTimeout(function () { self._onheartbeat() }, heartbeatTimeoutDuration);

    this._onexpire = function (event) {
        this.clearTimeouts();
        self.rtcChannel.close();
        self.rtcConnection.close();
        this.onclose();
    };
    this._onheartbeat = function (event) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = setTimeout(function () { self._onheartbeat() }, heartbeatTimeoutDuration);
        self.send("h", self.id);
    };


    this.clearTimeouts = function () {
        //clearInterval(this.scoreTimer);
        clearTimeout(this.expireTimeout);
        clearTimeout(this.heartbeatTimeout);
    }

    this.send = function (prefix, json) {
        if (this.rtcChannel.readyState === "open") {
            json = json || null;
            this.rtcChannel.send(prefix + JSON.stringify(json));

            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = setTimeout(function () { self._onheartbeat() }, heartbeatTimeoutDuration);
            return true;
        }
        return false;
    }

    this.sendArrayBuffer = function (arrayBuffer) {
        if (this.rtcChannel.readyState === "open") {
            this.rtcChannel.send(arrayBuffer);
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = setTimeout(function () { self._onheartbeat() }, heartbeatTimeoutDuration);
            return true;
        }
        return false;
    }

    this.close = function () {
        this._onexpire();
    }
    this.onclose = function (event) {}
    this.onmessage = function (prefix, json) {}
    this.onbinarymessage = function (data) {}
});

var module = module || {};
module.exports = Connection;
