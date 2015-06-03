var Chunk = Chunk || require('./Chunk.js');

var ChunkBuffer = (function () {
    var self = this;

    this.states = {
        "INITIAL_STATE": 0,
        "BUFFERING": 1,
        "READY": 2
    }
    this.state = this.states.INITIAL_STATE;
    this.store = {};
    this.head = 65536;
    this.size = 10; // store up to this number of chunks

    this.onReady = function () {}
    this.onDelete = function() {};

    this.transitionToState = function (state) {
        if (this.state != state) this.notifyStateChange();
        this.state = state;
    }
    this.notifyStateChange = function () {};

    this.consume = function (chunk) {
        this.store[chunk.seq_num] = chunk;

        if (this.state === this.states.INITIAL_STATE) {
            this.head = Math.min(this.head, chunk.seq_num);
            if (this.store[chunk.seq_num-1] && this.store[chunk.seq_num-2]) {
                this.transitionToState(this.states.READY);
                this.state = this.states.READY;
                this.head = chunk.seq_num-2;
                this.onReady();
            }
            else if (this.store[chunk.seq_num-1] && this.store[chunk.seq_num+1]) {
                this.transitionToState(this.states.READY);
                this.head = chunk.seq_num-1;
                this.onReady();
            }
            else if (this.store[chunk.seq_num+1] && this.store[chunk.seq_num+2]) {
                this.transitionToState(this.states.READY);
                this.head = chunk.seq_num;
                this.onReady();
            }
        }

        else if (this.state === this.states.BUFFERING) {
            if (chunk.seq_num-1 >= this.head && this.store[chunk.seq_num-1]) {
            //if (chunk.seq_num === this.head+1) {
                this.transitionToState(this.states.READY);
                this.head = chunk.seq_num-1;
                this.onReady();
            }
            else if (chunk.seq_num >= this.head && this.store[chunk.seq_num+1]) {
                this.transitionToState(this.states.READY);
                this.head = chunk.seq_num;
                this.onReady();
            }
        }
    }

    this.getPiece = function (chunk_num, piece_num) {
        if (chunk_num in this.store) {
            if (piece_num < this.store[chunk_num].pieces.length) {
                return this.store[chunk_num].pieces[piece_num];
            }
        }
        return null;
    }

    this.getNext = function () {
        if (this.state != this.states.READY) return null;
        if (this.head in this.store) {
            delete this.store[this.head - this.size]
            this.onDelete(this.head - this.size);
            return this.store[this.head++];
        } else {
            this.transitionToState(this.states.BUFFERING);
            return null;
        }
    }
});

var module = module || {};
module.exports = ChunkBuffer;
