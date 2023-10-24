import React from 'react';

import { MethodContext } from '../../shared/MethodContext';

interface BarChartProps {
  score: Score;
  benchmark?: number;
  color: string;
  groupProfileMode?: boolean;
}

export const BarChart = ({ score, benchmark = 0, color, groupProfileMode = false }: BarChartProps) => {
  const isAGMPreferences = React.useContext(MethodContext) === 'preferences';
  const showBenchmark = Boolean(benchmark) && isAGMPreferences;
  const getText = () => {
    if (showBenchmark) {
      const diff = Math.round(score.value - benchmark);
      const total = 100 - Math.abs(diff);
      if (diff === 0) {
        return (
          'The ' +
          score.name +
          ' attribute of this country has the score ' +
          score.value +
          ' which is equal to your group preference. So ' +
          score.name +
          ' is 100% matching.'
        );
      } else if (diff > 0) {
        return (
          'The ' +
          score.name +
          ' attribute of this country has the score ' +
          score.value +
          ' which is ' +
          Math.abs(diff) +
          '% more than what your group prefers. So ' +
          score.name +
          ' is ' +
          total +
          '% (100-' +
          Math.abs(diff) +
          ') matching.'
        );
      } else {
        return (
          'The ' +
          score.name +
          ' attribute of this country has the score ' +
          score.value +
          ' which is ' +
          Math.abs(diff) +
          '% less than what your group prefers. So ' +
          score.name +
          ' is ' +
          total +
          '% (100-' +
          Math.abs(diff) +
          ') matching.'
        );
      }
    } else {
      return groupProfileMode
        ? `The preference ${score.name} of your aggregated group profile is ${Math.round(score.value)}/100.`
        : `The ${score.name} attribute of this country has the score ${Math.round(score.value)}/100.`;
    }
  };
  return (
    <div
      className='bar-chart'
      style={{
        height: '15px',
        width: '100%',
        position: 'relative',
        border: 'solid 1px #868686',
      }}
    >
      <span className='tooltip-box'>{getText()}</span>

      <div
        style={{
          height: '13px',
          width: `calc(100% * (${score.value} / 100))`,
          backgroundColor: color,
          position: 'absolute',
          left: '0',
        }}
      ></div>
      {showBenchmark && (
        <span
          style={{
            width: '5px',
            height: '15px',
            borderLeft: 'solid 1px #fff',
            borderRight: 'solid 1px #fff',
            backgroundColor: '#282c34',
            position: 'absolute',
            left: `calc(100% * (${benchmark} / 100))`,
          }}
        ></span>
      )}
    </div>
  );
};
