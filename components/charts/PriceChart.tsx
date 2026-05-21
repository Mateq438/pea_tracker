'use client'

import { useEffect, useRef } from 'react'

interface PriceChartProps {
  data: number[]
  color: string
  height?: number
  fill?: boolean
  showAxes?: boolean
  label?: string
}

export default function PriceChart({ data, color, height = 180, fill = true, showAxes = false, label = 'Prix' }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    async function init() {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }

      const ctx = canvasRef.current!.getContext('2d')!
      const isUp = data[data.length - 1] >= data[0]
      const lineColor = isUp ? '#00c87a' : '#ff3b5c'
      const usedColor = color === 'auto' ? lineColor : color

      let gradient: CanvasGradient | string = 'transparent'
      if (fill) {
        gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, usedColor + '40')
        gradient.addColorStop(0.7, usedColor + '08')
        gradient.addColorStop(1, 'transparent')
      }

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((_, i) => i),
          datasets: [{
            label,
            data,
            borderColor: usedColor,
            borderWidth: showAxes ? 2 : 1.5,
            fill: fill,
            backgroundColor: gradient,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: showAxes ? 5 : 0,
            pointHoverBackgroundColor: usedColor,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: showAxes,
              backgroundColor: '#1e1e1e',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              titleColor: '#888',
              bodyColor: '#f2f2f2',
              callbacks: {
                title: (items) => `Point ${items[0].dataIndex + 1}`,
                label: (item) => ` $${Number(item.raw).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              },
            },
          },
          scales: {
            x: {
              display: false,
            },
            y: {
              display: showAxes,
              position: 'right',
              grid: { color: 'rgba(255,255,255,0.04)' },
              border: { display: false },
              ticks: {
                color: '#555',
                font: { size: 10 },
                maxTicksLimit: 5,
                callback: (v: any) => '$' + Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 }),
              },
            },
          },
          animation: { duration: 400 },
        },
      })
    }

    init()
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [data, color, height, fill, showAxes])

  return (
    <div style={{ height, position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Graphique ${label}`}
      />
    </div>
  )
}
