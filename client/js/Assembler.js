// TODO: CREATE Assembler.js
var Chunk = Chunk || require('./Chunk.js');

var Assembler = (function () {
    var self = this;

    this.onChunk = function (chunk, chunk_num) {};

    this.store = {};
    this.consume = function (piece) {
        var header = Chunk.getHeader(piece)
        if (!(header.chunk_num in this.store)) {
            this.store[header.chunk_num] = {
                num_pieces: header.piece_count,
                pieces: {}
            }
        }
        this.store[header.chunk_num].pieces[header.piece_num] = piece;

        if (this.isAssembled(header.chunk_num)) {
            var pieces = [];
            for (var i = 0; i < header.piece_count; i++) {
                pieces.push(this.store[header.chunk_num].pieces[i]);
            }
            var chunk = Chunk.assemble(pieces);
            this.onChunk(chunk, header.chunk_num);
            delete this.store[header.chunk_num];
        }
    }

    this.getPiece = function (chunk_num, piece_num) {
        if (chunk_num in this.store) {
            if (piece_num in this.store[chunk_num].pieces) {
                return this.store[chunk_num].pieces[piece_num];
            }
        }
        return null;
    }

    this.isAssembled = function (chunk_num) {
        return chunk_num in this.store && Object.keys(this.store[chunk_num].pieces).length === this.store[chunk_num].num_pieces;
    }
});

var module = module || {};
module.exports = Assembler
