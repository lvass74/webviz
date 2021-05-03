// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import React, { useCallback } from "react";
import { hot } from "react-hot-loader/root";

import AlarmElement, { type AlarmStatus } from "./Alarm";
import SensorElement, { type SensorStatus } from "./Sensor";
import SpeedOMeter from "./SpeedOMeter";
import Flex from "webviz-core/src/components/Flex";
import { useMessagePipeline } from "webviz-core/src/components/MessagePipeline";
import Panel from "webviz-core/src/components/Panel";
import PanelToolbar from "webviz-core/src/components/PanelToolbar";
import * as PanelAPI from "webviz-core/src/PanelAPI";
import type { SaveConfig } from "webviz-core/src/types/panels";

type Sensor = { topic: string, errorTimeout: number, label: string };
type Alarm = { label: string, topic: string, predicate: (message: any) => boolean };
type Config = { sensors: Sensor[], alarms: Alarm[], maxSpeed: number };
type Props = { config: Config, saveConfig: SaveConfig<Config> };

const panelType = "Dashboard";
const defaultConfig = {
  sensors: [
    { topic: "/scan", errorTimeout: 3, label: "Laserscan" },
    { topic: "/kinect_camera/image_raw/compressed", errorTimeout: 3, label: "Front camera" },
    { topic: "/rear_camera/image_raw/compressed", errorTimeout: 3, label: "Rear camera" },
    { topic: "/cmd_vel_m", errorTimeout: 3, label: "Velocity command" },
  ],
  alarms: [
    { label: "Obstacle", topic: "/teleop_status", predicate: (message) => message.data.toLowerCase() === "obstacle" },
  ],
  maxSpeed: 1,
};

const sum = (...values: number[]) => values.reduce((acc, curr) => (acc += curr), 0);
const average = (...values: number[]) => {
  const result = sum(...values) / values.length;
  return result;
}

function Dashboard({ config }: Props) {
  const endTime = useMessagePipeline(
    useCallback(({ playerState: { activeData } }) => (activeData ? activeData.endTime.sec : undefined), [])
  );

  const speed = PanelAPI.useMessageReducer < number[] > ({
    topics: ["/odom"],
    restore: React.useCallback((lastState) => (lastState ? lastState : [0, 0]), []),
    addMessages: React.useCallback(
      (prevState, newMessages) =>
        //Math.round(newMessages[newMessages.length - 1].message.twist.twist.linear.x * 10) / 10,
        [
          average(prevState[0], newMessages[newMessages.length - 1].message.twist.twist.linear.x),
          average(prevState[1], newMessages[newMessages.length - 1].message.twist.twist.angular.z),
        ],
      []
    ),
  });

  const sensorLastMessageTimes = PanelAPI.useMessageReducer < Map < string, number>> ({
    topics: config.sensors.map((sensor) => sensor.topic),
    restore: React.useCallback((lastState) => (lastState ? new Map(lastState.entries()) : new Map()), []),
    addMessages: React.useCallback(
      (prevState, newMessages) =>
        newMessages.reduce((acc, curr) => {
          return acc.set(curr.topic, curr.receiveTime.sec);
        }, new Map(prevState.entries())),
      []
    ),
  });

  const alarmStates = PanelAPI.useMessageReducer < Map < string, boolean>> ({
    topics: config.alarms.map((alarm) => alarm.topic),
    restore: React.useCallback((lastState) => (lastState ? new Map(lastState.entries()) : new Map()), []),
    addMessages: React.useCallback(
      (prevState, newMessages) =>
        newMessages.reduce((acc, curr) => {
          const alarm = config.alarms.find((a) => a.topic === curr.topic);
          if(!alarm) return acc;
          return acc.set(curr.topic, alarm.predicate(curr.message));
        }, new Map(prevState.entries())),
      [config.alarms]
    ),
  });

  const sensors = config.sensors.map((sensor) => {
    const lastMessageTime = sensorLastMessageTimes.get(sensor.topic);
    const status: SensorStatus =
      lastMessageTime && endTime ? (endTime - lastMessageTime <= sensor.errorTimeout ? "OK" : "ERROR") : "UNKNOWN";
    return <SensorElement key={sensor.topic} topic={sensor.topic} label={sensor.label} status={status} />;
  });

  const alarms = config.alarms.map((alarm) => {
    const alarmState = alarmStates.get(alarm.topic);
    const status: AlarmStatus = alarmState === true ? "ALERT" : alarmState === false ? "OK" : "UNKNOWN";
    return <AlarmElement key={alarm.topic} topic={alarm.topic} label={alarm.label} status={status} />;
  });

  return (
    <Flex col style={{ height: "100%", padding: "12px" }}>
      <PanelToolbar floating />
      <div>
        {/* <div>current time: {endTime ? endTime : 0}</div> */}
        <div>{sensors}</div>
        <div>{alarms}</div>
        <SpeedOMeter speed={speed[0]} rotation={speed[1]} maxSpeed={config.maxSpeed} />
      </div>
    </Flex>
  );
}

Dashboard.defaultConfig = defaultConfig;
Dashboard.panelType = panelType;

export default hot(Panel < Config > (Dashboard));
