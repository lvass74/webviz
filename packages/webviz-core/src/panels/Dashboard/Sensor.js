// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import React from "react";

import styles from "./Sensor.scss";

export type SensorStatus = "OK" | "ERROR" | "UNKNOWN";

type Props = { label: string, topic: string, status: SensorStatus };

export default function Sensor({ label, status }: Props) {
    return <div className={`sensor ${status.toLowerCase()}`}>{label}</div>;
}
