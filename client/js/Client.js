'use strict'

var Client = (function (config) {
    var self = this;

    var manager = new ConnectionManager(config);
    manager.downloadProbe.onMeasurement = function (value) {
        document.getElementById("statistics-download").innerHTML = value;
    }
    manager.uploadProbe.onMeasurement = function (value) {
        document.getElementById("statistics-upload").innerHTML = value;
    }

    this.sendReport = function (report) {
        manager.dispatcher.send("report", report);
    }
    /**
     * Client config
     */
    if (config.role === "host") {
        var seq_num = 0;
        var fanout = config.fanout;

        // event: spawned fresh chunk
        var broadcast = function (payload) {
            var chunk = new Chunk(++seq_num, payload);

            self.sendReport({
                type: "spawn",
                ul: manager.uploadProbe.getEstimate(),
                dl: manager.downloadProbe.getEstimate(),
                n: chunk.seq_num,
                s: chunk.size(),
            });

            var children = manager.getSortedChildren();

            chunk.pieces.forEach(function (piece) {
                for (var i = 0; i < Math.min(fanout, children.length); i++) {
                    manager.sendBinaryData(piece, children[i].id);
                }
            });
        }
        var stream = new Stream(broadcast, config);
    }

    /**
     * Viewer config
     */
    else {
        var assembler = new Assembler();
        var buffer = new ChunkBuffer();
        var map = new BufferMap();
        var player = new Player(document.getElementById("player_container"), 320, 240, buffer);

        // event: new original chunk was received
        assembler.onChunk = function (chunk, chunk_num) {
            buffer.consume(chunk);
            player.notifyChunkAvailable();

            self.sendReport({
                type: "receive",
                c: manager.numberOfChildren(),
                p: manager.numberOfParents(),
                ul: manager.uploadProbe.getEstimate(),
                dl: manager.downloadProbe.getEstimate(),
                h: buffer.head,
                n: chunk_num,
                hc: map.hop_count[chunk_num]
            });
        };

        buffer.onDelete = function (chunk_num) {
            map.remove(chunk_num);
        }

        this.getPiece = function (chunk_num, piece_num) {
            var chunk_num = parseInt(chunk_num);
            var piece_num = parseInt(piece_num);
            return assembler.getPiece(chunk_num, piece_num) || buffer.getPiece(chunk_num, piece_num);
        }


        manager.onbinarymessage = function (header, piece, connection) {
            if (self.getPiece(header.chunk_num, header.piece_num)) {
                connection.reduceScore();
                //console.log("reduced score due to redundant message from " + connection.id);
            } else {
                if (buffer.head === 65536) {
                    buffer.head = header.chunk_num;
                }
                assembler.consume(piece);
                map.add(header);
            }

        }

        manager.onmessage = function (prefix, data, peer_id) {
            switch (prefix) {
            case "r": // pull request
                if (data.chunk_num === "*") {
                    var piece = self.getPiece(map.latest.chunk_num, map.latest.piece_num);
                    console.log("sending piece [" + map.latest.chunk_num  + ", " + map.latest.piece_num + "] for wildcard pull request");
                    if (piece) {
                        manager.sendBinaryData(piece, peer_id);
                    }
                }
                else {
                    data.pieces.forEach(function (piece_num) {
                        var piece = self.getPiece(data.chunk_num, piece_num);
                        if (piece) {
                            manager.sendBinaryData(piece, peer_id);
                        }
                    });
                }
                break;
            case "h": // heartbeat
                //console.log("[ <3 ]\tfrom " + peer_id);
                break;
            default:
                console.error("Uncaught message prefix [" + prefix + "]. from " + peer_id);
                break;
            }
        };

        // Gossiping: PUSH trigger
        map.onNewPiece = function (chunk_num, piece_num) {
            var piece = self.getPiece(chunk_num, piece_num);
            push(piece);
        }

        // Gossiping: PULL trigger
        setInterval(function () {
            pull();
        }, config.pull_interval);

        var push = function (piece) {
            var children = manager.getSortedChildren();
            //var parents = manager.getSortedParents();
            //parents.reverse();

            //var peers = children.concat(parents);
            var peers = children;
            var peer = getPushTarget(peers);

            if (piece && peer) {
                //console.log("[push]\tto" + peer.id);
                manager.sendBinaryData(piece, peer.id);
            }

        }
        var pull = function () {
            var missing = {}
            if (buffer.state = buffer.states.INITIAL_STATE) {
                missing = map.missing(0);
            }
            else {
                missing = map.missing(buffer.head); 
            }

            var chunks = Object.keys(missing).sort();
            var parents = manager.getSortedParents();   // add parents in ascending relative distance (closest to client first)
            var children = manager.getSortedChildren(); // add children in ascending relative distance (closest to client first)
            var peers = parents.concat(children);

            if (peers.length === 0) return;
            var peer = getPullTarget(peers);

            for (var i = 0; i < chunks.length; i++) {
                var chunk_num = chunks[i];
                if (missing[chunk_num].length > 0) {
                    console.log("["+ buffer.head + "] PULL " + chunk_num, missing[chunk_num])
                    manager.sendPullRequest(chunk_num, missing[chunk_num], peer.id);
                    return;
                }
            }
            // pull latest if buffer is uninitialized
            if (buffer.head === 65536) {
                console.log("["+ buffer.head + "] PULL WILDCARD")
                manager.sendPullRequest("*", [0], peer.id);
            }
        }

        var getPullTarget = function (peers) {
            var idx = drawIndex(peers.length);
            return peers[idx];
        }

        var getPushTarget = function (peers) {
            var idx = drawIndex(peers.length);
            return peers[idx];
        }

        var drawIndex = function (L) {
            var r = Math.random();
            // strict coordinate --> many hops
            //return parseInt(L*(-Math.log2(1 - (1 - Math.pow(2, -L)) * r) / L))
            // less strict coordinate based
            return parseInt(2*L*(-Math.log2(1 - (1 - Math.pow(2, -L)) * r) / L )) % L
            // random
            //return parseInt(Math.random() * L)
        }

    }
});
