#! /bin/bash
# /etc/init.d/stream-server.sh

STREAM_SERVER=/home/pi/jsmpeg/stream-server.js

case "$1" in
  start)
    echo "Starting stream-server"
    sudo -u pi forever start $STREAM_SERVER abc 8082 8084
    sudo -u pi forever start $STREAM_SERVER abc 8083 8085
    ;;
  stop)
    echo "Stopping stream-server"
    sudo -u pi forever stop $STREAM_SERVER abc 8082 8084
    sudo -u pi forever stop $STREAM_SERVER abc 8083 8085
    ;;
  *)
    echo "Usage: /etc/init.d/stream-server.sh {start|stop}"
    exit 1
    ;;
  esac
exit 0