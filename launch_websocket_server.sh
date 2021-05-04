#/bin/bash
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp 
source /opt/ros/noetic/setup.bash
roslaunch rosbridge_server rosbridge_websocket.launch 


