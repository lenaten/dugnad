var assert = require("assert");

var Chunk = require("../js/Chunk.js");
var Buffer = require("../js/ChunkBuffer.js");

describe('Buffer', function () {
    describe('#constructor', function () {
        var buffer = new Buffer();
        it('should expose function consume', function () {
            assert.equal(Object.prototype.toString.call(buffer.consume), "[object Function]");
        })
        it('should expose function getPiece', function () {
            assert.equal(Object.prototype.toString.call(buffer.getPiece), "[object Function]");
        })
        it('should expose function getNext', function () {
            assert.equal(Object.prototype.toString.call(buffer.getNext), "[object Function]");
        })
        it('should be in initial state', function () {
            assert.equal(buffer.state, buffer.states.INITIAL_STATE);
        })
        it('should have property head set to 2^16', function () {
            assert.deepEqual(buffer.head, 65536);
        })
        it('should set property size', function () {
            assert(typeof buffer.size === "number");
            assert(buffer.size > 0);
        })
        it('should have empty store', function () {
            assert.deepEqual(buffer.store, {});
        })
    });

    describe('#consume', function () {
        var chunk_7 = new Chunk(7, new Int8Array(20000));
        var chunk_10 = new Chunk(10, new Int8Array(20000));
        var chunk_11 = new Chunk(11, new Int8Array(20000));
        var chunk_12 = new Chunk(12, new Int8Array(20000));
        var chunk_14 = new Chunk(14, new Int8Array(20000));
        it('should add chunk to store', function () {
            var buffer = new Buffer();
            var chunk = chunk_7;

            buffer.consume(chunk);
            assert.deepEqual(buffer.store[7], chunk_7);
        })


        it('should set head to the lowest seq_num seen while in initial state', function () {
            var buffer = new Buffer();

            buffer.consume(chunk_12);
            assert.equal(buffer.head, 12);
            buffer.consume(chunk_10);
            assert.equal(buffer.head, 10);
            buffer.consume(chunk_14);
            assert.equal(buffer.head, 10);
            buffer.consume(chunk_7);
            assert.equal(buffer.head, 7);
        })

        it('should cause transition to ready state after consuming three consecutive chunks [0]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_7);
            assert.equal(buffer.state, buffer.states.INITIAL_STATE);
            buffer.consume(chunk_10);
            assert.equal(buffer.state, buffer.states.INITIAL_STATE);
            buffer.consume(chunk_11);
            assert.equal(buffer.state, buffer.states.INITIAL_STATE);
            buffer.consume(chunk_14);
            assert.equal(buffer.state, buffer.states.INITIAL_STATE);
            buffer.consume(chunk_12);
            assert.equal(buffer.state, buffer.states.READY);
        })
        it('should cause transition to ready state after consuming three consecutive chunks [1]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_12);
            buffer.consume(chunk_11);
            buffer.consume(chunk_10);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 10);

        })
        it('should cause transition to ready state after consuming three consecutive chunks [2]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_12);
            buffer.consume(chunk_10);
            buffer.consume(chunk_11);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 10);
        })
        it('should cause transition to ready state after consuming three consecutive chunks [3]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_11);
            buffer.consume(chunk_10);
            buffer.consume(chunk_12);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 10);
        })
        it('should cause transition to ready state after consuming three consecutive chunks [4]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_11);
            buffer.consume(chunk_12);
            buffer.consume(chunk_10);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 10);
        })
        it('should cause transition to ready state after consuming three consecutive chunks [5]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_10);
            buffer.consume(chunk_12);
            buffer.consume(chunk_11);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 10);
        })
        it('should cause transition to ready state after consuming three consecutive chunks [6]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_10);
            buffer.consume(chunk_11);
            buffer.consume(chunk_12);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 10);
        })
        it('should set head to first chunk in consecutive set during transition to ready state', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_7);
            buffer.consume(chunk_10);
            buffer.consume(chunk_11);
            buffer.consume(chunk_14);
            buffer.consume(chunk_12);
            assert.equal(buffer.head, 10);
        })
        it('should not change head once in ready state', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_10);
            assert.equal(buffer.head, 10);
            buffer.consume(chunk_11);
            assert.equal(buffer.head, 10);
            buffer.consume(chunk_12);
            assert.equal(buffer.head, 10);
            buffer.consume(chunk_14);
            assert.equal(buffer.head, 10);
            buffer.consume(chunk_7);
            assert.equal(buffer.head, 10);
        })
    })
    describe('#getPiece', function () {
        var chunk_0 = new Chunk(0, new Int8Array(20000));
        var chunk_4 = new Chunk(4, new Int8Array(200));
        it('should return null when chunk is not in buffer', function () {
            var buffer = new Buffer();
            assert.deepEqual(buffer.getPiece(0, 0), null);
            assert.deepEqual(buffer.getPiece(0, 1), null);
            assert.deepEqual(buffer.getPiece(3, 0), null);
            assert.deepEqual(buffer.getPiece(4, 0), null);
        })
        it('should return the piece if found in the buffer', function () {
            var buffer = new Buffer();
            assert.deepEqual(buffer.getPiece(0, 0), null);
            buffer.consume(chunk_0);
            assert.deepEqual(buffer.getPiece(0, 0), chunk_0.pieces[0]);
            assert.deepEqual(buffer.getPiece(0, chunk_0.pieces.length), null);
            assert.deepEqual(buffer.getPiece(4, 0), null);
            assert.deepEqual(buffer.getPiece(4, 1), null);
            buffer.consume(chunk_4);
            assert.deepEqual(buffer.getPiece(4, 0), chunk_4.pieces[0]);
            assert.deepEqual(buffer.getPiece(4, 1), null);
        })
    })

    describe('#getNext', function () {
        var chunk_0 = new Chunk(0, new Int8Array(200));
        var chunk_1 = new Chunk(1, new Int8Array(200));
        var chunk_2 = new Chunk(2, new Int8Array(200));
        var chunk_3 = new Chunk(3, new Int8Array(200));
        var chunk_4 = new Chunk(4, new Int8Array(200));
        var chunk_5 = new Chunk(5, new Int8Array(200));
        var chunk_6 = new Chunk(6, new Int8Array(200));
        var chunk_7 = new Chunk(7, new Int8Array(200));
        var chunk_8 = new Chunk(8, new Int8Array(200));
        var chunk_9 = new Chunk(9, new Int8Array(200));

        it('should return null when not in state ready', function () {
            var buffer = new Buffer();
            assert.equal(buffer.state, buffer.states.INITIAL_STATE);
            assert.deepEqual(buffer.getNext(), null);
            buffer.consume(chunk_0);
            assert.equal(buffer.state, buffer.states.INITIAL_STATE);
            assert.deepEqual(buffer.getNext(), null);
            buffer.consume(chunk_1);
            assert.deepEqual(buffer.getNext(), null);
            buffer.consume(chunk_2);
            assert.equal(buffer.state, buffer.states.READY);
            assert.deepEqual(buffer.getNext(), chunk_0);
        })
        it('should return null and set state to BUFFERING when next block is not available', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
            assert.deepEqual(buffer.getNext(), chunk_0);
            assert.deepEqual(buffer.getNext(), chunk_1);
            assert.deepEqual(buffer.getNext(), chunk_2);
            assert.deepEqual(buffer.getNext(), null);
            assert.deepEqual(buffer.state, buffer.states.BUFFERING);
        })

        it('should return chunk when received two new consecutive chunks in buffering state [1]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
            // state = READY
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            // state = BUFFERING
            assert.equal(buffer.state, buffer.states.BUFFERING);

            buffer.consume(chunk_3);
            assert.equal(buffer.state, buffer.states.BUFFERING);
            assert.equal(buffer.head, 3);
            buffer.consume(chunk_4);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 3);
            assert.deepEqual(buffer.getNext(), chunk_3);
        })
        it('should return chunk when received two new consecutive chunks in buffering state [2]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
            // state = READY
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            // state = BUFFERING

            buffer.consume(chunk_4);
            assert.equal(buffer.state, buffer.states.BUFFERING);
            assert.deepEqual(buffer.getNext(), null);
            buffer.consume(chunk_3);
            assert.equal(buffer.state, buffer.states.READY);
            assert.deepEqual(buffer.getNext(), chunk_3);
            assert.deepEqual(buffer.getNext(), chunk_4);
        })

        it('should return chunk when received two new consecutive chunks in buffering state [3]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
            // state = READY
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            // state = BUFFERING

            buffer.consume(chunk_4);
            buffer.consume(chunk_6);
            buffer.consume(chunk_9);
            assert.equal(buffer.state, buffer.states.BUFFERING);
            buffer.consume(chunk_8);
            assert.equal(buffer.state, buffer.states.READY);
            assert.equal(buffer.head, 8);
            assert.deepEqual(buffer.getNext(), chunk_8);
            assert.deepEqual(buffer.getNext(), chunk_9);
        })
        it('should return chunk when received two new consecutive chunks in buffering state [4]', function () {
            var buffer = new Buffer();
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
            // state = READY
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            buffer.getNext();
            // state = BUFFERING
            buffer.consume(chunk_4);
            buffer.consume(chunk_6);
            buffer.consume(chunk_8);
            buffer.consume(chunk_9);
            assert.equal(buffer.head, 8);
            assert.deepEqual(buffer.getNext(), chunk_8);
            assert.deepEqual(buffer.getNext(), chunk_9);
        })

        it('should cause old blocks to be deleted', function () {
            var buffer = new Buffer();
            buffer.size = 4;
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
            buffer.consume(chunk_3);
            buffer.consume(chunk_4);
            buffer.consume(chunk_5);
            buffer.consume(chunk_6);

            buffer.getNext(); // 0
            buffer.getNext(); // 1
            buffer.getNext(); // 2
            buffer.getNext(); // 3
            assert.deepEqual(buffer.store[0], chunk_0);
            buffer.getNext(); // 4
            assert.deepEqual(buffer.store[1], chunk_1);
            assert.deepEqual(buffer.store[0], undefined);
            buffer.getNext(); // 5
            assert.deepEqual(buffer.store[2], chunk_2);
            assert.deepEqual(buffer.store[1], undefined);
            buffer.getNext(); // 6
            assert.deepEqual(buffer.store[2], undefined);

        })
    })

    describe('#onReady', function () {
        var chunk_0 = new Chunk(0, new Int8Array(200));
        var chunk_1 = new Chunk(1, new Int8Array(200));
        var chunk_2 = new Chunk(2, new Int8Array(200));
        var chunk_3 = new Chunk(3, new Int8Array(200));
        var chunk_4 = new Chunk(4, new Int8Array(200));
        var chunk_5 = new Chunk(5, new Int8Array(200));
        var chunk_6 = new Chunk(6, new Int8Array(200));
        var chunk_7 = new Chunk(7, new Int8Array(200));
        var chunk_8 = new Chunk(8, new Int8Array(200));
        var chunk_9 = new Chunk(9, new Int8Array(200));
        it('should be called whenever a transition to state ready occurs', function (done) {
            var buffer = new Buffer();
            var observedOnReadyCallCount = 0;
            var correctOnReadyCallCount = 0
            buffer.onReady = function () {
                observedOnReadyCallCount++;
                assert.equal(observedOnReadyCallCount, correctOnReadyCallCount);
                if (correctOnReadyCallCount === 3) {
                    done();
                }
            }

            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            correctOnReadyCallCount++;
            buffer.consume(chunk_2);
            setTimeout(function () {
                buffer.getNext();
                buffer.getNext();
                buffer.getNext();
                buffer.getNext();

                buffer.consume(chunk_4);
                correctOnReadyCallCount++;
                buffer.consume(chunk_5);

                setTimeout(function () {
                    buffer.getNext();
                    buffer.getNext();
                    buffer.getNext();

                    buffer.consume(chunk_6);
                    correctOnReadyCallCount++;
                    buffer.consume(chunk_7);
                })
            }, 5)
        })
        it('should be called when transitioning from initial state [1]', function (done) {
            var buffer = new Buffer();
            buffer.onReady = function () {
                assert.equal(buffer.state, buffer.states.READY);
                done();
            }
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
        })
        it('should be called when transitioning from initial state [2]', function (done) {
            var buffer = new Buffer();
            buffer.onReady = function () {
                assert.equal(buffer.state, buffer.states.READY);
                done();
            }
            buffer.consume(chunk_0);
            buffer.consume(chunk_2);
            buffer.consume(chunk_1);
        })
        it('should be called when transitioning from initial state [3]', function (done) {
            var buffer = new Buffer();
            buffer.onReady = function () {
                assert.equal(buffer.state, buffer.states.READY);
                done();
            }
            buffer.consume(chunk_1);
            buffer.consume(chunk_0);
            buffer.consume(chunk_2);
        })
        it('should be called when transitioning from initial state [4]', function (done) {
            var buffer = new Buffer();
            buffer.onReady = function () {
                assert.equal(buffer.state, buffer.states.READY);
                done();
            }
            buffer.consume(chunk_1);
            buffer.consume(chunk_2);
            buffer.consume(chunk_0);
        })
        it('should be called when transitioning from initial state [5]', function (done) {
            var buffer = new Buffer();
            buffer.onReady = function () {
                assert.equal(buffer.state, buffer.states.READY);
                done();
            }
            buffer.consume(chunk_2);
            buffer.consume(chunk_0);
            buffer.consume(chunk_1);
        })
        it('should be called when transitioning from initial state [6]', function (done) {
            var buffer = new Buffer();
            buffer.onReady = function () {
                assert.equal(buffer.state, buffer.states.READY);
                done();
            }
            buffer.consume(chunk_2);
            buffer.consume(chunk_1);
            buffer.consume(chunk_0);
        })
    })
})
