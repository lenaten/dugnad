
var ConnectionManager = (function (config) {
    var self = this;

    this.dispatcher = new SignalDispatcher(config, this);
    this.factory = new ConnectionFactory(config, this.dispatcher);
    this.dispatcher.connect();

    var connectionStats = new ConnectionStatistics("connection-statistics");

    this.dispatcher.onRemoteConfig = function (remoteConfig) {
        //console.log("config from server after establishing web socket:");
        //console.log("id: \t" + remoteConfig.peer_id);
        //console.log("room: \t" + remoteConfig.room);
    }

    this.dispatcher.onLocalCoordinate = function (coordinate) {
        //console.log("got coordinate: " + JSON.stringify(coordinate));
        self.setCoordinate(coordinate);
    }

    this.factory.onConnection = function (connection, coordinate) {
        self.add(connection, coordinate);
    }


    this.onBootstrapStarted = function () {};
    this.dispatcher.onBootstrapChannels = function (channels) {
        self.onBootstrapStarted();
        channels.forEach(function (channel) {
            if (self.shouldInitiateConnection(channel.coordinate)) {
                //console.log("want to establish new connection due to bootstrap!");
                self.factory.initiateConnection(channel.channel_id, channel.coordinate);
            } else {
                //console.log("discarding bootstrap channel");
            }
        })
    }

    this.dispatcher.onPatchChannels = function (channels) {
        channels.forEach(function (channel) {
            if (self.shouldInitiateConnection(channel.coordinate)) {
                //console.log("want to establish new connection due to patch!");
                self.factory.initiateConnection(channel.channel_id, channel.coordinate);
            } else {
                //console.log("discarding patch channel");
            }
        })
    }

    this.onOffer = function (channel_id, offer, coordinate) {
        if (self.shouldAcceptConnection(coordinate)) {
            //console.log("Accepting offer!");
            this.factory.consumeOffer(channel_id, offer, coordinate);
        } else {
            //console.log("Rejected offer");
        }
    }
    this.onAnswer = function (channel_id, answer) {
        this.factory.consumeAnswer(channel_id, answer);
    }
    this.onCandidate = function (channel_id, candidate) {
        this.factory.consumeCandidate(channel_id, candidate);
    }

    // store for open connections
    this.children = {};
    this.parents = {};

    this.downloadProbe = new BandwidthProbe();
    this.uploadProbe = new BandwidthProbe();
    this.coordinate = null; // {x: #, y: #};
    this.distance = null; // euclidean distance from origin when coordinate is set
    this.patchTrigger = null;
    this.recycleTrigger = null;


    this.setCoordinate = function (coordinate) {
        this.coordinate = coordinate;
        this.distance = Math.sqrt(coordinate.x*coordinate.x + coordinate.y*coordinate.y);
        document.getElementById("statistics-coordinate").innerHTML = "(" + this.coordinate.x.toFixed(2) + ", " + this.coordinate.y.toFixed(2) + ")";
        document.getElementById("statistics-distance").innerHTML = this.distance.toFixed(2);

        // Complete Initialization
        this.patchTrigger = setInterval(function () {
            self.onPatchTrigger();
        }, config.patch_interval);

        this.recycleTrigger = setInterval(function () {
            self.onRecycleTrigger();
        }, config.connection_recycle_interval)
    }

    this.onPatchTrigger = function () {
        var IDEAL_COUNT = config.ideal_peer_count / 2;
        if (self.numberOfChildren() < IDEAL_COUNT || self.numberOfParents() < IDEAL_COUNT) {
            this.dispatcher.requestPatch();
        }
    }

    this.onRecycleTrigger = function () {
        if (this.hasExcessChildren()) {
            //console.log("recycling children");
            this.recycle(this.children);
        }
        if (this.hasExcessParents()) {
            //console.log("recycling parents");
            this.recycle(this.parents);
        }
    }

    this.recycle = function (connections) {
        if (config.role === "host") {
            // do not close connections as host
            return;
            // close most distant connection on recycle
            //var sorted = self.getSortedConnections(connections)
            //sorted[sorted.length - 1].close()
        }
        else if (config.role === "viewer") {
            var worst_score = 999999;
            var connection_to_recycle = null;
            Object.keys(connections).forEach(function (connection_id) {
                if (connections[connection_id].score < worst_score) {
                    connection_to_recycle = connection_id;
                    worst_score = connections[connection_id].score;
                }
            });
            //console.log("OBS! Closing connection " + connection_to_recycle);
            connections[connection_to_recycle].close();
        }
    }

    this.isChild = function (peer) {
        return peer.distance > this.distance;
    }

    this.isParent = function (coordinate) {
        return !this.isChild(coordinate);
    }

    this.relativeDistanceFrom = function (other) {
        var dx = other.x - self.coordinate.x;
        var dy = other.y - self.coordinate.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    this.onmessage = function (prefix, body, connection_id) {};
    this.onbinarymessage = function (header, body, connection_id) {};

    this.add = function (connection, coordinate) {
        connection.coordinate = coordinate;
        connection.distance = Math.sqrt(coordinate.x*coordinate.x + coordinate.y*coordinate.y);
        connection.relativeDistance = this.relativeDistanceFrom(coordinate);

        if (this.isChild(connection)) {
            self.children[connection.id] = connection;
            connectionStats.addChild(connection);

            document.getElementById("statistics-children").innerHTML = Object.keys(this.children).length;
            connection.onclose = function () {
                connectionStats.remove(this);
                delete self.children[connection.id]
                document.getElementById("statistics-children").innerHTML = Object.keys(self.children).length;
            }
        }
        else {
            self.parents[connection.id] = connection;
            connectionStats.addParent(connection);

            document.getElementById("statistics-parents").innerHTML = Object.keys(this.parents).length;
            connection.onclose = function () {
                connectionStats.remove(this);
                delete self.parents[connection.id]
                document.getElementById("statistics-parents").innerHTML = Object.keys(self.parents).length;
            }
        }

        connection.onScoreChange = function () {
            connectionStats.update(this);
        }

        connection.onmessage = function (prefix, body) {
            self.downloadProbe.feed(prefix + JSON.stringify(body));
            self.onmessage(prefix, body, connection.id);
        }
        connection.onbinarymessage = function (piece) {
            self.downloadProbe.feedBytes(piece.byteLength);
            this.increaseScore();

            // increase the hop count by 1 for this piece
            Chunk.incHopCount(piece);
            self.onbinarymessage(Chunk.getHeader(piece), piece, this);
        }

    }

    this.get = function (id) {
        return this.children[id] || this.parents[id];
    }

    this.size = function () {
        return this.numberOfChildren() + this.numberOfParents();
    }

    this.numberOfChildren = function () {
        return Object.keys(this.children).length;
    }

    this.numberOfParents = function () {
        return Object.keys(this.parents).length;
    }

    this.remove = function (id) {
        if (!(this.get(id))) return null;
        this.get(id).close();
    }

    this.shouldAcceptConnection = function (coordinate) {
        if (!self.isUniqueConnection(coordinate)) return false;
        else if (self.isChild(coordinate) && self.numberOfChildren() < config.ideal_peer_count) return true;
        else if (self.isParent(coordinate) && self.numberOfParents() < config.ideal_peer_count) return true;
        else return false;
    }

    this.shouldInitiateConnection = function (coordinate) {
        if (!self.isUniqueConnection(coordinate)) return false;
        else if (self.isChild(coordinate) && self.numberOfChildren() < config.ideal_peer_count / 2) return true;
        else if (self.isParent(coordinate) && self.numberOfParents() < config.ideal_peer_count / 2) return true;
        else return false;
    }

    this.isUniqueConnection = function (coordinate) {
        var strcoord = JSON.stringify(coordinate);
        if (strcoord === JSON.stringify(this.coordinate)) return false;

        var unique = true;
        var peers = Object.keys(this.parents).concat(Object.keys(this.children));
        peers.forEach(function (pid) {
            if (JSON.stringify(self.get(pid).coordinate) === strcoord) unique = false;
        });
        return unique;
    }

    this.hasExcessChildren = function () {
        return self.numberOfChildren() > config.ideal_peer_count/2;
    }

    this.hasExcessParents = function () {
        return self.numberOfParents() > config.ideal_peer_count/2;
    }

    this.getShuffledParents = function () {
        return self.getShuffledConnections(this.parents);
    }

    this.getShuffledChildren = function () {
        return self.getShuffledConnections(this.children);
    }

    this.getSortedChildren = function () {
        return this.getSortedConnections(this.children);
    }

    this.getSortedParents = function () {
        return this.getSortedConnections(this.parents);
    }

    this.getSortedConnections = function (obj) {
        var array = Object.keys(obj).map(function (key) {return obj[key]});
        array.sort(function (a, b) { return a.relativeDistance - b.relativeDistance });
        return array;
    }

    /**
     * Randomize array element order in-place.
     * Using Fisher-Yates shuffle algorithm.
     *
     * Copied from http://stackoverflow.com/a/12646864
     */
    this.getShuffledConnections = function (obj) {
        var array = Object.keys(obj);
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    this.sendBinaryData = function (arrayBuffer, connection_id) {
        var connection = this.get(connection_id);

        setTimeout(function () {
            connection.sendArrayBuffer(arrayBuffer);
            connection.increaseScore();
            self.uploadProbe.feedBytes(arrayBuffer.byteLength);
        }, config.upload_delay);
    }

    this.sendPullRequest = function (chunk_num, pieces, connection_id) {
        var payload = {"chunk_num": chunk_num, "pieces": pieces};
        this.get(connection_id).send("r", payload);
        //console.log("sent pull request to " + this.get(connection_id).distance);
        this.uploadProbe.feed("r"+JSON.stringify(payload));
    }

    this.broadcastToParents = function (subject, payload) {
        for (id in this.parents) {
            this.get(id).send(subject, payload);
            this.uploadProbe.feed(subject+JSON.stringify(payload));
        }
    }

    this.broadcastToChildren = function (subject, payload) {
        for (id in this.children) {
            this.get(id).send(subject, payload);
            this.uploadProbe.feed(subject+JSON.stringify(payload));
        }
    }
});

var module = module || {};
module.exports = ConnectionManager
