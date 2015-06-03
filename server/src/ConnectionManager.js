'use strict'

var ConnectionManager = (function () {
    var self = this;

    this.connections = [];
    this.channels = {};
    this.channel_id_ctr = 0;

    this.onHostAdded = function (connection) {};
    this.onDisconnect = function (connection) {};

    this.getBySocket = function (socket) {
        for (var i = 0; i < self.connections.length; i++) {
            if (self.connections[i].socket.id === socket.id) return self.connections[i];
        }
        return null;
    }

    this._indexOf = function (connection) {
        if (!connection) return -1;
        var i = 0;
        while (i < this.connections.length) {
            if (this.connections[i].distance >= connection.distance) return i;
            i++;
        }
        return i;
    }

    this.add = function (socket, x, y) {
        if (x === undefined) x = Math.random()*99 + 1;
        if (y === undefined) y = Math.random()*99 + 1;

        var d = Math.sqrt(x*x + y*y);
        var connection = {
            "socket": socket,
            "coordinate": {
                "x": x,
                "y": y,
            },
            "distance": d
        }
        self.connections.splice(this._indexOf(connection), 0, connection);
        if (x === 0 && y === 0) {
            this.onHostAdded(connection);
        }
        return connection;
    };

    this.remove = function (socket) {
        for (var i = 0; i < this.connections.length; i++) {
            if (this.connections[i].socket.id === socket.id) {
                var connection = this.connections.splice(i, 1)[0];
                this.onDisconnect(connection);
                return connection;
            }
        }
        return null;
    };

    this._getShuffledConnections = function (start, stop) {
        var shuffled = this.connections.slice(start, stop);
        var i = Math.max(stop - start, 0);
        while (i--) {
            var idx = Math.floor((i + 1) * Math.random());
            var tmp = shuffled[idx];
            shuffled[idx] = shuffled[i];
            shuffled[i] = tmp;
        }
        return shuffled;
    }

    this.getParentCandidates = function (connection, limit) {
        limit = limit || 10;
        var pivot = this._indexOf(connection);
        return this._getShuffledConnections(1, pivot).slice(0, limit);
    };

    this.getChildCandidates = function (connection, limit) {
        limit = limit || 10;
        var pivot = this._indexOf(connection);
        return this._getShuffledConnections(pivot + 1, this.connections.length).slice(0, limit);
    };



    this.setupChannel = function (sender, receiver, duration) {
        duration = duration || 8000;
        if (sender.socket.id === receiver.socket.id) return null;
        var channel_id = ++this.channel_id_ctr;
        this.channels[channel_id] = {
            expire: new Date().getTime() + duration,
            initiator: sender,
            responder: receiver
        };
        setTimeout(function () {
            delete self.channels[channel_id]
        }, duration);
        return channel_id;
    };

    this.getReceiverInChannel = function (channel_id, sender) {
        if (!(channel_id in this.channels)) return null;
        var channel = this.channels[channel_id];
        if (channel.initiator.socket === sender) return this.channels[channel_id].responder;
        else if (channel.responder.socket === sender) return channel.initiator;
        return null;
    };

    this.getSenderInChannel = function (channel_id, sender) {
        if (!(channel_id in this.channels)) return null;
        var channel = this.channels[channel_id];
        if (channel.initiator.socket === sender) return this.channels[channel_id].initiator;
        else if (channel.responder.socket === sender) return channel.responder;
        return null;
    };
})

module.exports = ConnectionManager;
