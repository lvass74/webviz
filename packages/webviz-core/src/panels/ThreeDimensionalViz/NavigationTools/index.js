// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import NavigationGoalIcon from "@mdi/svg/svg/arrow-collapse-right.svg";
import InitialPoseIcon from "@mdi/svg/svg/arrow-collapse-down.svg";
import * as React from "react";

import Button from "webviz-core/src/components/Button";
import Icon from "webviz-core/src/components/Icon";
import MeasuringTool, { type MeasureInfo } from "webviz-core/src/panels/ThreeDimensionalViz/DrawingTools/MeasuringTool";
import styles from "webviz-core/src/panels/ThreeDimensionalViz/Layout.module.scss";
import colors from "webviz-core/src/styles/colors.module.scss";
import NavigationGoal, { type NavigationGoalInfo } from "./NavigationGoal";

type Props = {
  navigationGoal: ?NavigationGoal,
  navigationGoalInfo: NavigationGoalInfo,
  perspective: boolean,
};

function NavigationTools({
  navigationGoal,
  navigationGoalInfo: { state },
  perspective = false,
}: Props) {
  //FIXME: implement initial pose marker
  const initialPoseMarker = null;
  const initialPoseMarkerActive = false;

  const navigationGoalActive = state === "place-start" || state === "place-finish";
  return (
    <div className={styles.buttons}>
      <Button
        disabled={perspective}
        tooltip={
          perspective
            ? "Switch to 2D Camera to set initial pose"
            : initialPoseMarkerActive
              ? "Cancel initial pose marker"
              : "Set initial pose marker"
        }
        onClick={initialPoseMarker ? initialPoseMarker.toggleState : undefined}>
        <Icon
          style={{
            color: initialPoseMarkerActive ? colors.accent : perspective ? undefined : "white",
          }}>
          <InitialPoseIcon />
        </Icon>
      </Button>
      <Button
        disabled={perspective}
        tooltip={
          perspective
            ? "Switch to 2D Camera to set navigation goal"
            : navigationGoalActive
              ? "Cancel Nagation Goal Marker"
              : "Set Navigation Goal Marker"
        }
        onClick={navigationGoal ? navigationGoal.toggleState : undefined}>
        <Icon
          style={{
            color: navigationGoalActive ? colors.accent : perspective ? undefined : "white",
          }}>
          <NavigationGoalIcon />
        </Icon>
      </Button>
    </div>
  );
}

export default React.memo < Props > (NavigationTools);
