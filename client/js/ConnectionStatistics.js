var ConnectionStatistics = (function (dom_container_id) {

    var container = document.getElementById(dom_container_id);


    var list = function () {
        var ul = document.createElement("ul");
        ul.classList.add("list-unstyled");
        ul.style.font = "monospace";

        return ul;
    }

    var headline = function (text) {
        var h3 = document.createElement("h3");
        h3.appendChild(document.createTextNode(text));
        return h3;
    }

    var parents = new list();
    var children = new list();

    container.appendChild(new headline("parents"));
    container.appendChild(parents);
    container.appendChild(document.createElement("hr"));
    container.appendChild(new headline("children"));
    container.appendChild(children);

    var values = {}

    setInterval(function () {
        render();
    }, 500);

    var renderCoordinate = function (coordinate) {
        return "(" + coordinate.x.toFixed(2) + ", " + coordinate.y.toFixed(2) + ")";
    }

    var renderConnection = function (connection_id) {
        return renderCoordinate(values[connection_id].coordinate) + " <b>" + values[connection_id].score.toFixed(3) + "</b>"
    }
    var render = function () {
        Object.keys(values).forEach(function (connection_id) {
            var li = document.getElementById(connection_id);
            if (li) {
                li.innerHTML = renderConnection(connection_id);
            }
        });
    }


    this.addChild = function (connection) {
        var li = document.createElement("li");
        li.id = connection.id;
        children.appendChild(li);
        this.update(connection)
    }
    this.addParent = function (connection) {
        var li = document.createElement("li");
        li.id = connection.id;
        parents.appendChild(li);
        this.update(connection)
    }

    this.remove = function (connection) {
        //console.log("removing connection " + connection.id + " from stats view");
        var li = document.getElementById(connection.id);
        li.parentNode.removeChild(li);
        delete values[connection.id];
    }

    this.update = function (connection) {
        values[connection.id] = {
            score: connection.score,
            coordinate: connection.coordinate
        };
    }


})
