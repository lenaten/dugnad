var assert = require("assert");
var Chunk = require("../js/Chunk.js");
var Assembler = require("../js/Assembler.js");

describe('Assembler', function () {
    describe('#constructor', function () {
        it('should expose functions consume and getPiece and property store', function () {
            var assembler = new Assembler();

            assert.equal(Object.prototype.toString.call(assembler.consume), "[object Function]");
            assert.equal(Object.prototype.toString.call(assembler.getPiece), "[object Function]");
            assert.deepEqual(assembler.store, {});
        })
    })
    describe('#consume', function () {
        it('should cause getPiece to return correct piece', function () {
            var assembler = new Assembler();
            var data = new Uint8Array(20000);
            data.set(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 0));

            var chunk = new Chunk(1, data);
            assert.deepEqual(assembler.getPiece(1, 0),  null);
            assembler.consume(chunk.pieces[0]);
            assert.deepEqual(assembler.getPiece(1, 0), chunk.pieces[0]);
            assert.deepEqual(assembler.getPiece(1, 1), null);
        })
        it('should cause onChunk to be called when all pieces have been received', function (done) {
            var assembler = new Assembler();
            var origin_chunk = new Chunk(1, new Uint8Array(40000));

            var consumed_cnt = 0;
            assembler.onChunk = function (chunk) {
                assert.deepEqual(chunk.seq_num, origin_chunk.seq_num);
                assert.equal(consumed_cnt, origin_chunk.pieces.length);
                assert.deepEqual(chunk.pieces, origin_chunk.pieces);
                assert.deepEqual(chunk.payload, origin_chunk.payload);
                done();
            }
            for (var i = 0; i < origin_chunk.pieces.length; i++) {
                consumed_cnt++;
                assembler.consume(origin_chunk.pieces[i]);
            }
        })
        it('should delete chunk data when chunk is assembled', function (done) {
            var assembler = new Assembler();
            var origin_chunk = new Chunk(1, new Uint8Array(40000));

            assembler.onChunk = function (chunk) {
                setTimeout(function () {
                    assert.deepEqual(assembler.getPiece(1, 0), null);
                    assert.deepEqual(assembler.store[1], undefined);
                    done();
                }, 10);
            }

            for (var i = 0; i < origin_chunk.pieces.length; i++) {
                assembler.consume(origin_chunk.pieces[i]);
            }
        })

    });
})
