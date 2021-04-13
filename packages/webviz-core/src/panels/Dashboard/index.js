// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import React, { useCallback } from "react";
import { hot } from "react-hot-loader/root";

import SpeedOMeter from "./SpeedOMeter";
import { useMessagePipeline } from "webviz-core/src/components/MessagePipeline";
import Panel from "webviz-core/src/components/Panel";
import * as PanelAPI from "webviz-core/src/PanelAPI";
import type { SaveConfig } from "webviz-core/src/types/panels";

type Config = { topics: string[], maxSpeed: number };
type Props = { config: Config, saveConfig: SaveConfig<Config> };

const panelType = "Dashboard";
const defaultConfig = { topics: ["/scan", "/kinect_camera/image_raw"], maxSpeed: 1 };

// const timeToMsec = ({ sec, nsec }) => sec + nsec / 10 ** 9;

// const timeDiff = (time1, time2) => Math.round((timeToMsec(time1) - timeToMsec(time2)) * 10 ** 3) / 10 ** 3;

function getArrow(x: number, z: number) {
  if(Math.abs(x) < 0.01 && Math.abs(z) < 0.01) {
    return;
  }
  return (
    <span style={{ transform: `rotate(${Math.atan2(-x, -z)}rad)`, display: "inline-block" }}>→</span>
  );
}

function Dashboard({ config }: Props) {
  const endTime = useMessagePipeline(
    useCallback(({ playerState: { activeData } }) => (activeData ? activeData.endTime.sec : undefined), [])
  );
  const lastMessageTimes = PanelAPI.useMessageReducer < Map < string, number>> ({
    topics: config.topics,
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

  const formatSpeedValue = React.useCallback((speedValue) => {
    const result = Math.round(speedValue * 10) / 10;
    return result === 0 ? Number(0).toFixed(1) : result.toFixed(1);
  }, []);

  const obstacle = PanelAPI.useMessageReducer < boolean > ({
    topics: ["/teleop_status"],
    restore: React.useCallback((lastState) => (lastState ? lastState : false), []),
    addMessages: React.useCallback((prevState, newMessages) => {
      return newMessages.find((m) => m.message.data === "obstacle") ? true : false;
    }, []),
  });

  return (
    <div style={{ fontSize: "2em" }}>
      <div>current time: {endTime ? endTime : 0}</div>
      <div>sensor topics: {config.topics.join(",")}</div>
      <div>
        {Array.from(lastMessageTimes.entries()).map(([topic, receiveTime]) => (
          <li key={topic}>
            {topic}: {receiveTime} &gt;&gt; {endTime - receiveTime}
          </li>
        ))}
      </div>
      <div>
        speed: {formatSpeedValue(speed[0])}, {formatSpeedValue(speed[1])}
        {getArrow(speed[0], speed[1])}
      </div>
      <div> obstacle? {obstacle ? "true" : "false"}</div>
      <SpeedOMeter speed={speed[0]} rotation={speed[1]} maxSpeed={config.maxSpeed} />
    </div>
  );
}

Dashboard.defaultConfig = defaultConfig;
Dashboard.panelType = panelType;

export default hot(Panel < Config > (Dashboard));
