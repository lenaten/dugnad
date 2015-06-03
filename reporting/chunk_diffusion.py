#!/usr/bin/python

import sys
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import json

def get_t0(events):
    return events[0]['t']

def event_time(event, t0):
    return ((event['t'] - t0) % 100000000)*1.0/1000


def gather_spawn_times(events):
    t0 = get_t0(events)
    spawns = []
    for event in events:
        if event['type'] == "spawn":
            spawns.append({'t': event_time(event, t0), 'n': event['n']})
    return spawns

def gather_receive_times(events):
    t0 = get_t0(events)
    receives = {}
    for event in events:
        if event['type'] == "receive":
            chunk_num = event['n']
            if not chunk_num in receives:
                receives[chunk_num] = {"latest": -1, "peers": []}


            receives[chunk_num]["peers"].append({"id": event['id'], "t": event_time(event, t0)})
            receives[chunk_num]["latest"] = min(receives[chunk_num]["latest"], event_time(event, t0))
    return receives

def gather_viewer_count(events):
    t0 = get_t0(events)
    viewers = {}
    viewer_count = []
    for event in events[1:]:
        if event['type'] == "join":
            viewers[event['id']] = event_time(event, t0)
        if event['type'] == "leave":
            viewers.pop(event['id'], None)
        if event['type'] == "spawn":
            viewer_count.append(len(viewers.keys()))
    return viewer_count


def export(inputfile):
    pass


def main(inputfile):

    with open(inputfile) as rawdata:
        events = json.load(rawdata)

    spawn_times = gather_spawn_times(events)
    receive_times = gather_receive_times(events)

    chunks = range(spawn_times[-1]["n"] + 1)[1::]
    spawn = [spawn_times[i]['t'] for i in range(len(spawn_times))]

    # check interval between each spawn
    #for i in range(1, len(spawn)):
    #    print spawn[i] - spawn[i-1]

    latest_receive = []
    num_reveive = []
    for c in chunks:
        if c in receive_times:
            latest_receive.append(receive_times[c]['peers'][-1]['t'])
            num_reveive.append(len(receive_times[c]["peers"]))
        else:
            latest_receive.append(0)
            num_reveive.append(0)

    num_viewers = gather_viewer_count(events)



    # initialize plot
    fig, chunk_plot = plt.subplots()
    viewers_plot = chunk_plot.twinx()
    # restrict axis ticks to integer
    viewers_plot.get_yaxis().set_major_locator(ticker.MaxNLocator(integer=True))
    viewers_plot.set_ylim([0, max(num_viewers)+5])

    # add data series
    # linestyle [ls]: '-', '--', '-.', ':' )
    # linewidth [lw]: <float>
    # color [c]: [b]lue, [g]reen, [r]ed, [c]yan, [m]agenta, [y]ellow, [k]black, [w]hite, hex: '#ffaa32'
    chunk_plot.plot(chunks, spawn, ls='-', lw=1, c='m', label="spawn")
    chunk_plot.plot(chunks, latest_receive, ls='--', lw=2, c='k', label="latest receive")

    viewers_plot.plot(chunks, num_reveive, ls='-.', lw=2, c='b', label="# receiving viewers")
    viewers_plot.plot(chunks, num_viewers, ls=':', lw=2, c='r', label="# connected viewers")



    chunk_plot.set_xlabel("Chunk Sequence Number")
    chunk_plot.set_ylabel("Time [s]")
    viewers_plot.set_ylabel("Number of Viewers")

    chunk_plot.legend(loc="upper left")
    viewers_plot.legend(loc="upper right")
    plt.show()



if __name__ == "__main__":
    if len(sys.argv) == 2:
        main(sys.argv[1])
    elif len (sys.argv) == 3 and sys.argv[2] == "-e":
        export(sys.argv[1])
    else:
        print "Usage: %s [-e] <data file>" % sys.argv[0]
