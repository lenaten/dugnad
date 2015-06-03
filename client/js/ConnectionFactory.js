'use strict'

var ConnectionFactory = (function (config, dispatcher) {
    var self = this;
    var servers = {
        'iceServers': [
            {url:'stun:stun.l.google.com:19302'},
            {url:'stun:stun1.l.google.com:19302'},
            {url:'stun:stun2.l.google.com:19302'},
            {url:'stun:stun3.l.google.com:19302'},
            {url:'stun:stun4.l.google.com:19302'},
            {url:'stun:stun.voiparound.com'},
            {url:'stun:stun.voipbuster.com'},
            {url:'stun:stun.voipstunt.com'},
            {url:'stun:stunserver.org'}
        ]
    };

    // store for connections in establishment phase
    var tmp = {};

    // attach signal dispatcher
    this.dispatcher = dispatcher;

    this.onConnection = function (connection, coordinate) {};

    this.initiateConnection = function (channel_id, coordinate) {
        var connection = this.spawnConnection(channel_id, coordinate);
        var channel = connection.createDataChannel(channel_id, { "maxRetransmits": 1 });
        channel.onopen = function (event) {
            //console.log("channel onopen fired!")
            self.connectionSetupComplete(channel_id, event.srcElement);
        }
        connection.createOffer(
            function (offer) {
                connection.setLocalDescription(offer);
                self.dispatcher.sendOffer(channel_id, offer);
            },
            function (error) {
                console.error(error);
            });
    }

    this.consumeOffer = function (channel_id, offer, coordinate) {
        var connection = this.spawnConnection(channel_id, coordinate);
        connection.setRemoteDescription(offer);
        connection.createAnswer(
            function (answer) {
                tmp[channel_id].connection.setLocalDescription(answer);
                self.dispatcher.sendAnswer(channel_id, answer);
            },
            function (error) {
                console.error(error);
            });
    }

    this.spawnConnection = function (channel_id, coordinate) {
        var connection = new RTCPeerConnection(servers, {});
        connection.onicecandidate = function (event) {
            if (event.candidate) {
                self.dispatcher.sendCandidate(channel_id, event.candidate);
            }
        }
        connection.ondatachannel = function (event) {
            //console.log("connection ondatachannel fired!");
            //console.log(event.channel);
            self.connectionSetupComplete(channel_id, event.channel);
        }

        tmp[channel_id] = {
            connection: connection,
            coordinate: coordinate
        };
        // clean up connections that does never open.
        tmp[channel_id].recycle = setTimeout(function () {
            //console.log("Recycled connection that did not open after 20 seconds");
            //console.log(tmp[channel_id]);
            tmp[channel_id].connection.close();
            delete tmp[channel_id]
        }, 20000);
        return connection;
    }

    this.consumeAnswer = function (channel_id, answer) {
        var connection = tmp[channel_id].connection;
        connection.setRemoteDescription(answer);
    }

    this.consumeCandidate = function (channel_id, candidate) {
        //console.log(tmp);
        //console.log(channel_id);
        if (channel_id in tmp) {
            tmp[channel_id].connection.addIceCandidate(candidate);
        }
    }

    this.connectionSetupComplete = function (channel_id, channel) {
        var connection = new Connection(tmp[channel_id].connection, channel,
            config.connection_timeout,
            config.connection_heartbeat_interval,
            config.connection_score_decay_interval);

        connection.coordinate = tmp[channel_id].coordinate;

        this.onConnection(connection, tmp[channel_id].coordinate);
        clearTimeout(tmp[channel_id].recycle);
        //console.log("detatched recycle timeout")
        setTimeout(function () {
            delete tmp[channel_id];
        }, 1000);
    }

})
