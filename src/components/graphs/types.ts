export type SeriesName = string; // for naming the data types (e.g. pwm, esp-accel-x, ctrl-gyro-y, etc.) 

export interface TimeSeriesSample {
  [series: SeriesName]: number;
}

export interface D3TimeSeriesProps {
  sample: Record<string, number>;
  seriesOrder?: string[];
  colors?: Record<string, string>;
  maxPoints?: number;
  height?: number;

  fixedYMin?: number;             // clamp lower bound
  fixedYMax?: number;             // clamp upper bound
  percentile?: [number, number];  // e.g. [0.05, 0.95] to ignore spikes
  zeroCenter?: boolean;           // make y-domain symmetric around 0
  showLegend?: boolean;           // show colored legend
  labels?: Record<string, string>;// rename keys in legend
}