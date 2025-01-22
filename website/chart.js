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

function chartOnLoad() {
  const ctx = document.getElementById('static-2d-canvas').getContext('2d');
  new Chart(ctx, configSin());
}

chartOnLoad();
