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
    type: 'scatter', // или 'line'
    data: {
      datasets: [
        {
          label: 'Raw',
          data: [
            // { x: 1, y: 2 },
            // { x: 2, y: 4 },
            // { x: 3, y: 6 },
            // { x: 4, y: 8 },
          ], // Массив точек с координатами x, y
          borderColor: '#48A6A7',
          borderDash: [5, 5], // Пунктирная линия
          showLine: true, // Отображаем соединяющую линию
          tension: 0.0, // Сглаживание линии
          pointRadius: function(context) {
            return context.dataIndex === 0 ? 8 : 4;
          },
        },
        {
          label: 'Smoothed',
          data: [
            // { x: 1, y: 1.5 },
            // { x: 2, y: 3.5 },
            // { x: 3, y: 5.5 },
            // { x: 4, y: 7.5 },
          ],
          borderColor: '#2973B2',
          showLine: true, // Показываем линию
          tension: 0.0,
          pointRadius: function(context) {
            return context.dataIndex === 0 ? 8 : 4;
          },

        },
      ],
    },
    options: {
      responsive: true,  // График будет адаптироваться к изменениям размера контейнера
      maintainAspectRatio: false,  // Отключаем сохранение пропорций
      plugins: {
        legend: {
          position: 'top',
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true, // Включаем масштабирование колесиком мыши
            },
            pinch: {
              enabled: true, // Включаем масштабирование с помощью pinch (для сенсорных экранов)
            },
            mode: 'xy', // Масштабирование по обеим осям
          },
          pan: {
            enabled: true, // Включаем панорамирование
            mode: 'xy', // Панорамирование по обеим осям
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'X Axis',
          },
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'Y Axis',
          },
        },
      },
    },
  };
}

function mandrelChartUpdate(mandrelS){
  if(!mandrelS) return;
  const { mandrel, isSmoothed } = mandrelS;
  
  if(!mandrel) return;
  const {x, r} = mandrel;

  const data = x.map((value, index) => ({ 
    x: value, 
    y: r[index] 
  }));
  mandrelChart.data.datasets[isSmoothed ? 1 : 0].data = data;
  mandrelChart.update();
}
window.mandrelChartUpdate = mandrelChartUpdate;


function clearChart(){
  mandrelChartUpdate({mandrel: {x: [], r: []}, isSmoothed: false});
  mandrelChartUpdate({mandrel: {x: [], r: []}, isSmoothed: true });
}
window.clearChart = clearChart;


function chartOnLoad() {
  Chart.register(ChartZoom);

  const ctx = document.getElementById('mandrel-canvas').getContext('2d');
  mandrelChart = new Chart(ctx, createScatterConfig());
}

chartOnLoad();
