window.mandrelChart = null;

function configGraph() {
  return {
    type: 'bar', // Пример графика (столбчатая диаграмма)
    data: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  }  
}

function configSin() {
  const labels = []; // Значения X
  const data = [];   // Значения Y = sin(X)

  for (let x = -Math.PI * 2; x <= Math.PI * 2; x += 0.1) {
    labels.push(x.toFixed(1)); // Добавляем значение X
    data.push(Math.sin(x));    // Добавляем значение Y
  }

  // Конфигурация графика
  return {
    type: 'line', // Тип графика - линия
    data: {
      labels: labels,
      datasets: [{
        label: 'y = sin(x)', // Название графика
        data: data,
        borderColor: 'rgb(75, 192, 192)', // Цвет линии
        tension: 0.1, // Сглаживание линии
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top', // Позиция легенды
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'X'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Y'
          }
        }
      }
    }
  };
}

function configMandrel() {
  return {
    type: 'line', // Тип графика - линия
    data: {
      labels: [],
      datasets: [
        {
          label: 'Mandrel', // Название графика
          data: [],
          borderColor: 'rgb(75, 192, 192)', // Цвет линии
          tension: 0.0, // Сглаживание линии
        },
        {
          label: 'Smoothed', // Название второго набора данных
          data: [],
          borderColor: 'rgb(192, 75, 75)', // Другой цвет линии
          borderDash: [5, 5], // Линия с пунктиром
          tension: 0.0, // Сглаживание линии
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top', // Позиция легенды
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'X'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Y'
          }
        }
      }
    }
  };
}

function createScatterConfig() {
  return {
    type: "line", // или "scatter"
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
          label: "Winded",
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
            text: "Y Axis",
          },
        },
      },
    },
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
  } else if (name == "Winded"){
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
  mandrelChart = new Chart(ctx, createScatterConfig());
}

chartOnLoad();
