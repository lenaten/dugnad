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
            viewer_count.append(viewer_count[-1]-1)
    return timestamps, viewer_count

def main(inputfile):

    with open(inputfile) as rawdata:
        events = json.load(rawdata)

    x, y = gather_viewer_count(events)

    # add data series
    # linestyle [ls]: '-', '--', '-.', ':' )
    # linewidth [lw]: <float>
    # color [c]: [b]lue, [g]reen, [r]ed, [c]yan, [m]agenta, [y]ellow, [k]black, [w]hite, hex: '#ffaa32'

    plt.plot(x, y)
    plt.xlabel("time [sec]")
    plt.ylabel("viewers [#]")
    plt.show()



if __name__ == "__main__":
    if len(sys.argv) == 2:
        main(sys.argv[1])
    else:
        print "Usage: %s <data file>" % sys.argv[0]
