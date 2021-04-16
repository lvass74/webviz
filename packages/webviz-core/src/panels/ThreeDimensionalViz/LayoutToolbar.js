// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import cx from "classnames";
import React, { useMemo } from "react";
import { PolygonBuilder, type MouseEventObject, type Polygon } from "regl-worldview";

import InitialPose, { type InitialPoseInfo } from "./NavigationTools/InitialPose";
import NavigationGoal, { type NavigationGoalInfo } from "./NavigationTools/NavigationGoal";
import { getGlobalHooks } from "webviz-core/src/loadWebviz";
import CameraInfo from "webviz-core/src/panels/ThreeDimensionalViz/CameraInfo";
import Crosshair from "webviz-core/src/panels/ThreeDimensionalViz/Crosshair";
import DrawingTools, { type DrawingTabType } from "webviz-core/src/panels/ThreeDimensionalViz/DrawingTools";
import MeasuringTool, { type MeasureInfo } from "webviz-core/src/panels/ThreeDimensionalViz/DrawingTools/MeasuringTool";
import FollowTFControl from "webviz-core/src/panels/ThreeDimensionalViz/FollowTFControl";
import InitialPoseMarker from "webviz-core/src/panels/ThreeDimensionalViz/InitialPoseMarker";
import Interactions from "webviz-core/src/panels/ThreeDimensionalViz/Interactions";
import type { TabType } from "webviz-core/src/panels/ThreeDimensionalViz/Interactions/Interactions";
import styles from "webviz-core/src/panels/ThreeDimensionalViz/Layout.module.scss";
import MainToolbar from "webviz-core/src/panels/ThreeDimensionalViz/MainToolbar";
import MeasureMarker from "webviz-core/src/panels/ThreeDimensionalViz/MeasureMarker";
import NavigationGoalMarker from "webviz-core/src/panels/ThreeDimensionalViz/NavigationGoalMarker";
import NavigationTools from "webviz-core/src/panels/ThreeDimensionalViz/NavigationTools";
import SearchText, { type SearchTextProps } from "webviz-core/src/panels/ThreeDimensionalViz/SearchText";
import { type LayoutToolbarSharedProps } from "webviz-core/src/panels/ThreeDimensionalViz/TopicTree/Layout";

type Props = {|
  ...LayoutToolbarSharedProps,
  autoSyncCameraState: boolean,
    debug: boolean,
      interactionsTabType: ?TabType,
        measureInfo: MeasureInfo,
          measuringElRef: { current: ? MeasuringTool },
initialPoseInfo: InitialPoseInfo,
  initialPoseElRef: { current: ? InitialPose },
navigationGoalInfo: NavigationGoalInfo,
  navigationGoalElRef: { current: ? NavigationGoal },
onSetDrawingTabType: (? DrawingTabType) => void,
  onSetPolygons: (polygons: Polygon[]) => void,
    onToggleCameraMode: () => void,
      onToggleDebug: () => void,
        polygonBuilder: PolygonBuilder,
          rootTf: ?string,
            selectedObject: ?MouseEventObject,
              selectedPolygonEditFormat: "json" | "yaml",
                setInteractionsTabType: (? TabType) => void,
                  setMeasureInfo: (MeasureInfo) => void,
                    setInitialPoseInfo: (InitialPoseInfo) => void,
                      setNavigationGoalInfo: (NavigationGoalInfo) => void,
                        showCrosshair: ?boolean,
                          isHidden: boolean,
  ...SearchTextProps,
|};

function LayoutToolbar({
  autoSyncCameraState,
  cameraState,
  debug,
  followOrientation,
  followTf,
  interactionsTabType,
  isPlaying,
  measureInfo,
  measuringElRef,
  initialPoseInfo,
  initialPoseElRef,
  navigationGoalInfo,
  navigationGoalElRef,
  onAlignXYAxis,
  onCameraStateChange,
  onFollowChange,
  onSetDrawingTabType,
  onSetPolygons,
  onToggleCameraMode,
  onToggleDebug,
  polygonBuilder,
  rootTf,
  saveConfig,
  searchInputRef,
  searchText,
  searchTextMatches,
  searchTextOpen,
  selectedMatchIndex,
  selectedObject,
  selectedPolygonEditFormat,
  setInteractionsTabType,
  setMeasureInfo,
  setInitialPoseInfo,
  setNavigationGoalInfo,
  setSearchText,
  setSearchTextMatches,
  setSelectedMatchIndex,
  showCrosshair,
  isHidden,
  targetPose,
  toggleSearchTextOpen,
  transforms,
}: Props) {
  const additionalToolbarItemsElem = useMemo(() => {
    const AdditionalToolbarItems = getGlobalHooks().perPanelHooks().ThreeDimensionalViz.AdditionalToolbarItems;
    return (
      <div className={cx(styles.buttons, styles.cartographer)}>
        <AdditionalToolbarItems transforms={transforms} />
      </div>
    );
  }, [transforms]);

  return isHidden ? null : (
    <>
      <MeasuringTool
        ref={measuringElRef}
        measureState={measureInfo.measureState}
        measurePoints={measureInfo.measurePoints}
        onMeasureInfoChange={setMeasureInfo}
      />
      <InitialPose
        ref={initialPoseElRef}
        state={initialPoseInfo.state}
        points={initialPoseInfo.points}
        onInitialPoseInfoChange={setInitialPoseInfo}
      />
      <NavigationGoal
        ref={navigationGoalElRef}
        state={navigationGoalInfo.state}
        points={navigationGoalInfo.points}
        onNavigationGoalInfoChange={setNavigationGoalInfo}
      />
      <div className={cx(styles.toolbar, styles.right)}>
        <div className={styles.buttons}>
          <SearchText
            searchTextOpen={searchTextOpen}
            toggleSearchTextOpen={toggleSearchTextOpen}
            searchText={searchText}
            setSearchText={setSearchText}
            setSearchTextMatches={setSearchTextMatches}
            searchTextMatches={searchTextMatches}
            searchInputRef={searchInputRef}
            setSelectedMatchIndex={setSelectedMatchIndex}
            selectedMatchIndex={selectedMatchIndex}
            onCameraStateChange={onCameraStateChange}
            cameraState={cameraState}
            transforms={transforms}
            rootTf={rootTf}
            onFollowChange={onFollowChange}
          />
        </div>
        <div className={styles.buttons}>
          <FollowTFControl
            transforms={transforms}
            tfToFollow={followTf ? followTf : undefined}
            followOrientation={followOrientation}
            onFollowChange={onFollowChange}
          />
        </div>
        <MainToolbar
          measureInfo={measureInfo}
          measuringTool={measuringElRef.current}
          perspective={cameraState.perspective}
          debug={debug}
          onToggleCameraMode={onToggleCameraMode}
          onToggleDebug={onToggleDebug}
        />
        {measuringElRef.current && measuringElRef.current.measureDistance}
        <Interactions
          selectedObject={selectedObject}
          interactionsTabType={interactionsTabType}
          setInteractionsTabType={setInteractionsTabType}
        />
        <DrawingTools
          onSetPolygons={onSetPolygons}
          polygonBuilder={polygonBuilder}
          saveConfig={saveConfig}
          selectedPolygonEditFormat={selectedPolygonEditFormat}
          onSetDrawingTabType={onSetDrawingTabType}
        />
        <CameraInfo
          cameraState={cameraState}
          targetPose={targetPose}
          followOrientation={followOrientation}
          followTf={followTf}
          isPlaying={isPlaying}
          onAlignXYAxis={onAlignXYAxis}
          onCameraStateChange={onCameraStateChange}
          showCrosshair={!!showCrosshair}
          autoSyncCameraState={autoSyncCameraState}
        />
        <NavigationTools
          initialPose={initialPoseElRef.current}
          initialPoseInfo={initialPoseInfo}
          navigationGoal={navigationGoalElRef.current}
          navigationGoalInfo={navigationGoalInfo}
          perspective={cameraState.perspective}
        />
        {additionalToolbarItemsElem}
      </div>
      {!cameraState.perspective && showCrosshair && <Crosshair cameraState={cameraState} />}
      <MeasureMarker measurePoints={measureInfo.measurePoints} />
      <InitialPoseMarker points={initialPoseInfo.points} />
      <NavigationGoalMarker points={navigationGoalInfo.points} />
    </>
  );
}

export default React.memo < Props > (LayoutToolbar);
