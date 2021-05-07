// @flow
//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import { quat } from "gl-matrix";
import React, { useMemo } from "react";
import { GLTFScene, parseGLB, type Pose, type Scale, type CommonCommandProps } from "regl-worldview";
import { LoadingManager, Scene } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import URDFLoader from "urdf-loader";

import { useMessagesByTopic } from "webviz-core/src/PanelAPI";
import { type InteractionData } from "webviz-core/src/panels/ThreeDimensionalViz/Interactions/types";

function exportModelToGlb(model) {
  // Instantiate a exporter
  const exporter = new GLTFExporter();
  const options = {
    binary: true, // ture -> GLB
    trs: true,
    forceIndices: true,
  };

  // Parse the input and generate the glTF output
  return new Promise((resolve) => {
    exporter.parse(
      model,
      (gltf) => {
        resolve(gltf);
      },
      options
    );
  });
}

// eslint-disable-next-line no-underscore-dangle
function _loadRobotModel(robotUrdfModel: any) {
  return new Promise((resolve) => {
    if(!robotUrdfModel) {
      throw new Error(`unable to load robot urdf model: ${robotUrdfModel}`);
    }
    const manager = new LoadingManager();
    const loader = new URDFLoader(manager);
    // that's how we can map urls to package names
    // loader.packages = { somepackagename: "http://somehost/somepath" }; 
    const robotModel = loader.parse(robotUrdfModel);
    manager.onLoad = async () => {
      const glbModel = await exportModelToGlb(robotModel);
      const model = await parseGLB(glbModel);
      const nodes = [...model.json.nodes];

      // apply rotation to the root node(s) of the model to overcome orientation difference between urdf and glb (or ROS vs Threejs?)
      const rotationY = [Math.sqrt(0.5), 0, Math.sqrt(0.5), 0];
      const rotationZ = [Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)];
      const rotation = [0, 0, 0, 0];
      quat.multiply(rotation, rotationY, rotationZ);
      const rootNodeIndexes: [] = model.json.scenes[model.json.scene].nodes;
      rootNodeIndexes.forEach((index) => {
        nodes[index] = { ...nodes[index], rotation };
      });
      // nodes[64] = { ...nodes[64], rotation };

      resolve({
        ...model,
        json: {
          ...model.json,
          nodes,
        },
      });
    };
  });
}

type Props = {|
  children: {|
    pose: Pose,
      scale ?: Scale,
      alpha ?: number,
      interactionData ?: InteractionData,
  |},
  ...CommonCommandProps,
|};

// default scale is 0.01 because the model's units are centimeters
export default function RobotModel({
  children: { pose, alpha = 1, scale = { x: 1, y: 1, z: 1 }, interactionData },
  layerIndex,
  descriptionTopic = "/robot_description",
}: Props) {
  const messages = useMessagesByTopic({ topics: [descriptionTopic], historySize: 1 })[descriptionTopic];
  const robotModel = messages[0] ? messages[0].message.data : null;
  const loadRobotModel = useMemo(() => () => _loadRobotModel(robotModel), [robotModel]);
  if(!robotModel) {
    return null;
  }
  return (
    <GLTFScene layerIndex={layerIndex} model={loadRobotModel}>
      {{ pose, alpha, scale, interactionData }}
    </GLTFScene>
  );
}
