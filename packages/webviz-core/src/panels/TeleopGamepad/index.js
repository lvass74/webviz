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
import Gamepads from "gamepads"
import { min, set } from "lodash";

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

const StatusDisplay = styled.div`
  background-color: grey;
  color: white;
  margin-right: 1em;
  ${props => props.active && css`
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

const panelType = "TeleopGamepad";

const MotionAction = new Map()
  .set("Forward", ((velocity, speed) => ({ linear: { ...velocity.linear, x: speed }, angular: velocity.angular })))
  .set("Backward", ((velocity, speed) => ({ linear: { ...velocity.linear, x: (-speed) }, angular: velocity.angular })))
  .set("NoMove", ((velocity, speed) => ({ linear: { ...velocity.linear, x: 0 }, angular: velocity.angular })))
  .set("Left", ((velocity, speed) => ({ linear: velocity.linear, angular: { ...velocity.angular, z: speed } })))
  .set("Right", ((velocity, speed) => ({ linear: velocity.linear, angular: { ...velocity.angular, z: (-speed) } })))
  .set("NoTurn", ((velocity, speed) => ({ linear: velocity.linear, angular: { ...velocity.angular, z: 0 } })))

function TeleopGamepad({
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

  const minimalSpeed = 0.1

  const [state, setState] = React.useState({
    cachedProps: {},
    datatypeNames: [],
    error: null,
    activated: false,
    connected: false,
    velocity: defaultVelocity,
    speed: minimalSpeed,
    gamepad: null
  });

  const topicsMatchingDatatype = topics.filter(t => t.datatype === datatype);

  const { datatypeNames, error, activated, connected, velocity, speed, gamepad } = state;
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
    stopMotion();
    setState(state => ({ ...state, activated: !activated }));
  }

  const _publish = (velocity) => {
    const { topicName } = config;
    if (topicName && velocity && _publisher.current) {
      _publisher.current.publish(velocity);
    } else {
      throw new Error(`called _publish() when input was invalid ${JSON.stringify(velocity)} ${JSON.stringify(topicName)} ${JSON.stringify(_publisher)}`);
    }
  };

  const _onFocusLost = (event) => {
    setState(state => ({ ...state, activated: false }));
    stopMotion();
  }

  const _onVisibilityChange = (event) => {
    if (document.visibilityState === 'hidden') _onFocusLost();
  }

  const stopMotion = () => {
    setState(state => ({ ...state, velocity: defaultVelocity, speed: minimalSpeed }));
  }

  const logEvent = (prefix) => (event) => {
    console.log(prefix, event)
  }

  const handleJoystickMove = ({ horizontalValue, verticalValue }) => {
    if (!activated) return;

    let newVelocity = { linear: { ...velocity.linear }, angular: { ...velocity.angular } };
    // if (verticalValue === 0 && horizontalValue === 0) {
    //   const action = MotionAction.get('Stop');
    //   if (action) ({ velocity: newVelocity, speed: newSpeed } = action(newVelocity, newSpeed));
    // }
    // else {

    if (verticalValue) {
      const action = MotionAction.get(verticalValue > 0 ? 'Backward' : 'Forward');
      if (action) newVelocity = action(newVelocity, speed);
    }
    else {
      const action = MotionAction.get('NoMove');
      if (action) newVelocity = action(newVelocity, speed);
    }
    if (horizontalValue) {
      const action = MotionAction.get(horizontalValue * Math.sign(verticalValue || -1) * -1 > 0 ? 'Right' : 'Left'); // inverse horizontal directions when going backward
      if (action) newVelocity = action(newVelocity, speed);
    }
    else {
      const action = MotionAction.get('NoTurn');
      if (action) newVelocity = action(newVelocity, speed);
    }
    // }

    setState((state) => ({ ...state, velocity: newVelocity }))
  }


  const handleGamepadConnected = (e) => {
    setState((state) => ({ ...state, connected: true, gamepad: e.gamepad }));
  }

  const handleGamepadDisconnected = (e) => {
    setState((state) => ({ ...state, connected: false, gamepad: null }));
  }

  const handleButtonPress = ({ index }) => {
    if (index === Gamepads.StandardMapping.Button.BUTTON_BOTTOM) { // FIXME: non standard mapping on my gamepad!
      const newSpeed = speed + 0.1; // fixme: speed limit?
      setState((state) => ({ ...state, speed: newSpeed }))
      return
    }
    if (index === Gamepads.StandardMapping.Button.BUTTON_LEFT) { // FIXME: non standard mapping on my gamepad!
      const newSpeed = speed - 0.1 >= minimalSpeed ? speed - 0.1 : minimalSpeed;
      setState((state) => ({ ...state, speed: newSpeed }))
      return
    }
  }

  React.useEffect(() => {
    if (activated) {
      // Start polling
      Gamepads.start();

      // Add event listeners
      Gamepads.addEventListener('connect', handleGamepadConnected);
      Gamepads.addEventListener('disconnect', handleGamepadDisconnected);
      window.addEventListener("blur", _onFocusLost);
      document.addEventListener("visibilitychange", _onVisibilityChange);
    }
    return () => {
      Gamepads.stop();
      Gamepads.removeEventListener('connect', handleGamepadConnected);
      Gamepads.removeEventListener('disconnect', handleGamepadDisconnected);
      window.removeEventListener("blur", _onFocusLost);
      document.removeEventListener("visibilitychange", _onVisibilityChange);
    }
  }, [activated]);

  React.useEffect(() => {
    if (gamepad) {
      gamepad.addEventListener('joystickmove', handleJoystickMove, Gamepads.StandardMapping.Axis.JOYSTICK_LEFT); // joystickmove requires two axes to watch as parameter
      gamepad.addEventListener('buttonpress', handleButtonPress);

    }

    return () => {
      if (gamepad) {
        gamepad.removeEventListener('joystickmove', handleJoystickMove, Gamepads.StandardMapping.Axis.JOYSTICK_LEFT);
        gamepad.removeEventListener('buttonpress', handleButtonPress);
      }
    }
  }, [gamepad, velocity, speed])

  const updateValueInObject = (predicate) => (changeFunc) => (obj) => (Object.fromEntries(Object.entries(obj).map(([key, val]) => ([key, predicate(val) ? changeFunc(val) : val]))));

  const updateSpeedInVelocity = (speed) => {
    const updateFunc = updateValueInObject(x => x !== 0)(currentSpeed => Math.sign(currentSpeed) * speed)
    return {
      linear: { ...updateFunc(velocity.linear) },
      angular: { ...updateFunc(velocity.angular) }
    }
  }

  React.useEffect(() => {
    const newVelocity = updateSpeedInVelocity(speed);
    setState((state) => ({ ...state, velocity: newVelocity }))
  }, [speed])

  React.useEffect(() => {
    _publish(velocity);
  }, [velocity])

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
      <SRow>
        <StatusDisplay active={connected && activated}>{connected && activated ? "Connected" : (activated ? "Not connected" : "Inactive")}</StatusDisplay>
      </SRow>
      <Flex>
        <div>
          <table style={{ textAlign: 'center' }}>
            <tbody>
              <tr><td></td><td></td><td>{displayVelocity[0]}</td><td></td><td></td></tr>
              <tr><td></td><td></td><td className="teleopForward">w</td><td></td><td></td></tr>
              <tr><td>{displayVelocity[3]}</td><td className="teleopTurnLeft">a</td><td className="teleopStop">space</td><td className="teleopTurnRight">d</td><td>{displayVelocity[1]}</td></tr>
              <tr><td></td><td></td><td className="teleopBackward">s</td><td></td><td></td></tr>
              <tr><td></td><td></td><td>{displayVelocity[2]}</td><td></td><td></td></tr>
            </tbody>
          </table>
        </div>
      </Flex>
    </Flex >
  );
}
TeleopGamepad.defaultConfig = defaultConfig;
TeleopGamepad.panelType = panelType;

export default hot(Panel < Config > (TeleopGamepad));
