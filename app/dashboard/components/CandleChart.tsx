"use client";
import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, ColorType, type IChartApi, type CandlestickData, type UTCTimestamp } from "lightweight-charts";

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function CandleChart({ candles, height = 380 }: { candles: Candle[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !candles || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0e0e0e" },
        textColor: "#666",
        fontFamily: "'Exo 2', sans-serif",
      },
      grid: {
        vertLines: { color: "#161616" },
        horzLines: { color: "#161616" },
      },
      rightPriceScale: { borderColor: "#1a1a1a" },
      timeScale: { borderColor: "#1a1a1a", timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: "#02B36540", labelBackgroundColor: "#02B365" },
        horzLine: { color: "#02B36540", labelBackgroundColor: "#02B365" },
      },
      height,
      autoSize: true,
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#02B365",
      downColor: "#EF4444",
      borderUpColor: "#02B365",
      borderDownColor: "#EF4444",
      wickUpColor: "#02B365",
      wickDownColor: "#EF4444",
    });

    series.setData(candles.map(c => ({
      time: c.time as UTCTimestamp,
      open: c.open, high: c.high, low: c.low, close: c.close,
    })) as CandlestickData[]);

    chart.timeScale().fitContent();

    return () => { chart.remove(); chartRef.current = null; };
  }, [candles, height]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
