// @flow
//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import CheckboxBlankOutlineIcon from "@mdi/svg/svg/checkbox-blank-outline.svg";
import CheckboxMarkedIcon from "@mdi/svg/svg/checkbox-marked.svg";
import * as React from "react";
import { hot } from "react-hot-loader/root";
import styled, { css } from "styled-components";

import { PanelToolbarInput, PanelToolbarLabel } from "webviz-core/shared/panelToolbarStyles";
import Autocomplete from "webviz-core/src/components/Autocomplete";
import Button from "webviz-core/src/components/Button";
import Flex from "webviz-core/src/components/Flex";
import Item from "webviz-core/src/components/Menu/Item";
import Panel from "webviz-core/src/components/Panel";
import PanelToolbar from "webviz-core/src/components/PanelToolbar";
import Publisher from "webviz-core/src/components/Publisher";
import { PlayerCapabilities, type Topic } from "webviz-core/src/players/types";
import colors from "webviz-core/src/styles/colors.module.scss";
import type { RosDatatypes } from "webviz-core/src/types/RosDatatypes";

type Config = {|
  topicName: string,
    datatype: string,
|};

type Props = {
  config: Config,
  saveConfig: ($Shape<Config>) => void,

  // player state
  capabilities: string[],
  topics: Topic[],
  datatypes: RosDatatypes,
};

type PanelState = {|
  cachedProps: $Shape < Props >,
    datatypeNames: string[],
      parsedObject: ?any,
        error: ?string,
|};

const STextArea = styled.textarea`
  width: 100%;
  height: 100%;
  resize: none;
`;

const STextAreaContainer = styled.div`
  flex-grow: 1;
  padding: 12px 0;
`;

const SErrorText = styled.div`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  padding: 4px;
  color: ${colors.red};
`;

const SSpan = styled.span`
  opacity: 0.8;
`;
const SRow = styled.div`
  display: flex;
  line-height: 24px;
  flex-shrink: 0;
`;

const ToggleButton = styled.button`
  background-color: grey;
  color: white;
  margin-right: 1em;
  ${props => props.activated && css`
    background-color: green;
  `}
`;

function getTopicName(topic: Topic): string {
  return topic.name;
}


const formatVelocityValue = (value) => Math.round(value * 10) / 10

const defaultConfig = {
  topicName: "/cmd_vel",
  datatype: "geometry_msgs/Twist",
  value: "",
};

const panelType = "Teleop";

const NavigationKeyMap = new Map()
  .set("KeyW", (velocity => ({ linear: { ...velocity.linear, x: velocity.linear.x + 0.1 }, angular: velocity.angular })))
  .set("KeyS", (velocity => ({ linear: { ...velocity.linear, x: velocity.linear.x - 0.1 }, angular: velocity.angular })))
  .set("Space", (velocity => ({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } })))
  .set("KeyA", (velocity => ({ linear: velocity.linear, angular: { ...velocity.angular, z: velocity.angular.z + 0.1 } })))
  .set("KeyD", (velocity => ({ linear: velocity.linear, angular: { ...velocity.angular, z: velocity.angular.z - 0.1 } })))

function Teleop({
  capabilities,
  topics,
  config: { topicName, datatype, value },
  saveConfig
}) {

  const config = { topicName, datatype, value };
  const _publisher = React.useRef < Publisher > ();

  const defaultVelocity = {
    linear: { x: 0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 }
  }

  const [state, setState] = React.useState({
    cachedProps: {},
    datatypeNames: [],
    error: null,
    activated: false,
    velocity: defaultVelocity
  });

  const topicsMatchingDatatype = topics.filter(t => t.datatype === datatype);

  const { datatypeNames, error, activated, velocity } = state;
  const canPublish = capabilities.includes(PlayerCapabilities.advertise);

  const _onChangeTopic = (event, topicName: string) => {
    saveConfig({ topicName });
  };

  // when a known topic is selected, also fill in its datatype
  const _onSelectTopic = (topicName: string, topic: Topic, autocomplete: Autocomplete) => {
    saveConfig({ topicName, datatype: topic.datatype });
    autocomplete.blur();
  };

  const _onActivateButtonClick = () => {
    stopNavigation();
    setState(state => ({ ...state, activated: !activated }));
  }

  const _publish = (velocity) => {
    const { topicName } = config;
    if (topicName && velocity && _publisher.current) {
      _publisher.current.publish(velocity);
    } else {
      throw new Error(`called _publish() when input was invalid`);
    }
  };

  const navigationKeysListener = (event) => {
    const action = NavigationKeyMap.get(event.code)
    if (action) {
      const newVelocity = action(velocity);
      setState(state => {
        const newState = { ...state, velocity: newVelocity };
        return newState;
      })
      _publish(newVelocity);
    }
  }

  const _onFocusLost = (event) => {
    setState(state => ({ ...state, activated: false }));
    stopNavigation();
  }

  const _onVisibilityChange = (event) => {
    if (document.visibilityState === 'hidden') _onFocusLost();
  }

  const stopNavigation = () => {
    setState(state => ({ ...state, velocity: defaultVelocity }));
    _publish(defaultVelocity);
  }

  React.useEffect(() => {
    if (activated) {
      document.addEventListener("keydown", navigationKeysListener);
      window.addEventListener("blur", _onFocusLost);
      document.addEventListener("visibilitychange", _onVisibilityChange);
      return () => {
        document.removeEventListener("keydown", navigationKeysListener);
        window.removeEventListener("blur", _onFocusLost);
        document.removeEventListener("visibilitychange", _onVisibilityChange);
      };
    }
  }, [activated, velocity]);

  const displayVelocity = [
    state.velocity.linear.x >= 0.1 ? formatVelocityValue(state.velocity.linear.x) : '\u00a0',
    state.velocity.angular.z <= -0.1 ? formatVelocityValue(state.velocity.angular.z) : '\u00a0',
    state.velocity.linear.x <= -0.1 ? formatVelocityValue(state.velocity.linear.x) : '\u00a0',
    state.velocity.angular.z >= 0.1 ? formatVelocityValue(state.velocity.angular.z) : '\u00a0',
  ];

  return (
    <Flex col style={{ height: "100%", padding: "12px" }}>
      {topicName && datatype && (
        <Publisher ref={_publisher} name="Teleop" topic={topicName} datatype={datatype} />
      )}
      <PanelToolbar floating />
      <SRow>
        <ToggleButton activated={activated} onClick={_onActivateButtonClick}>{activated ? 'On' : 'Off'}</ToggleButton>
        <SSpan>Topic:</SSpan>
        <Autocomplete
          placeholder="Choose a topic"
          items={topicsMatchingDatatype}
          hasError={false}
          onChange={_onChangeTopic}
          onSelect={_onSelectTopic}
          selectedItem={{ name: topicName }}
          getItemText={getTopicName}
          getItemValue={getTopicName}
        />
      </SRow>
      <Flex>
        <table style={{ textAlign: 'center' }}>
          <tbody>
            <tr><td></td><td></td><td>{displayVelocity[0]}</td><td></td><td></td></tr>
            <tr><td></td><td></td><td className="teleopForward">w</td><td></td><td></td></tr>
            <tr><td>{displayVelocity[3]}</td><td className="teleopTurnLeft">a</td><td className="teleopStop">space</td><td className="teleopTurnRight">d</td><td>{displayVelocity[1]}</td></tr>
            <tr><td></td><td></td><td className="teleopBackward">s</td><td></td><td></td></tr>
            <tr><td></td><td></td><td>{displayVelocity[2]}</td><td></td><td></td></tr>
          </tbody>
        </table>
      </Flex>
    </Flex >
  );
}
Teleop.defaultConfig = defaultConfig;
Teleop.panelType = panelType;

export default hot(Panel < Config > (Teleop));
