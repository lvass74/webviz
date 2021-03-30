// @flow
//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import { vec3, quat } from "gl-matrix";
import React, { useMemo } from "react";
import { LoadingManager } from 'three';
import URDFLoader from 'urdf-loader';
import { GLTFExporter, GLTFExporterOptions } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFScene, parseGLB, type Pose, type Scale, type CommonCommandProps } from "regl-worldview";
import { useDataSourceInfo, useMessagesByTopic } from "webviz-core/src/PanelAPI";

import { type InteractionData } from "webviz-core/src/panels/ThreeDimensionalViz/Interactions/types";

function exportModelToGlb(model) {
  // Instantiate a exporter
  const exporter = new GLTFExporter();
  const options = {
    binary: true, // ture -> GLB
    trs: true,
    forceIndices: true,
  }

  // Parse the input and generate the glTF output
  return new Promise((resolve) => {
    exporter.parse(model, function (gltf) {
      console.log('Exported URDF model to GLB');
      resolve(gltf);
    }, options);
  });
}
async function _loadRobotModel(robotUrdfModel: any) {

  if (!robotUrdfModel) {
    throw new Error(`unable to load robot urdf model: ${robotUrdfModel}`);
  }
  const manager = new LoadingManager();
  const loader = new URDFLoader(manager);
  const robotModel = loader.parse(robotUrdfModel);
  const glbModel = await exportModelToGlb(robotModel);
  const model = await parseGLB(glbModel);
  const nodes = [...model.json.nodes];
  console.log(nodes);

  // apply rotation to the root node(s) of the model to overcome orientation difference between urdf and glb (or ROS vs Threejs?)
  const rotationX = [Math.sqrt(0.5), Math.sqrt(0.5), 0, 0];
  const rotationY = [Math.sqrt(0.5), 0, Math.sqrt(0.5), 0];
  const rotationZ = [Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)];
  let rotation = [0, 0, 0, 0];
  quat.multiply(rotation, rotationY, rotationZ)
  const rootNodeIndexes: [] = model.json.scenes[model.json.scene].nodes;
  rootNodeIndexes.forEach(index => {
    nodes[index] = { ...nodes[index], rotation }

  });
  // nodes[64] = { ...nodes[64], rotation };

  return {
    ...model,
    json: {
      ...model.json,
      nodes,

      // change sampler minFilter to avoid blurry textures
      // samplers: model.json.samplers.map((sampler) => ({
      //   ...sampler,
      //   minFilter: WebGLRenderingContext.LINEAR,
      // })),
    },
  };
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
}: Props) {
  const topicName = "/robot_description";
  const messages = useMessagesByTopic({ topics: [topicName], historySize: 1 })[topicName];
  const robotModel = messages[0] ? messages[0].message.data : null;
  const loadRobotModel = useMemo(() => () => _loadRobotModel(robotModel), [robotModel])
  if (!robotModel) return null;
  return (
    <GLTFScene layerIndex={layerIndex} model={loadRobotModel}>
      {{ pose, alpha, scale, interactionData }}
    </GLTFScene>
  );
}
