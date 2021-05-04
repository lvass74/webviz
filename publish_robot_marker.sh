#!/bin/bash
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
source /opt/ros/foxy/setup.bash

ros2 topic pub robot_marker visualization_msgs/msg/MarkerArray "
markers:
- header:
    frame_id: 'base_link'
  ns: ''
  id: 0
  type: 103
  action: 0
  pose:
    position: {x: 0, y: 0, z: 0.0}
    orientation: {x: 0.0, y: 0.0, z: 0.0, w: 1.0}
" -r 5

