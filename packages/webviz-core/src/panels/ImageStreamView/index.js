// @flow
//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import React, { useCallback } from "react";
import { hot } from "react-hot-loader/root";
import styled from "styled-components";

import helpContent from "./index.help.md";
import Flex from "webviz-core/src/components/Flex";
import Panel from "webviz-core/src/components/Panel";
import PanelToolbar from "webviz-core/src/components/PanelToolbar";
import type { SaveConfig } from "webviz-core/src/types/panels";


type Config = { streamUrl: string };
type Props = { config: Config, saveConfig: SaveConfig<Config> };
function ImageStreamView({ config, saveConfig }: Props) {
  const onChangeText = useCallback((event: SyntheticInputEvent<HTMLTextAreaElement>) => {
    saveConfig({ streamUrl: event.target.value });
  }, [saveConfig]);

  return (
    <Flex col style={{ height: "100%" }}>
      <PanelToolbar helpContent={helpContent} floating />
      <iframe src={config.streamUrl} scrolling="no" style={{ width: '100%', height: '100%' }} />
      {/* <img src={config.streamUrl.replace('stream_viewer', 'stream')} />0 */}
    </Flex>
  );
}
ImageStreamView.panelType = "ImageStreamView";
ImageStreamView.defaultConfig = { streamUrl: "http://10.10.0.43:8080/stream_viewer?topic=/kinect_camera/image_raw&type=ros_compressed" };

export default hot(Panel<Config>(ImageStreamView));
