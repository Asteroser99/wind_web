function mandrelConfig() {
  return {
    type: "line", // or "scatter"
    data: {
      datasets: [
        {
          label: "Raw",
          data: [],
          borderColor: "#2973B2",
          showLine: true,
          tension: 0.0,
          pointRadius: function (context) {
            return context.dataIndex === 0 ? 3 : 0;
          },
        },
        {
          label: "Wound",
          data: [],
          borderColor: "#48A6A7",
          showLine: true,
          tension: 0.0,
          pointRadius: function (context) {
            return context.dataIndex === 0 ? 3 : 0;
          },
        },
        {
          label: "Smoothed",
          data: [],
          borderColor: "#000000",
          borderDash: [5, 5],
          showLine: true,
          tension: 0.0,
          pointRadius: function (context) {
            return context.dataIndex === 0 ? 3 : 0;
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        zoom: {
          // limits: {
          //   x: {min: -200, max: 200, minRange: 50},
          //   y: {min: -200, max: 200, minRange: 50}
          // },
          pan: {
            enabled: true,
            mode: "xy",
            speed: 10,
            modifierKey: null,
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
          },
        },
        beforeDraw: {
          id: 'customCanvasBackgroundColor',
          beforeDraw: (chart) => {
            const ctx = chart.ctx;
            ctx.fillStyle = 'rgba(220, 220, 0, 0.5)';
            ctx.fillRect(0, 0, chart.width, chart.height);
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "X Axis",
          },
        },
        y: {
          type: "linear",
          title: {
            display: true,
            text: "R Axis",
          },
        },
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          right: 20,
          left: 20
        }
      }
    },
    plugins: [{
      id: 'customCanvasBackgroundColor',
        beforeDraw: function (chart) {
          const ctx = chart.ctx;
          const bgGradient = ctx.createLinearGradient(0, 0, chart.width, chart.height);
          bgGradient.addColorStop(0, `hsl(139, 70%, 90%)`);
          bgGradient.addColorStop(1, `hsl(208, 70%, 90%)`);
      
          ctx.save();
          ctx.fillStyle = bgGradient;
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        },
    }],
  };
}

function mandrelChartUpdate(name){
  const mandrel = mandrelGet(name);
  const {x, r} = mandrel ? mandrel : {x: [], r: []};

  const data = x.map((value, index) => ({ 
    x: value, 
    y: r[index] 
  }));

  let index;
  if        (name == "Raw"){
    index = 0;
  } else if (name == "Wound"){
    index = 1;
  } else if (name == "Smoothed"){
    index = 2;
  }

  mandrelChart.data.datasets[index].data = data;

  mandrelChart.update();
  mandrelChart.resetZoom();
  
  mandrelChart.zoom({ // doesn't work (
    x: { scale: 0.4 },
    y: { scale: 0.4 },
    transition: true
  });
}
window.mandrelChartUpdate = mandrelChartUpdate;

function chartOnLoad() {
  Chart.register(ChartZoom);

  const ctx = document.getElementById('mandrel-canvas').getContext('2d');

  window.mandrelChart = new Chart(ctx, mandrelConfig());
}
window.chartOnLoad = chartOnLoad

chartOnLoad();
