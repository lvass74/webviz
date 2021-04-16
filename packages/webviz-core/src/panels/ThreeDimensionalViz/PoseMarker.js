// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import React from "react";
import { Spheres, Arrows, type Point, type Pose, type Color } from "regl-worldview";

type Props = {
  points: { start: ?Point, end: ?Point },
  color: Color,
  labelPrefix: string,
};

const sphereSize: number = 0.3;
const lineSize: number = 0.1;

const defaultSphere: any = Object.freeze({
  type: 2,
  action: 0,
  scale: { x: sphereSize, y: sphereSize, z: 0.1 },
});

const defaultPose: Pose = Object.freeze({ orientation: { x: 0, y: 0, z: 0, w: 1 } });
const defaultColor: Color = Object.freeze({ r: 1, g: 1, b: 1, a: 1 });

export default function PoseMarker({ points: { start, end }, color = defaultColor, labelPrefix }: Props) {
  const spheres = [];
  const arrows = [];
  if(start) {
    const startPoint = { ...start };

    spheres.push({
      ...defaultSphere,
      id: `_${labelPrefix}_start`,
      pose: { position: startPoint, ...defaultPose },
      color: { ...color },
    });

    if(start && end) {
      arrows.push({
        id: `_${labelPrefix}_arrow`,
        points: [start, end || start],
        pose: { ...defaultPose, position: { ...start } },
        scale: { x: lineSize, y: sphereSize, z: sphereSize },
        color: { ...color },
      });
    }
  }

  return (
    <>
      {spheres.length > 0 && <Spheres>{spheres}</Spheres>}
      {arrows.length > 0 && <Arrows>{arrows}</Arrows>}
    </>
  );
}
