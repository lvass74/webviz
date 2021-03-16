// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import { isEqual } from "lodash";
import * as React from "react";
import { type ReglClickInfo } from "regl-worldview";

import type { Point } from "webviz-core/src/types/Messages";
import { arrayToPoint } from "webviz-core/src/util";

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

  toggleState = () => {
    console.log('toggleState', this.props.state)
    const newState = this.props.state === "idle" ? "place-start" : "idle";
    console.log('toggleState', newState)
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
    console.log('MouseDown', e.clientX, e.clientY, _clickInfo.ray, arrayToPoint(_clickInfo.ray.planeIntersection([0, 0, 0], [0, 0, 1])))
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
    if (!this.measureActive) {
      return null;
    }

    return this._canvasMouseMoveHandler;
  }

  get onMouseUp(): ?(MouseEvent, ReglClickInfo) => void {
    if (!this.measureActive) {
      return null;
    }

    return this._canvasMouseUpHandler;
  }

  get onMouseDown(): ?(MouseEvent, ReglClickInfo) => void {
    if (!this.measureActive) {
      return null;
    }

    return this._canvasMouseDownHandler;
  }

  get measureActive(): boolean {
    const { state } = this.props;
    return state === "place-start" || state === "place-finish";
  }

  get measureDistance(): string {
    const { start, end } = this.props.points;
    let dist_string = "";
    if (start && end) {
      const dist = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
      dist_string = `${dist.toFixed(2)}m`;
    }

    return dist_string;
  }

  render() {
    return null;
  }
}
