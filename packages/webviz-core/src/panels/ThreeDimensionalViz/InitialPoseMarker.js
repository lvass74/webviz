// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import React from "react";
import { type Point } from "regl-worldview";

import PoseMarker from "./PoseMarker";

type Props = {
  points: { start: ?Point, end: ?Point },
};

const defaultColor: any = Object.freeze({ r: 0, g: 0.5, b: 0, a: 1 });

export default function InitialPoseMarker({ points: { start, end } }: Props) {
  return <PoseMarker points={{ start, end }} color={defaultColor} labelPrefix="initial_pose" />;
}
