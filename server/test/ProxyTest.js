var assert = require("assert");

var Proxy = require("../src/Proxy.js");
var ConnectionManager = require("../src/ConnectionManager.js");

describe("Proxy", function () {
    var Socket = (function (id) {
        this.id = id;
    })

    var host = new Socket("host");
    var alice = new Socket("a");
    var bob = new Socket("b");
    var carol = new Socket("c");
    var darth = new Socket("d");

    describe("#constructor", function () {
        var proxy = new Proxy();
        it("should expose function setHost", function () {
            assert.equal(Object.prototype.toString.call(proxy.setHost), "[object Function]");
        })
        it("should expose function bootstrap", function () {
            assert.equal(Object.prototype.toString.call(proxy.bootstrap), "[object Function]");
        })
        it("should expose function disconnect", function () {
            assert.equal(Object.prototype.toString.call(proxy.disconnect), "[object Function]");
        })
        it("should expose function forward", function () {
            assert.equal(Object.prototype.toString.call(proxy.forward), "[object Function]");
        })
    })

    describe("#addHost", function () {
        it("should set host property host_connection to given socket", function () {
            var proxy = new Proxy();
            proxy.setHost(host);
            assert.equal(proxy.host_connection.socket, host);
        })
    })

    describe("#bootstrap", function () {
        it("should return null before host is set", function () {
            var proxy = new Proxy();
            assert.deepEqual(proxy.bootstrap(alice), null);
        })

        it("should return bootstrap response object when host is set", function () {
            var proxy = new Proxy();
            proxy.setHost(host);

            var response = proxy.bootstrap(alice);
            assert(response.hasOwnProperty("coordinate"));
            assert(response.hasOwnProperty("parents"));
            assert(response.hasOwnProperty("children"));
            assert.equal(Object.prototype.toString.call(response.coordinate), "[object Object]");
            assert.equal(Object.prototype.toString.call(response.parents), "[object Array]");
            assert.equal(Object.prototype.toString.call(response.children), "[object Array]");
        })

        it("should have empty children and host as only parent for first join after host", function () {
            var proxy = new Proxy();

            proxy.setHost(host);
            var response = proxy.bootstrap(alice);

            assert.deepEqual(response.children, []);
            assert.deepEqual(response.parents[0].coordinate, proxy.host_connection.coordinate);
        })

        it("should have total expected number of parents and children after bootstrap [handmade]", function () {
            var proxy = new Proxy();
            proxy.peer_set_limit = 2;
            proxy.setHost(host);

            var res;
            res = proxy.bootstrap(alice);
            assert(res.children.length + res.parents.length === 1);
            res = proxy.bootstrap(bob);
            assert(res.children.length + res.parents.length === 2);
            res = proxy.bootstrap(carol);
            assert(res.children.length + res.parents.length <= 3);
            res = proxy.bootstrap(darth);
            assert(res.children.length + res.parents.length <= 3);
        })

        it("should have total expected number of parents and children after bootstrap [generated]", function () {
            var proxy = new Proxy();
            proxy.peer_set_limit = 20;
            proxy.setHost(host);

            var num_children = 0;
            var num_parents = 0;
            var N = 1000;
            for (var i = 0; i < N; i++) {
                var res = proxy.bootstrap(new Socket(i));
                num_children += res.children.length;
                num_parents += res.parents.length;


                assert(res.parents.length > 0,
                    "\n----- " + i + " -----\n" + "\n" + JSON.stringify(proxy.manager.connections[1]) + "\n" + JSON.stringify(res) );
                assert(res.parents.length <= 11);
                if (res.parents.length === 11) {
                    // should add host connection at index 0
                    assert.equal(res.parents[0].coordinate, proxy.host_connection.coordinate);
                }
                assert(res.children.length >= 0);
                assert(res.children.length <= 10);
            }

            assert(num_children/N > 9);
            assert(num_parents/N > 9);
            assert(num_parents/N < 10);
            assert(num_children/N < 10);
        })
    })
})
