#! /bin/bash
# /etc/init.d/stream-server.sh

OUT_LOG=/dev/null
STREAM_SERVER=/home/pi/jsmpeg/stream-server.js

case "$1" in
  start)
    echo "Starting stream-server"
    node $STREAM_SERVER abc 8082 8084 1>$OUT_LOG 2>$OUT_LOG &
    node $STREAM_SERVER abc 8083 8085 1>$OUT_LOG 2>$OUT_LOG &
    ;;
  stop)
    echo "Stopping stream-server"
    killall node
    ;;
  *)
    echo "Usage: /etc/init.d/stream-server.sh {start|stop}"
    exit 1
    ;;
  esac
exit 0