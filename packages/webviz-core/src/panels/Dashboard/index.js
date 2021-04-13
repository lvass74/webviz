// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import React, { useCallback } from "react";
import { hot } from "react-hot-loader/root";

import type { SensorStatus } from "./Sensor";
import SensorElement from "./Sensor";
import SpeedOMeter from "./SpeedOMeter";
import Flex from "webviz-core/src/components/Flex";
import { useMessagePipeline } from "webviz-core/src/components/MessagePipeline";
import Panel from "webviz-core/src/components/Panel";
import PanelToolbar from "webviz-core/src/components/PanelToolbar";
import * as PanelAPI from "webviz-core/src/PanelAPI";
import type { SaveConfig } from "webviz-core/src/types/panels";

type Sensor = { topic: string, errorTimeout: number, label: string };
type Config = { sensors: Sensor[], maxSpeed: number };
type Props = { config: Config, saveConfig: SaveConfig<Config> };

const panelType = "Dashboard";
const defaultConfig = {
  sensors: [
    { topic: "/scan", errorTimeout: 3, label: "Laserscan" },
    { topic: "/kinect_camera/image_raw", errorTimeout: 3, label: "Camera" },
  ],
  maxSpeed: 1,
};

function Dashboard({ config }: Props) {
  const endTime = useMessagePipeline(
    useCallback(({ playerState: { activeData } }) => (activeData ? activeData.endTime.sec : undefined), [])
  );
  const lastMessageTimes = PanelAPI.useMessageReducer < Map < string, number>> ({
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

  const speed = PanelAPI.useMessageReducer < number[] > ({
    topics: ["/odom"],
    restore: React.useCallback((lastState) => (lastState ? lastState : [0, 0]), []),
    addMessages: React.useCallback(
      (prevState, newMessages) =>
        //Math.round(newMessages[newMessages.length - 1].message.twist.twist.linear.x * 10) / 10,
        [
          newMessages[newMessages.length - 1].message.twist.twist.linear.x,
          newMessages[newMessages.length - 1].message.twist.twist.angular.z,
        ],
      []
    ),
  });

  const obstacle = PanelAPI.useMessageReducer < boolean > ({
    topics: ["/teleop_status"],
    restore: React.useCallback((lastState) => (lastState ? lastState : false), []),
    addMessages: React.useCallback((prevState, newMessages) => {
      return newMessages.find((m) => m.message.data === "obstacle") ? true : false;
    }, []),
  });

  const sensors = config.sensors.map((sensor) => {
    const lastMessageTime = lastMessageTimes.get(sensor.topic);
    const status: SensorStatus =
      lastMessageTime && endTime ? (endTime - lastMessageTime <= sensor.errorTimeout ? "OK" : "ERROR") : "UNKNOWN";
    return <SensorElement key={sensor.topic} label={sensor.label} status={status} />;
  });

  return (
    <Flex col style={{ height: "100%", padding: "12px" }}>
      <PanelToolbar floating />
      <div>
        {/* <div>current time: {endTime ? endTime : 0}</div> */}
        <div>{sensors}</div>
        <div> obstacle? {obstacle ? "true" : "false"}</div>
        <SpeedOMeter speed={speed[0]} rotation={speed[1]} maxSpeed={config.maxSpeed} />
      </div>
    </Flex>
  );
}

Dashboard.defaultConfig = defaultConfig;
Dashboard.panelType = panelType;

export default hot(Panel < Config > (Dashboard));
