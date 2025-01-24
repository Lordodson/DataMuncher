import React from 'react';
import { Chart, Scatter } from 'react-chartjs-2';
import 'chart.js/auto';

const ChartComponent = ({ data, options, type = 'scatter' }) => {
  if (!data) return null;

  const ChartType = type === 'scatter' ? Scatter : Chart;

    return (
        <ChartType data={data} options={options} />
    );
};

export default ChartComponent;