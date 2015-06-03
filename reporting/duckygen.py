#!/usr/bin/python
import sys

def main(args):
    if len(args) != 2:
        print "Usage: %s <url>" % args[0]
        return

    url = args[1]

    commands = "\n".join([
        "DELAY 500",
        "STRING " + url + ":2000/b.html",
        "DELAY 50",
        "ENTER"
    ])
    print commands


if __name__ == "__main__":
    main(sys.argv)
