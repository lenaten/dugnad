'use strict'

var BufferMap = (function () {
    var self = this;

    this.map = {};
    this.hop_count = {};

    this.latest = {
        chunk_num: -1,
        piece_num: -1
    };

    this.onNewPiece = function (chunk_num, piece_num) {}
    this.add = function (header) {
        if (!("chunk_num" in header)) return; // dont add invalid headers !
        if (!(header.chunk_num in this.map)) {
            this.map[header.chunk_num] = Array.apply(null, new Array(header.piece_count)).map(Number.prototype.valueOf,0);
        }
        this.map[header.chunk_num][header.piece_num] = 1;

        // Keep track of highest piece hop count for given chunk
        this.hop_count[header.chunk_num] = Math.max(this.hop_count[header.chunk_num] || 0, header.hop_count);

        // Keep track of latest received chunk
        if (header.chunk_num > this.latest.chunk_num) {
            this.latest.chunk_num = header.chunk_num;
            this.latest.piece_num = header.piece_num;
            this.onNewPiece(header.chunk_num, header.piece_num);
        } else if (header.chunk_num === this.latest.chunk_num && header.piece_num > this.latest.piece_num) {
            this.latest.piece_num = header.piece_num;
            this.onNewPiece(header.chunk_num, header.piece_num);
        }
    }

    this.remove = function (chunk_num) {
        delete this.map[chunk_num];
        delete this.hop_count[chunk_num];
    }
    this.available = function () {
        var available = {};
        Object.keys(this.map).forEach(function (chunk_num) {
            for (var piece_num = 0; piece_num < self.map[chunk_num].length; piece_num++) {
                if (!(chunk_num in available)) {
                    available[chunk_num] = []
                }
                if (self.map[chunk_num][piece_num] === 1) {
                    available[chunk_num].push(piece_num);
                }
            }
        })
        return available;
    }

    this.missing = function (lu) {
        var missing = {};
        Object.keys(this.map).forEach(function (chunk_num) {
            if (chunk_num < lu) return;

            for (var piece_num = 0; piece_num < self.map[chunk_num].length; piece_num++) {
                if (self.map[chunk_num][piece_num] === 0) {
                    if (!(chunk_num in missing)) {
                        missing[chunk_num] = [];
                    }
                    missing[chunk_num].push(piece_num);
                }
            }
        })
        return missing;
    }

});

module = module || {};
module.exports = BufferMap;
