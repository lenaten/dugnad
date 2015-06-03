var assert = require("assert");

var BufferMap = require("../js/BufferMap.js");
var Chunk = require("../js/Chunk.js");


describe('BufferMap', function () {
    describe('#constructor', function () {
        var bm = new BufferMap();
        it('should expose function add', function () {
            assert.equal(Object.prototype.toString.call(bm.add), "[object Function]");
        })
        it('should expose function remove', function () {
            assert.equal(Object.prototype.toString.call(bm.remove), "[object Function]");
        })
        it('should expose function available', function () {
            assert.equal(Object.prototype.toString.call(bm.available), "[object Function]");
        })
        it('should expose function missing', function () {
            assert.equal(Object.prototype.toString.call(bm.missing), "[object Function]");
        })
        it('should have empty map', function () {
            assert.deepEqual(bm.map, {});
        })
    })

    describe('#add', function () {
        var chunk = new Chunk(1, new Int8Array(20000));
        var pieces = chunk.pieces;
        it('should change map property to true for given block', function () {
            var bm = new BufferMap();

            var header = Chunk.getHeader(pieces[0])
            bm.add(header);
            assert.equal(bm.map[header.chunk_num].length, header.piece_count);
            assert(bm.map[header.chunk_num][header.piece_num]);

            var header2 = Chunk.getHeader(pieces[1])
            bm.add(header2)
            assert.equal(bm.map[header.chunk_num].length, header.piece_count);
            assert(bm.map[header.chunk_num][header.piece_num]);

            assert.equal(bm.map[header2.chunk_num].length, header.piece_count);
            assert(bm.map[header2.chunk_num][header.piece_num]);
        })
    })

    describe('#remove', function () {
        var chunk_1 = new Chunk(1, new Int8Array(20000));
        var chunk_2 = new Chunk(2, new Int8Array(20000));
        it('should remove all information about chunk seq num from index', function () {
            var bm = new BufferMap();
            var header_1_0 = Chunk.getHeader(chunk_1.pieces[0]);
            var header_1_1 = Chunk.getHeader(chunk_1.pieces[1]);
            var header_2_0 = Chunk.getHeader(chunk_2.pieces[0]);
            var header_2_1 = Chunk.getHeader(chunk_2.pieces[1]);

            bm.add(header_1_0);
            assert(bm.map[header_1_0.chunk_num]);
            assert.deepEqual(bm.map[header_2_1.chunk_num], undefined);

            bm.remove(header_1_0.chunk_num);
            assert.deepEqual(bm.map[header_1_0.chunk_num], undefined);

            assert.deepEqual(bm.map, {});
        })
    })

    describe('#available', function () {
        var c1 = new Chunk(1, new Int8Array(200000));
        var c2 = new Chunk(2, new Int8Array(200000));
        var c3 = new Chunk(3, new Int8Array(200000));

        it('should return empty object only when nothing is available', function () {
            var bm = new BufferMap();
            assert.deepEqual(bm.available(), {});
            var header = Chunk.getHeader(c1.pieces[0]);
            bm.add(header);
            assert.notDeepEqual(bm.available(), {})
            bm.remove(header.chunk_num);
            assert.deepEqual(bm.available(), {});
        })

        it('should give available chunks in ascending order', function () {
            var bm = new BufferMap();

            bm.add(Chunk.getHeader(c1.pieces[3]));
            assert.deepEqual(bm.available(), {1: [3]});
            bm.add(Chunk.getHeader(c1.pieces[1]));
            assert.deepEqual(bm.available(), {1: [1, 3]});


            bm.add(Chunk.getHeader(c3.pieces[0]));
            bm.add(Chunk.getHeader(c3.pieces[3]));
            bm.add(Chunk.getHeader(c3.pieces[7]));


            assert.deepEqual(bm.available(), {1: [1, 3], 3: [0, 3, 7]});
            bm.remove(1);
            assert.deepEqual(bm.available(), {3: [0, 3, 7]});

            bm.add(Chunk.getHeader(c2.pieces[0]));
            assert.deepEqual(bm.available(), {2: [0], 3:[0, 3, 7]});
        })
    })

    describe('#missing', function () {
        var c1 = new Chunk(1, new Int8Array(200000));
        var c2 = new Chunk(2, new Int8Array(200000));
        var c3 = new Chunk(3, new Int8Array(200000));

        it('should return empty object if nothing has been added to map', function () {
            var bm = new BufferMap();
            assert.deepEqual(bm.missing(1), {});
            assert.deepEqual(bm.missing(0), {});
            assert.deepEqual(bm.missing(7), {});
        })

        it('should give missing chunks with chunk_nuk >= HEAD in ascending order', function () {
            var bm = new BufferMap();
            var HEAD = 1;

            bm.add(Chunk.getHeader(c1.pieces[3]));
            assert.deepEqual(bm.missing(HEAD), {1: [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12]});
            bm.add(Chunk.getHeader(c1.pieces[4]));
            bm.add(Chunk.getHeader(c1.pieces[6]));

            assert.deepEqual(bm.missing(HEAD), {1: [0, 1, 2, 5, 7, 8, 9, 10, 11, 12]});

            bm.add(Chunk.getHeader(c2.pieces[0]));
            bm.add(Chunk.getHeader(c2.pieces[1]));
            bm.add(Chunk.getHeader(c2.pieces[2]));
            bm.add(Chunk.getHeader(c2.pieces[3]));
            bm.add(Chunk.getHeader(c2.pieces[4]));
            bm.add(Chunk.getHeader(c2.pieces[5]));
            bm.add(Chunk.getHeader(c2.pieces[6]));
            bm.add(Chunk.getHeader(c2.pieces[7]));

            assert.deepEqual(bm.missing(HEAD), {1: [0, 1, 2, 5, 7, 8, 9, 10, 11, 12], 2:[8, 9, 10, 11, 12]});
            HEAD = 2;
            assert.deepEqual(bm.missing(HEAD), {2: [8, 9, 10, 11, 12]});
            HEAD = 3;
            assert.deepEqual(bm.missing(HEAD), {});

        })
        it('should not include complete chunks', function () {
            var bm = new BufferMap();
            var HEAD = 0;

            bm.add(Chunk.getHeader(c2.pieces[0]));
            bm.add(Chunk.getHeader(c2.pieces[1]));
            bm.add(Chunk.getHeader(c2.pieces[2]));
            bm.add(Chunk.getHeader(c2.pieces[3]));
            bm.add(Chunk.getHeader(c2.pieces[4]));
            bm.add(Chunk.getHeader(c2.pieces[5]));
            bm.add(Chunk.getHeader(c2.pieces[6]));
            bm.add(Chunk.getHeader(c2.pieces[7]));
            bm.add(Chunk.getHeader(c2.pieces[8]));
            bm.add(Chunk.getHeader(c2.pieces[9]));
            bm.add(Chunk.getHeader(c2.pieces[10]));
            bm.add(Chunk.getHeader(c2.pieces[11]));


            assert.deepEqual(bm.missing(HEAD), {2: [12]});
            bm.add(Chunk.getHeader(c2.pieces[12]));
            assert(!(bm.missing(HEAD).hasOwnProperty("2")));
        })
    })
})

