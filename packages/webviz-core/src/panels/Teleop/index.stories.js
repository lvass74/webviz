// @flow
//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import { storiesOf } from "@storybook/react";
import React from "react";

import Teleop from "webviz-core/src/panels/Teleop";
import { PlayerCapabilities } from "webviz-core/src/players/types";
import PanelSetup from "webviz-core/src/stories/PanelSetup";

const getFixture = (allowPublish) => {
  return {
    topics: [],
    datatypes: {
      "std_msgs/String": { fields: [{ name: "data", type: "string" }] },
    },
    frame: {},
    capabilities: allowPublish ? [PlayerCapabilities.advertise] : [],
  };
};

const advancedJSON = `{\n  "data": ""\n}`;
const publishConfig = (advancedView: boolean, json: string) => ({
  topicName: "/sample_topic",
  datatype: "std_msgs/String",
  value: json,
});

storiesOf("<Teleop>", module)
  .add("example can publish", () => {
    const allowPublish = true;
    return (
      <PanelSetup fixture={getFixture(allowPublish)}>
        <Teleop config={publishConfig(true, advancedJSON)} />
      </PanelSetup>
    );
  })
