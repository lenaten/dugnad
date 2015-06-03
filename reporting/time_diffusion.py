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
    chunks = []
    timestamps = []
    for event in events:
        if event['type'] == "spawn":
            timestamps.append(event_time(event, t0))
            chunks.append(event['n'])
    return timestamps, chunks

def gather_receive_times(events, chunk):
    t0 = get_t0(events)
    y = []
    nodes_reached = [0]
    timestamps = []
    for event in events:
        if event['type'] == "receive" and event['n'] == chunk:
            y.append(chunk)
            nodes_reached.append(nodes_reached[-1] + 1)
            timestamps.append(event_time(event, t0))

    #return timestamps, nodes_reached[1::]
    return timestamps, y

def gather_viewer_count(events):
    t0 = get_t0(events)
    viewer_count = [0]
    timestamps = [0]
    for event in events[1:]:
        if event['type'] == "join":
            timestamps.append(event_time(event, t0))
            viewer_count.append(viewer_count[-1]+1)
        if event['type'] == "leave":
            timestamps.append(event_time(event, t0))
            viewer_count.append(max(0, viewer_count[-1]-1))
    return timestamps, viewer_count


def main(inputfile):

    with open(inputfile) as rawdata:
        events = json.load(rawdata)

    # add data series
    # linestyle [ls]: '-', '--', '-.', ':' )
    # linewidth [lw]: <float>
    # color [c]: [b]lue, [g]reen, [r]ed, [c]yan, [m]agenta, [y]ellow, [k]black, [w]hite, hex: '#ffaa32'
    time, chunks = gather_spawn_times(events)

    for chunk in chunks:
        x, y = gather_receive_times(events, chunk)
        plt.plot(x, y, c='black', lw=1.5, ls='-')

    x, y = gather_viewer_count(events)
    plt.plot(x, y)

    #plt.plot(time, chunks, c='blue', lw=1, ls='-')

    plt.xlabel = "time [sec]"
    plt.ylabel = "chunk"
    plt.show()

def export(inputfile):

    with open(inputfile) as rawdata:
        events = json.load(rawdata)

    spawns, chunks = gather_spawn_times(events)

    diffusion_times = []
    node_cnt = []

    for chunk in chunks:
        times, chunk_num = gather_receive_times(events, chunk)
        if times:
            _y = times[-1] - spawns[len(diffusion_times)]
        else:
            _y = 0

        node_cnt.append(len(times))
        diffusion_times.append(_y)


    index = np.arange(len(diffusion_times))
    bar_width = 0.5
    opacity = 0.4


    fig, diffusionplt = plt.subplots()
    viewerplt = diffusionplt.twinx()
    viewerplt.set_ylim(0, max(node_cnt)+5)


    viewerplt.plot(index, node_cnt, color='k', ls="-", label="viewers");
    diffusionplt.bar(index, diffusion_times, bar_width,
        alpha=opacity,
        color='b',
        label="Diffusion Time")

    viewerplt.bar([0], [0], 0, color='b', label="diffusion time");


    viewerplt.set_ylabel("# of viewers");
    diffusionplt.set_ylabel("time [s]")
    diffusionplt.set_xlabel("chunk")

    plt.legend()
    plt.tight_layout()
    plt.show()


    """
    plt.plot(x, y)
    plt.xlabel = "chunk"
    plt.ylabel = "diffusion time [s]"
    plt.show()
    """






if __name__ == "__main__":
    if len(sys.argv) == 2:
        main(sys.argv[1])
    elif len (sys.argv) == 3 and sys.argv[1] == "-e":
        export(sys.argv[2])
    else:
        print "Usage: %s [-e] <data file>" % sys.argv[0]
