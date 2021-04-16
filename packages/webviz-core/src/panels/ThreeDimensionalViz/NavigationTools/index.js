// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import InitialPoseIcon from "@mdi/svg/svg/arrow-collapse-down.svg";
import NavigationGoalIcon from "@mdi/svg/svg/arrow-collapse-right.svg";
import * as React from "react";

import InitialPose, { type InitialPoseInfo } from "./InitialPose";
import NavigationGoal, { type NavigationGoalInfo } from "./NavigationGoal";
import Button from "webviz-core/src/components/Button";
import Icon from "webviz-core/src/components/Icon";
import styles from "webviz-core/src/panels/ThreeDimensionalViz/Layout.module.scss";
import colors from "webviz-core/src/styles/colors.module.scss";

type Props = {
  initialPose: ?InitialPose,
  initialPoseInfo: InitialPoseInfo,
  navigationGoal: ?NavigationGoal,
  navigationGoalInfo: NavigationGoalInfo,
  perspective: boolean,
};

function NavigationTools({
  initialPose,
  initialPoseInfo: { state: initialPoseState },
  navigationGoal,
  navigationGoalInfo: { state },
  perspective = false,
}: Props) {
  const initialPoseActive = initialPoseState === "place-start" || initialPoseState === "place-finish";
  const navigationGoalActive = state === "place-start" || state === "place-finish";
  return (
    <div className={styles.buttons}>
      <Button
        disabled={perspective}
        tooltip={
          perspective
            ? "Switch to 2D Camera to set initial pose"
            : initialPoseActive
              ? "Cancel initial pose marker"
              : "Set initial pose marker"
        }
        onClick={initialPose ? initialPose.toggleState : undefined}>
        <Icon
          style={{
            color: initialPoseActive ? colors.accent : perspective ? undefined : "white",
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
