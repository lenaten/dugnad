'use strict'

var Chunk = (function (seq_num, payload) {
    var self = this;
    this.seq_num = seq_num;
    this.payload = payload;
    this.num_pieces = Math.ceil(payload.byteLength / (Chunk.MAX_BYTE_LENGTH - Chunk.HEADER_BYTE_LENGTH));
    this.pieces = [];

    while (payload && payload.byteLength > 0) {
        var L = Math.min(Chunk.MAX_BYTE_LENGTH, payload.byteLength + Chunk.HEADER_BYTE_LENGTH);
        var piece = new Uint8Array( L );

        var header = new Uint8Array([parseInt(this.seq_num / 256), this.seq_num % 256, this.pieces.length, this.num_pieces]);
        piece.set(header, 0);
        var body = new Uint8Array((payload.buffer.slice(0, L-Chunk.HEADER_BYTE_LENGTH)));
        piece.set(body, Chunk.HEADER_BYTE_LENGTH);
        payload = new Uint8Array(payload.buffer.slice(L - Chunk.HEADER_BYTE_LENGTH));

        this.pieces.push(piece);
    }

    this.toBlob = function () {
        var view = new DataView(this.payload.buffer);
        return new Blob([view], {type:"video/webm"});
    }

    this.size = function () {
        var s = 0;
        this.pieces.forEach(function (piece) {
            s += piece.byteLength;
        })
        return s;
    }
});
Chunk.HEADER_BYTE_LENGTH = 8;
Chunk.MAX_BYTE_LENGTH = 16384;
Chunk.MAX_BODY_LENGTH = Chunk.MAX_BYTE_LENGTH - Chunk.HEADER_BYTE_LENGTH;


// Decorate Chunk with utility functions
Chunk.getHeader = function (piece) {
    var view = new DataView(piece.buffer);
    var piece = piece;
    return ({
        chunk_num: view.getUint16(0),
        piece_num: view.getUint8(2),
        piece_count: view.getUint8(3),
        // bytes 4-6 are reserved for future use.
        hop_count: view.getUint8(7)
    });
}

Chunk.incHopCount = function (piece) {
    var hop_count = Chunk.getHeader(piece).hop_count;
    piece.set(new Uint8Array([++hop_count]), 7);
}

Chunk.assemble = function (pieces) {
    var size = 0;
    for (var i = 0; i < pieces.length; i++) {
        size += pieces[i].byteLength - Chunk.HEADER_BYTE_LENGTH;
    }
    var payload = new Uint8Array(size);
    var offset = 0;
    for (var i = 0; i < pieces.length; i++) {
        var data = new Uint8Array(pieces[i].buffer.slice(Chunk.HEADER_BYTE_LENGTH));
        payload.set(data, offset);
        offset += data.byteLength;
    }
    var seq_num = Chunk.getHeader(pieces[0]).chunk_num;
    return new Chunk(seq_num, payload);
}

var module = module || {};
module.exports = Chunk
