// @flow
//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

/* eslint-disable no-underscore-dangle */
/* eslint-disable no-shadow */

import * as React from "react";
import { hot } from "react-hot-loader/root";
import styled, { css } from "styled-components";

import Autocomplete from "webviz-core/src/components/Autocomplete";
import Flex from "webviz-core/src/components/Flex";
import Panel from "webviz-core/src/components/Panel";
import PanelToolbar from "webviz-core/src/components/PanelToolbar";
import Publisher from "webviz-core/src/components/Publisher";
import { type Topic } from "webviz-core/src/players/types";
import type { RosDatatypes } from "webviz-core/src/types/RosDatatypes";

// ----------------

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
  ${(props) =>
    props.activated &&
    css`
      background-color: green;
    `}
`;

// ----------------

type Config = {
  topicName: string,
  datatype: string,
  maxVelocity: number,
  incrementStep: number,
  publishingRate: number,
};

type Props = {
  config: Config,
  saveConfig: ($Shape<Config>) => void,

  // player state
  capabilities: string[],
  topics: Topic[],
  datatypes: RosDatatypes,
};

const defaultConfig: Config = {
  topicName: "/cmd_vel_m",
  datatype: "geometry_msgs/Twist",
  maxVelocity: 1,
  incrementStep: 0.1,
  publishingRate: 2,
};

const panelType = "Teleop";

// ----------------

const getTopicName = (topic: Topic): string => topic.name;

const formatVelocityValue = (value) => (Math.round(value * 100) / 100).toFixed(2);

const incrementWithMax = (max: number) => (step = 0.1) => (previousValue) =>
  Math.abs(previousValue + step) <= Math.abs(max) ? previousValue + step : max;

// ----------------

function Teleop({ topics, config, saveConfig }: Props) {
  const { topicName, datatype } = config;
  const _publisher = React.useRef < Publisher > ();
  const defaultVelocity = {
    linear: { x: 0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 },
  };
  const [state, setState] = React.useState({
    cachedProps: {},
    datatypeNames: [],
    error: null,
    activated: false,
    velocity: defaultVelocity,
  });

  const incrementVelocity = incrementWithMax(config.maxVelocity)(config.incrementStep);
  const decrementVelocity = incrementWithMax(config.maxVelocity * -1)(config.incrementStep * -1);

  const NavigationKeyMap = new Map()
    .set("KeyW", (velocity) => ({
      linear: { ...velocity.linear, x: incrementVelocity(velocity.linear.x) },
      angular: velocity.angular,
    }))
    .set("KeyS", (velocity) => ({
      linear: { ...velocity.linear, x: decrementVelocity(velocity.linear.x) },
      angular: velocity.angular,
    }))
    .set("Space", (_) => ({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }))
    .set("KeyA", (velocity) => ({
      linear: velocity.linear,
      angular: {
        ...velocity.angular,
        z: velocity.linear.x >= 0 ? incrementVelocity(velocity.angular.z) : decrementVelocity(velocity.angular.z),
      },
    }))
    .set("KeyD", (velocity) => ({
      linear: velocity.linear,
      angular: {
        ...velocity.angular,
        z: velocity.linear.x >= 0 ? decrementVelocity(velocity.angular.z) : incrementVelocity(velocity.angular.z),
      },
    }));

  const topicsMatchingDatatype = topics.filter((t) => t.datatype === datatype);

  const _publish = React.useCallback((velocity) => {
    const { topicName } = config;
    if(topicName && velocity && _publisher.current) {
      _publisher.current.publish(velocity);
    } else {
      throw new Error(`called _publish() when input was invalid`);
    }
  }, [config]);

  const stopNavigation = React.useCallback(() => {
    setState((state) => ({ ...state, velocity: defaultVelocity }));
    _publish(defaultVelocity);
  }, [_publish, defaultVelocity]);

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
    setState((state) => ({ ...state, activated: !state.activated }));
  };

  const navigationKeysListener = React.useCallback((event: KeyboardEvent) => {
    const action = NavigationKeyMap.get(event.code);
    if(action) {
      const newVelocity = action(state.velocity);
      setState((state) => {
        const newState = { ...state, velocity: newVelocity };
        return newState;
      });
    }
  }, [NavigationKeyMap, state.velocity]);

  const _onFocusLost = React.useCallback(() => {
    setState((state) => ({ ...state, activated: false }));
    stopNavigation();
  }, [stopNavigation]);

  const _onVisibilityChange = React.useCallback(() => {
    if(document.visibilityState === "hidden") {
      _onFocusLost();
    }
  }, [_onFocusLost]);

  const publishVelocity = React.useCallback(() => {
    _publish(state.velocity);
  }, [_publish, state.velocity]);

  React.useEffect(() => {
    let timer = null;
    if(state.activated) {
      document.addEventListener("keydown", navigationKeysListener);
      window.addEventListener("blur", _onFocusLost);
      document.addEventListener("visibilitychange", _onVisibilityChange);
      timer = window.setInterval(publishVelocity, 1000 / config.publishingRate);
      return () => {
        document.removeEventListener("keydown", navigationKeysListener);
        window.removeEventListener("blur", _onFocusLost);
        document.removeEventListener("visibilitychange", _onVisibilityChange);
        window.clearInterval(timer);
      };
    }
  }, [
    _onFocusLost,
    _onVisibilityChange,
    config.publishingRate,
    navigationKeysListener,
    publishVelocity,
    state.activated,
  ]);

  const displayVelocity = [
    state.velocity.linear.x >= 0.01 ? formatVelocityValue(state.velocity.linear.x) : "\u00a0",
    state.velocity.angular.z <= -0.01 ? formatVelocityValue(state.velocity.angular.z) : "\u00a0",
    state.velocity.linear.x <= -0.01 ? formatVelocityValue(state.velocity.linear.x) : "\u00a0",
    state.velocity.angular.z >= 0.01 ? formatVelocityValue(state.velocity.angular.z) : "\u00a0",
  ];

  console.log("Rendering teleop");
  return (
    <Flex col style={{ height: "100%", padding: "12px" }}>
      {topicName && datatype && <Publisher ref={_publisher} name="Teleop" topic={topicName} datatype={datatype} />}
      <PanelToolbar floating />
      <SRow>
        <ToggleButton activated={state.activated} onClick={_onActivateButtonClick}>
          {state.activated ? "On" : "Off"}
        </ToggleButton>
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
        <table style={{ textAlign: "center" }}>
          <tbody>
            <tr>
              <td />
              <td />
              <td>{displayVelocity[0]}</td>
              <td />
              <td />
            </tr>
            <tr>
              <td />
              <td />
              <td className="teleopForward">w</td>
              <td />
              <td />
            </tr>
            <tr>
              <td>{displayVelocity[3]}</td>
              <td className="teleopTurnLeft">a</td>
              <td className="teleopStop">space</td>
              <td className="teleopTurnRight">d</td>
              <td>{displayVelocity[1]}</td>
            </tr>
            <tr>
              <td />
              <td />
              <td className="teleopBackward">s</td>
              <td />
              <td />
            </tr>
            <tr>
              <td />
              <td />
              <td>{displayVelocity[2]}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </Flex>
    </Flex>
  );
}
Teleop.defaultConfig = defaultConfig;
Teleop.panelType = panelType;

export default hot(Panel < Config > (Teleop));
