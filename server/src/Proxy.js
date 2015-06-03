'use strict'

var ConnectionManager = require("../src/ConnectionManager.js");

var Proxy = (function () {
    var self = this;

    // config
    this.peer_set_limit = 7;

    this.host_connection = null;
    this.manager = new ConnectionManager();


    this.setHost = function (host_socket, room) {
        // TODO: Have separate manager for each room
        this.host_connection = this.manager.add(host_socket, 0, 0);
    };

    this.bootstrap = function (socket) {
        // do nothing if host is offline
        if (!this.host_connection) return null;
        else if (socket.id === this.host_connection.socket.id) {
            return {
                coordinate: this.host_connection.coordinate,
                parents: [],
                children: [] //this.manager.connections.slice(1, this.peer_set_limit)
            }
        }

        // bootstrap node
        var connection = this.manager.add(socket);
        var parents = this.manager.getParentCandidates(connection, this.peer_set_limit / 2);
        var children = this.manager.getChildCandidates(connection, this.peer_set_limit / 2);

        // check if this should be a direct child of the host, if so add the host to the list of parents
        if (this.manager.connections.length <= this.peer_set_limit
            || connection.distance <= this.manager.connections[this.peer_set_limit].distance) {
            // insert host at index zero
            parents.unshift(this.host_connection);
        }

        var response = {
            coordinate: connection.coordinate,
            parents: [],
            children: []
        };

        parents.forEach(function (parent) {
            var channel_id = self.manager.setupChannel(connection, parent);
            response.parents.push({
                channel_id: channel_id,
                coordinate: parent.coordinate
            });
        })
        children.forEach(function (child) {
            var channel_id = self.manager.setupChannel(connection, child);
            response.children.push({
                channel_id: channel_id,
                coordinate: child.coordinate
            })
        })
        return response;
    };

    this.patch = function (socket, args) {
        if (!this.host_connection || socket.id === this.host_connection.socket.id) return null;
        else {

            // TODO: inefficient and slow; use coordinate / distance to speed up!
            var connection = this.manager.getBySocket(socket);
            var parents = this.manager.getParentCandidates(connection, this.peer_set_limit/2);
            var children = this.manager.getChildCandidates(connection, this.peer_set_limit/2);

            // include host if too few parents were found.
            if (parents.length < (this.peer_set_limit / 2)) {
                parents.unshift(self.host_connection);
            }

            var connections = parents.concat(children);
            var response = {
                channels: []
            }

            connections.forEach(function (candidate) {
                var channel_id = self.manager.setupChannel(connection, candidate);
                if (!channel_id) return;
                response.channels.push({
                    channel_id: channel_id,
                    coordinate: candidate.coordinate
                });
            });
            return response;
        }

    }

    this.disconnect = function (socket) {
        // if host disconnects - tear down stream
        if (!this.host_connection) return;
        if (socket.id === this.host_connection.socket.id) {
            this.host_connection = null;
            this.host_direct_child_distance_limit = 0;
            this.manager = new ConnectionManager();
        } else {
            var connection = this.manager.remove(socket);
        }
    }

    this.forward = function (socket, message, callback) {
        var data = JSON.parse(message);
        var channel_id = data._channel_id;
        var receiver = this.manager.getReceiverInChannel(channel_id, socket);
        var sender = this.manager.getSenderInChannel(channel_id, socket);
        if (receiver && sender) {
            if (data._type === "offer") {
                data._coordinate = sender.coordinate;
            }
            callback(receiver.socket, data);
        } else {
            console.log("[" + socket.id + "] tried to send but had no receiver.");
        }
    }
})

module.exports = Proxy;
