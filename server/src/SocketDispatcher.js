'use strict'

var SocketDispatcher = (function (io) {
    var self = this;

    this.onBootstrap  = function (socket, args) {};
    this.onPatch      = function (socket, args) {};
    this.onSignaling  = function (socket, args) {};
    this.onCreate     = function (socket, args) {};
    this.onJoin       = function (socket, args) {};
    this.onDisconnect = function (socket, args) {};

    this.sendSignal  = function (socket, message) {
        socket.emit("signaling", message);
    };

    this.sendBootstrapChannels = function (socket, channel_list) {
        socket.emit("bootstrap_channels", channel_list);
    }

    this.sendPatchChannels = function (socket, channel_list) {
        socket.emit("patch_channels", channel_list);
    }

    io.sockets.on('connection', function (socket) {

        socket.on('signaling', function (message) {
            self.onSignaling(socket, message);
        })
        socket.on('bootstrap', function (req) {
            var request = JSON.parse(req);
            self.onBootstrap(socket, request.params);
        })

        socket.on('patch', function (req) {
            var request = JSON.parse(req);
            self.onPatch(socket, request.params);
        })

        socket.on('create', function (req) {
            var request = JSON.parse(req);
            socket.join(request.room);
            var response = JSON.stringify({
                "peer_id": socket.id,
                "room": request.room
            });
            socket.emit('created', response);
            self.onCreate(socket, request.room);
        })
        socket.on('join', function (req) {
            var request = JSON.parse(req);
            socket.join(request.room);
            var response = JSON.stringify({
                "peer_id": socket.id,
                "room": request.room
            });
            socket.emit('joined', response);
            self.onJoin(socket, request.room);
        })

        socket.on('disconnect', function () {
            self.onDisconnect(socket);
        })

        // for information gathering
        socket.on('report', function (report) {
            self.onReport(socket, JSON.parse(report || {}));
        })
    });
});

module.exports = SocketDispatcher;
