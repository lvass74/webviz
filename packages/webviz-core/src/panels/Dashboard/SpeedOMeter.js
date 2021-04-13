// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import React from "react";

import styles from "./SpeedOMeter.scss";

type Props = {
    speed: number,
    maxSpeed: number,
    rotation: number,
};

const round = (precision) => (number) => {
    const result = Math.round(number * 10 ** precision) / 10 ** precision;
    return result === 0 ? 0 : result; // to convert -0 to 0
};

const roundPrecision2 = round(2);
const roundPrecision4 = round(4);

export default function SpeedOMeter({ speed, maxSpeed, rotation }: Props) {
    const displayedSpeedScore = Math.round((Math.abs(speed) / maxSpeed) * 180);
    const displayedSpeed = roundPrecision2(speed);
    const displayedRotation = roundPrecision2(rotation);
    const displayedArrowRotation =
        displayedSpeed || displayedRotation
            ? roundPrecision4(Math.atan2(displayedSpeed, displayedRotation * Math.sign(displayedSpeed))) - Math.PI / 2
            : 0;

    return (
        <div className="speedbox">
            <div
                className="speedbox__score"
                id="speedbox-score"
                style={{ transform: `rotate(${displayedSpeedScore - 45}deg)` }}
            />
            <div className="speedbox__groove" />
            <div className="speedbox__odo">
                <div
                    className="speedbox__up"
                    style={{
                        transform: `rotate(${displayedArrowRotation}rad)`,
                    }}>
                    &#11161;
        </div>
                <div className="speedbox__down">
                    {displayedSpeed}
                    <span>m/s</span>
                </div>
            </div>
        </div>
    );
}
