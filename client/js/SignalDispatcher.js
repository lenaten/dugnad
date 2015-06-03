'use strict'

var SignalDispatcher = (function (config, manager) {
    var self = this;
    this.room = config.room;
    this.role = config.role;

    this.manager = manager;
    this.socket = io.connect();


    // callbacks
    this.onLocalCoordinate = function (coordinate) {};
    this.onRemoteConfig = function (config) {}

    this.connect = function () {
        var payload = JSON.stringify({"room": this.room});
        if (this.role === "host") this.socket.emit("create", payload);
        else this.socket.emit("join", payload);
    }
    this.socket.on("created", function (response) { _onConnected(response); });
    this.socket.on("joined", function (response) { _onConnected(response); });

    var _onConnected = function (res) {
        var config = JSON.parse(res);
        self.onRemoteConfig(config);
        self.socket.emit("bootstrap", JSON.stringify({}));
    }

    this.socket.on("bootstrap_channels", function (res) {
        var res = JSON.parse(res);
        if (!res) {
            console.error("Failed to connect to overlay network.");
            return;
        }
        self.onLocalCoordinate(res.coordinate);
        // TODO: Change server so that it does not distinguish between parents / children
        self.onBootstrapChannels(res.parents.concat(res.children));
    });

    this.onBootstrapChannels = function (channels) {}

    this.requestPatch = function ()  {
        self.socket.emit("patch", JSON.stringify({}));
    }

    this.socket.on("patch_channels", function (response) {
        var response = JSON.parse(response);
        if (response) self.onPatchChannels(response.channels || []);
    })
    this.onPatchChannels = function (channels) {}

    this.socket.on("signaling", function (signal) {
        self.onSignal(JSON.parse(signal));
    });
    this.onSignal = function (signal) {
        var channel_id = signal._channel_id;
        switch (signal._type) {
        case 'offer':
            self.manager.onOffer(channel_id, new RTCSessionDescription(signal), signal._coordinate);
            break;
        case 'answer':
            //console.log("received answer!");
            self.manager.onAnswer(channel_id, new RTCSessionDescription(signal));
            break;
        case 'candidate':
            //console.log("received candidate!");
            self.manager.onCandidate(channel_id, new RTCIceCandidate(signal));
            break;
        default:
            throw new Error("Unexpected signal: " + signal);
        }
    }


    this.sendOffer = function (channel_id, offer) {
        var pdu = JSON.parse(JSON.stringify(offer));
        pdu._type = "offer";
        pdu._channel_id = channel_id;
        this.send("signaling", pdu);
    }
    this.sendAnswer = function (channel_id, answer) {
        var pdu = JSON.parse(JSON.stringify(answer));
        pdu._type = "answer";
        pdu._channel_id = channel_id;
        this.send("signaling", pdu);
    }
    this.sendCandidate = function (channel_id, candidate) {
        var pdu = JSON.parse(JSON.stringify(candidate));
        pdu._type = "candidate";
        pdu._channel_id = channel_id;
        this.send("signaling", pdu);
    }
    this.send = function (subject, json) {
        this.socket.emit(subject, JSON.stringify(json));
    }
});

var module = module || {};
module.exports = SignalDispatcher;
