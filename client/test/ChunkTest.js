var assert = require("assert");
var Chunk = require("../js/Chunk.js");

describe('Chunk', function () {

    var mockArrayBuffer = function (bytes) {
        return new Uint8Array(bytes);
    }

    describe('#constructor', function () {
        it('should return object with property piece type Uint8Array', function () {
            var chunk = new Chunk(1, mockArrayBuffer(1));
            assert.equal(chunk.pieces.length, 1);
            assert.equal(Object.prototype.toString.call(chunk.pieces[0]), "[object Uint8Array]");
        })

        it('should split data into 16kB (16 384 Bytes) pieces', function () {
            var num_bytes = 65536;
            var arrayBuffer = new mockArrayBuffer(num_bytes);
            assert.equal(arrayBuffer.byteLength, num_bytes);
            var chunk = new Chunk(0, arrayBuffer);

            assert.equal(chunk.pieces.length, Math.ceil(num_bytes / (16384 - Chunk.HEADER_BYTE_LENGTH)));
            for (var i = 0; i < chunk.pieces.length; i++) {
                assert.equal(chunk.pieces[i].byteLength, Math.min(num_bytes + Chunk.HEADER_BYTE_LENGTH, 16384));
                num_bytes -= chunk.pieces[i].byteLength;
                num_bytes += Chunk.HEADER_BYTE_LENGTH;
            }
            assert.equal(num_bytes, 0);
        })
        it('should supply correct sequence numbers in piece headers', function () {
            var num_bytes = 131072;
            var arrayBuffer = new mockArrayBuffer(num_bytes);
            assert.equal(arrayBuffer.byteLength, num_bytes);

            var seq_num = 124;
            var chunk = new Chunk(seq_num, arrayBuffer);
            var num_pieces = chunk.pieces.length;
            assert.equal(num_pieces, chunk.num_pieces);
            for (var i = 0; i < chunk.pieces.length; i++) {
                var view = new DataView(chunk.pieces[i].buffer);
                assert.equal(view.getUint16(0), seq_num);
                assert.equal(view.getUint8(2), i);
                assert.equal(view.getUint8(3), num_pieces);
            }
        })
    })
    describe('#getHeader', function () {
        it('should return correct header info', function () {
            var num_bytes = 131072;
            var arrayBuffer = new mockArrayBuffer(num_bytes);
            assert.equal(arrayBuffer.byteLength, num_bytes);

            var seq_num = 124;
            var chunk = new Chunk(seq_num, arrayBuffer);
            var num_pieces = chunk.pieces.length;
            assert.equal(num_pieces, chunk.num_pieces);
            for (var i = 0; i < chunk.pieces.length; i++) {
                var header = Chunk.getHeader(chunk.pieces[i]);

                assert.equal(header.chunk_num, seq_num);
                assert.equal(header.piece_num, i);
                assert.equal(header.piece_count, num_pieces);
            }
        })
        it('should support chunk_num up to 2^16', function () {
            var INT16 = 65536

            var chunk = new Chunk(65535, new mockArrayBuffer(1))
            assert.equal(Chunk.getHeader(chunk.pieces[0]).chunk_num, 65535);

            chunk = new Chunk(65536, new mockArrayBuffer(1))
            assert.equal(Chunk.getHeader(chunk.pieces[0]).chunk_num, 0);

            chunk = new Chunk(65537, new mockArrayBuffer(1))
            assert.equal(Chunk.getHeader(chunk.pieces[0]).chunk_num, 1);

            for (var i = -5; i < 5; i++) {
                var seq_num = INT16 + i;
                var chunk = new Chunk(seq_num, new mockArrayBuffer(1))
                assert.equal(Chunk.getHeader(chunk.pieces[0]).chunk_num, seq_num % 65536);
            }
        })
    })

    describe('#assemble', function () {
        it('should return block with payload correct number of bytes', function () {
            var num_bytes = 131072;
            var arrayBuffer = new mockArrayBuffer(num_bytes);

            var original = new Chunk(1, arrayBuffer);

            var chunk = Chunk.assemble(original.pieces);
            assert.equal(chunk.payload.byteLength, num_bytes);
        })

        it('should return the correct data', function () {
            var num_bytes = 16386
            var arrayBuffer = new mockArrayBuffer(num_bytes);
            arrayBuffer.set(new Uint8Array([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]), 0);
            arrayBuffer.set(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), num_bytes - 10);

            var original = new Chunk(1, arrayBuffer);
            var view = new DataView(arrayBuffer.buffer);
            assert.equal(view.getUint8(0), 10);
            assert.equal(view.getUint8(1), 9);
            assert.equal(view.getUint8(9), 1);

            assert.equal(view.getUint8(num_bytes-1), 10);
            assert.equal(view.getUint8(num_bytes-2), 9);
            assert.equal(view.getUint8(num_bytes-10), 1);

            assert.equal(original.pieces[0].buffer.byteLength, Chunk.MAX_BODY_LENGTH + Chunk.HEADER_BYTE_LENGTH);
            assert.equal(original.pieces[1].buffer.byteLength, 10 + Chunk.HEADER_BYTE_LENGTH);

            view = new DataView(original.pieces[0].buffer);
            assert.equal(view.getUint8(0 + Chunk.HEADER_BYTE_LENGTH), 10);
            assert.equal(view.getUint8(1 + Chunk.HEADER_BYTE_LENGTH), 9);
            assert.equal(view.getUint8(9 + Chunk.HEADER_BYTE_LENGTH), 1);

            view = new DataView(original.pieces[1].buffer);
            assert.equal(view.getUint8(0 + Chunk.HEADER_BYTE_LENGTH), 1);
            assert.equal(view.getUint8(1 + Chunk.HEADER_BYTE_LENGTH), 2);
            assert.equal(view.getUint8(9 + Chunk.HEADER_BYTE_LENGTH), 10);

            var chunk = Chunk.assemble(original.pieces);
            assert.equal(chunk.payload.byteLength, num_bytes);
            view = new DataView(chunk.payload.buffer);

            assert.equal(view.getUint8(0), 10);
            assert.equal(view.getUint8(1), 9);
            assert.equal(view.getUint8(9), 1);

            assert.equal(view.getUint8(num_bytes-1), 10);
            assert.equal(view.getUint8(num_bytes-2), 9);
            assert.equal(view.getUint8(num_bytes-10), 1);

            assert.deepEqual(original.pieces[0].buffer, chunk.pieces[0].buffer);
            assert.deepEqual(original.pieces[1], chunk.pieces[1])
        })
    })
});
