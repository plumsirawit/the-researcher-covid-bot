import React from 'react';
import { extent, max, bisector } from 'd3-array'
import _ from 'lodash'
import { Group } from '@visx/group'
import { Bar } from '@visx/shape'
import moment from 'moment'
import { localPoint } from '@visx/event'
import { scaleLinear, scaleBand, scaleTime } from '@visx/scale'
import { useTooltip, Tooltip, defaultStyles, } from '@visx/tooltip'
import { curveLinear, curveBasis } from '@visx/curve'
import { LinePath } from '@visx/shape'
import { ParentSize, withParentSize } from '@visx/responsive'
import data from './gis/data/national-timeseries.json'
import { AxisBottom } from '@visx/axis'
import { Brush } from '@visx/brush';
import BaseBrush, { BaseBrushState, UpdateBrush } from '@visx/brush/lib/BaseBrush';

function movingAvg(ts) {
    var moving_aves = []
    var ys = []
    for (var i = 0; i < ts.length; i++) {
        ys.push(ts[i]['NewConfirmed'])
    }
    for (var i = 0; i < ys.length; i++) {
        if (i >= 7) {
            const cosum = ys.slice(i - 7, i)
            moving_aves.push(cosum.reduce((a, b) => a + b, 0) / 7)
        }
        else{
            moving_aves.push(0)
        }
    }
    return moving_aves
}

function NationalCurve(props) {
    const timeSeries = data['Data']

    // Then we'll create some bounds
    const width = props.width
    const height = props.height
    // We'll make some helpers to get at the data we want
    const x = d => new Date(d['Date']);
    const y = d => d['NewConfirmed'];
    const avgs = movingAvg(timeSeries)
    
    avgs.map((avg, i) => {
        timeSeries[i]['movingAvg'] = avg
    })
    const xScale = scaleBand({
        range: [10, width - 10],
        domain: timeSeries.map(x),
        padding: 0.07
    })
    const dateScale = scaleTime({
        range: [10, width - 10],
        domain: extent(timeSeries, x),
        padding: 0.07
    })
    const yScale = scaleLinear({
        range: [height, 50],
        domain: [0, max(timeSeries, y)],
    })
    const {
        showTooltip,
        hideTooltip,
        tooltipOpen,
        tooltipData,
        tooltipLeft = 0,
        tooltipTop = 0,
    } = useTooltip({
        tooltipOpen: true,
        tooltipData: null,
    });
    const bisectDate = bisector(d => new Date(d['Date'])).left;
    return (
        <div style={{ position: 'relative' }}>
            <svg width={width} height={height}>
                <Group>
                    <Group>
                        {timeSeries.map((d, i) => {
                            const barHeight = height - yScale(y(d))
                            return (
                                <Bar
                                    key={i}
                                    x={xScale(x(d))}
                                    y={height - barHeight - 30}
                                    width={xScale.bandwidth()}
                                    height={barHeight}
                                    fill='#fa9ba4'
                                />

                            );
                        })}
                    </Group>
                    {[timeSeries].map((lineData, index) => {
                        return (
                            <LinePath
                                curve={curveBasis}
                                data={lineData}
                                x={d => xScale(x(d))}
                                y={d => yScale(d['movingAvg']) - 30}
                                stroke='#cf1111'
                                strokeWidth={2}
                            />
                        )
                    })}
                    {tooltipData &&
                        <Bar
                            x={xScale(x(tooltipData))}
                            y={yScale(y(tooltipData)) - 30}
                            width={xScale.bandwidth()}
                            height={height - yScale(y(tooltipData))}
                            fill='#ff5e6f'
                        />
                    }
                    <AxisBottom
                        top={height - 30}
                        scale={xScale}
                        tickFormat={d => moment(d).format('MMM')}
                        tickStroke='#bfbfbf'
                        stroke='#bfbfbf'
                        tickLabelProps={() => ({
                            fill: '#bfbfbf',
                            fontSize: 11,
                            textAnchor: 'middle',
                        })}
                    />
                    <Bar
                        onMouseMove={(e) => {
                            const x = localPoint(e)['x']
                            if (x) {
                                const x0 = dateScale.invert(x)
                                const index = bisectDate(timeSeries, x0, 1)
                                const d = timeSeries[index]
                                const barHeight = height - yScale(y(d))
                                showTooltip({
                                    tooltipData: d,
                                    tooltipLeft: x,
                                    tooltipTop: height - barHeight - 100
                                })
                            }
                        }}
                        onMouseLeave={() => hideTooltip()}
                        x={10}
                        y={0}
                        width={width - 20}
                        height={height - 30}
                        fill="transparent"
                    />
                </Group>

            </svg>
            {tooltipData &&
                <Tooltip
                    top={tooltipTop}
                    left={tooltipLeft}
                    style={{
                        ...defaultStyles,
                        minWidth: 160,
                        textAlign: 'start',
                        transform: 'translate(-50%, -50%)',
                        padding: 12,
                    }}
                >
                    <span>
                        <b>{moment(tooltipData['Date']).format('DD MMM')}</b><br />
                    ผู้ติดเชื้อใหม่ {tooltipData['NewConfirmed']} ราย
                </span>
                </Tooltip>
            }
        </div>
    )
}

function Container(props) {
    return (
        <ParentSize>
            {({ width, height }) => (
                <NationalCurve width={width} height={300} />
            )}
        </ParentSize>

    )
}
export default Container