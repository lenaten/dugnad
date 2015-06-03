'use strict'

var http = require('http');
var server = require('node-static');
var file = new(server.Server)("../../client/");
var socket = require('socket.io')

/* Start basic http server */
var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(2000);

var dashboard = require('express')();
dashboard.get('/', function (req, res) {
    res.send(reports);
});
dashboard.listen(2001);

var io = require('socket.io').listen(app);

var ConnectionManager = require("./ConnectionManager.js");
var SocketDispatcher = require("./SocketDispatcher.js");
var Proxy = require("./Proxy.js");

var reports = [];

var Server = (function () {
    var self = this;

    this.dispatcher = new SocketDispatcher(io);
    this.proxy = new Proxy();

    this.dispatcher.onBootstrap = function (socket) {
        reports.push({
            type: "join",
            id: socket.id,
            t: Date.now(),
        });
        var response = self.proxy.bootstrap(socket);
        self.dispatcher.sendBootstrapChannels(socket, JSON.stringify(response));
    }

    this.dispatcher.onPatch = function (socket) {
        var response = self.proxy.patch(socket);
        self.dispatcher.sendPatchChannels(socket, JSON.stringify(response));
    }

    this.dispatcher.onCreate = function (host_socket, room) {
        reports = [];
        self.proxy.setHost(host_socket, room);
    }

    this.dispatcher.onSignaling = function (socket, message) {
        self.proxy.forward(socket, message, function (receiver, message) {
            self.dispatcher.sendSignal(receiver, JSON.stringify(message));
        });
    }
    this.dispatcher.onDisconnect = function (socket) {
        reports.push({
            type: "leave",
            id: socket.id,
            t: Date.now(),
        })
        self.proxy.disconnect(socket);
    }

    this.dispatcher.onReport = function (socket, report) {
        report.id = socket.id;
        report.t = Date.now();
        reports.push(report);
    }
});

var server = new Server();

module.exports = Server;
