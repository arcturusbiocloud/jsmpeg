#! /bin/bash
# /etc/init.d/stream-server.sh

case "$1" in
  start)
    echo "Starting stream-server"
    su pi -c 'v4l2-ctl -d /dev/video1 -c focus_auto=0'
    su pi -c 'v4l2-ctl -d /dev/video2 -c focus_auto=0'
    su pi -c 'node /home/pi/jsmpeg/stream-server.js abc 8082 8084 < /dev/null &'
    su pi -c 'node /home/pi/jsmpeg/stream-server.js abc 8083 8085 < /dev/null &'
    ;;
  stop)
    echo "Stopping stream-server"
    sudo killall node
    sudo killall avconv
    ;;
  *)
    echo "Usage: /etc/init.d/stream-server.sh {start|stop}"
    exit 1
    ;;
  esac
exit 0