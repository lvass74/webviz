// @flow
//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import React from "react";

import styles from "./VelocityCommandArrow.scss";

type Props = {
    speed: number,
    maxSpeed: number,
    rotation: number,
};

const round = (precision) => (number) => {
    const result = Math.round(number * 10 ** precision) / 10 ** precision;
    return result === 0 ? 0 : result; // to convert -0 to 0
};

const roundPrecision0 = round(0);
const roundPrecision2 = round(2);
const roundPrecision4 = round(4);

export default function VelocityCommandArrow({ speed, maxSpeed, rotation }: Props) {
    const arrowHeight = 200;
    const displayedSpeed = roundPrecision2(speed);
    const displayedSpeedHeight = roundPrecision0((Math.abs(speed) / maxSpeed) * arrowHeight);
    const displayedRotation = roundPrecision2(rotation); // precision by 10 degree
    const displayedArrowRotation =
        displayedSpeed || displayedRotation
            ? roundPrecision4(Math.atan2(displayedSpeed, displayedRotation * Math.sign(displayedSpeed)) - Math.PI / 2)
            : 0;

    return (
        <div
            className="arrow"
        >
            <svg width={`${arrowHeight}px`} height={`${arrowHeight}px`} viewBox={`0 0 ${arrowHeight} ${arrowHeight}`}
                style={{
                    transform: `rotate(${displayedArrowRotation}rad)`,
                }}>
                <defs>
                    <path
                        id="arrow"
                        d="
			M75,200
			h50
			v-150
			h25
			l-50,-45
			l-50,45
			h25
			z
		"
                    />
                    <mask id="Mask">
                        <use href="#arrow" fill="white" />
                    </mask>
                </defs>
                <g>
                    <rect x="0" y={arrowHeight - displayedSpeedHeight} width="200" height={displayedSpeedHeight} fill="red" mask="url(#Mask)" />
                    <use href="#arrow"
                        stroke="white"
                        stroke-width="6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        fill="none"
                    />
                </g>
            </svg>
        </div>
    );
}
