// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import { isEqual } from "lodash";
import * as React from "react";
import { type Pose, type ReglClickInfo } from "regl-worldview";

import type { Point } from "webviz-core/src/types/Messages";
import { arrayToPoint } from "webviz-core/src/util";
import { vec3, quat } from "gl-matrix";

import Publisher from "webviz-core/src/components/Publisher";

const UNIT_X_VECTOR = Object.freeze([1, 0, 0]);

export type NavigationGoalState = "idle" | "place-start" | "place-finish";

export type NavigationGoalInfo = {|
  state: NavigationGoalState,
    points: { start: ? Point, end: ?Point },
|};

type Props = {|
  onNavigationGoalInfoChange: (NavigationGoalInfo) => void,
  ...NavigationGoalInfo,
|};

/* eslint-disable no-restricted-syntax */

export default class NavigationGoal extends React.Component<Props> {
  mouseDownCoords: number[] = [-1, -1];
  _publisher = React.createRef < Publisher > ();

  toggleState = () => {
    const newState = this.props.state === "idle" ? "place-start" : "idle";
    this.props.onNavigationGoalInfoChange({
      state: newState,
      points: { start: undefined, end: undefined },
    });
  };

  reset = () => {
    this.props.onNavigationGoalInfoChange({
      state: "idle",
      points: { start: undefined, end: undefined },
    });
  };

  _canvasMouseDownHandler = (e: MouseEvent, _clickInfo: ReglClickInfo) => {
    this.mouseDownCoords = [e.clientX, e.clientY];
  };

  _canvasMouseUpHandler = (e: MouseEvent, _clickInfo: ReglClickInfo) => {
    const mouseUpCoords = [e.clientX, e.clientY];
    const { state, points, onNavigationGoalInfoChange } = this.props;

    if (!isEqual(mouseUpCoords, this.mouseDownCoords)) {
      return;
    }

    if (state === "place-start") {
      onNavigationGoalInfoChange({ state: "place-finish", points });
    } else if (state === "place-finish") {
      // Use setImmediate so there is a tick between resetting the measure state and clicking the 3D canvas.
      // If we call onNavigationGoalInfoChange right away, the clicked object context menu will show up upon finishing measuring.

      if (this._publisher.current) {
        this._publisher.current.publish({
          header: {
            stamp: {
              sec: 100, // fixme: get clock
              nanosec: 0
            },
            frame_id: "map" //fixme: is this the correct frame id?
          },
          pose: this.pose
        })
      }
      setImmediate(() => {
        onNavigationGoalInfoChange({ points, state: "idle" });
      });
    }
  };

  _canvasMouseMoveHandler = (e: MouseEvent, clickInfo: ReglClickInfo) => {
    const { state, points, onNavigationGoalInfoChange } = this.props;
    switch (state) {
      case "place-start":
        onNavigationGoalInfoChange({
          state,
          points: {
            start: arrayToPoint(clickInfo.ray.planeIntersection([0, 0, 0], [0, 0, 1])),
            end: undefined,
          },
        });
        break;

      case "place-finish":
        onNavigationGoalInfoChange({
          state,
          points: {
            ...points,
            end: arrayToPoint(clickInfo.ray.planeIntersection([0, 0, 0], [0, 0, 1])),
          },
        });
        break;
    }
  };

  get onMouseMove(): ?(MouseEvent, ReglClickInfo) => void {
    if (!this.active) {
      return null;
    }

    return this._canvasMouseMoveHandler;
  }

  get onMouseUp(): ?(MouseEvent, ReglClickInfo) => void {
    if (!this.active) {
      return null;
    }

    return this._canvasMouseUpHandler;
  }

  get onMouseDown(): ?(MouseEvent, ReglClickInfo) => void {
    if (!this.active) {
      return null;
    }

    return this._canvasMouseDownHandler;
  }

  get active(): boolean {
    const { state } = this.props;
    return state === "place-start" || state === "place-finish";
  }


  get pose(): string {
    const { start, end } = this.props.points;
    let dir;
    if (start && end) {
      const startPosition = [start.x, start.y, start.z];
      const endPosition = [end.x, end.y, end.z]
      dir = vec3.subtract([0, 0, 0], endPosition, startPosition);
      vec3.normalize(dir, dir);
      const orientationArr = quat.rotationTo([0, 0, 0, 0], UNIT_X_VECTOR, dir);
      const orientationKeys = ['x', 'y', 'z', 'w'];
      const orientation = {};
      orientationArr.forEach((value, index) => orientation[orientationKeys[index]] = Math.round(value * 100) / 100)
      return {
        position: { ...start },
        orientation
      };

    }
    return null;
  }

  get poseAsJson() {
    if (!this.pose) return this.pose;
    return JSON.stringify(this.pose);
  }

  get poseAsYaml() {

    if (!this.pose) return this.pose;
    const { position, orientation } = this.pose;
    return `{ position: { x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)} },
    orientation: { x: ${orientation.x.toFixed(2)}, y: ${orientation.y.toFixed(2)}, z: ${orientation.z.toFixed(2)}, w: ${orientation.w.toFixed(2)} }}`

  }

  render() {
    return <Publisher ref={this._publisher} topic="/goal_pose" datatype="geometry_msgs/msg/PoseStamped" name="NavigationGoalPublisher" />
  }
}
