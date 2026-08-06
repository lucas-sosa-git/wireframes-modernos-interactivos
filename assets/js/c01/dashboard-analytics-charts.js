$(function () {
    "use strict";

//chart 1 - Weekly Income Bar Chart
const chart1Options = {
    chart: {
      type: 'bar',
      width: '100%',
        height: 200,
      sparkline: { enabled: false },
      toolbar: { show: false },
      parentHeightOffset: 0
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '70%'
      }
    },
    stroke: { width: 0 },
    colors: ['#4f46e5'],
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    yaxis: {
      min: 0,
      max: 6,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: {
        show: true,
        style: {
          colors: '#6b7280',
          fontSize: '12px'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    grid: {
      show: false,
      padding: {
        top: -10,
        bottom: -10,
        left: 0,
        right: 0
      }
    },
    series: [{
      name: 'Income',
      data: [3.2, 4.1, 2.8, 3.8, 5.5, 3.9, 4.7]
    }]
  };

  const chart1 = new ApexCharts(document.querySelector("#chart1"), chart1Options);
  chart1.render();


    //chart 2 - Radial Bar Chart
  const chart2Options = {
    chart: {
      height: 130,  
      width: 130,
      type: "radialBar",
      sparkline: { enabled: true }
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: "60%"
        },
        track: {
          background: "#f1f5f9"
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: 5,
            fontSize: "18px",
            formatter: function () {
              return "68%";
            }
          }
        }
      }
    },
    colors: ["#4f46e5"],
    stroke: {
      lineCap: "round"
    },
    series: [68]
  };

  const chart2 = new ApexCharts(document.querySelector("#chart2"), chart2Options);
  chart2.render();


    //chart 3 - Visitors Line Chart
  const chart3Options = {
    chart: {
        height: 350,
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    markers: {
      size: 0,
      strokeWidth: 2,
      strokeColors: ["#4f46e5", "#10b981"],
      fillOpacity: 1,
      colors: ["#ffffff"],
      hover: { size: 4 }
    },
    colors: ["#4f46e5", "#10b981"],
    tooltip: {
      theme: "dark",
      enabled: true,
      y: {
        formatter: function (val) {
          return val + " visitors";
        }
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      labels: {
        style: {
          colors: "#6b7280", // fallback for getThemeTextColor()
          fontSize: "12px"
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val;
        },
        style: {
          colors: "#6b7280", // fallback for getThemeTextColor()
          fontSize: "12px"
        }
      }
    },
    grid: {
      show: true,
      borderColor:
        document.documentElement.getAttribute("data-bs-theme") === "dark"
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.1)",
      strokeDashArray: 4
    },
    legend: {
      show: false,
      position: "bottom",
      horizontalAlign: "right"
    },
    series: [
      {
        name: "New Visitors",
        data: [70, 95, 60, 140, 120, 160]
      },
      {
        name: "Old Visitors",
        data: [55, 85, 50, 100, 130, 90]
      }
    ]
  };

  const chart3 = new ApexCharts(document.querySelector("#chart3"), chart3Options);
  chart3.render();


    //chart 4 - Revenue Area Chart
  const chart4Options = {
    chart: {
      height: 170,  
      type: "area",
      sparkline: { enabled: true },
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    grid: {
      padding: {
        top: -20,
        bottom: -20,
        left: 0,
        right: 0
      }
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    markers: {
      size: 0
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100]
      }
    },
    colors: ["#4f46e5"],
    tooltip: {
      enabled: false
    },
    yaxis: {
      min: 40,
      max: 70,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    series: [{
      name: "Revenue",
      data: [47, 50, 46, 58, 41, 63, 49]
    }]
  };

  const chart4 = new ApexCharts(document.querySelector("#chart4"), chart4Options);
  chart4.render();


    //chart 5 - New Customers Bar Chart
  const chart5Options = {
    chart: {
      height: 170,
      type: "bar",
      sparkline: { enabled: true },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        columnWidth: "55%",
        borderRadius: 4
      }
    },
    grid: {
      padding: {
        top: -20,
        bottom: -20,
        left: 0,
        right: 0
      }
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    markers: {
      size: 0
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.4,
        opacityTo: 0.5,
        stops: [0, 100],
        colors: ["#0d6efd"]
      }
    },
    colors: ["#0d6efd"],
    tooltip: { enabled: false },
    yaxis: {
      min: 800,
      max: 1400,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    series: [{
      name: "New Customers",
      data: [900, 1100, 1000, 1200, 950, 1300, 1150]
    }]
  };

  const chart5 = new ApexCharts(document.querySelector("#chart5"), chart5Options);
  chart5.render();


    //chart 6 - Sessions Line Chart
  const chart6Options = {
    chart: {
      height: 170,  
      type: "line",
      sparkline: { enabled: true },
      toolbar: { show: false }
    },
    stroke: {
      curve: "straight",
      width: 2
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: "#f59e0b",
      fillOpacity: 1,
      colors: ["#ffffff"]
    },
    colors: ["#f59e0b"],
    tooltip: {
      enabled: false
    },
    grid: {
      padding: {
        top: -10,
        bottom: -10,
        left: 0,
        right: 0
      }
    },
    yaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      min: 90,
      max: 220
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    series: [{
      name: "Sessions",
      data: [120, 150, 100, 180, 140, 200, 160]
    }]
  };

  const chart6 = new ApexCharts(document.querySelector("#chart6"), chart6Options);
  chart6.render();


    //chart 7 - Revenue Sources Donut Chart
  const chart7Options = {
    chart: {
      height: 230,  
      type: "donut"
    },
    labels: ["Hospital", "Education", "Internet", "Grocery"],
    colors: ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444"],
    legend: { show: false },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: "80%",
          labels: {
            show: true,
            name: { show: false },
            value: { show: false },
            total: {
              show: true,
              label: "FACEBOOK",
              fontSize: "14px",
              color: "#4f46e5"
            }
          }
        }
      }
    },
    tooltip: { enabled: false },
    series: [120.6, 33.8, 20.6, 15.6]
  };

  const chart7 = new ApexCharts(document.querySelector("#chart7"), chart7Options);
  chart7.render();


    //chart 8 - Solved Tickets Radial Bar Chart
  const chart8Options = {
    chart: {
      height: 290,
      type: "radialBar",
      sparkline: { enabled: true }
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: "70%"
        },
        track: {
          background: "rgba(0, 40, 184, 0.0)"
        },
        dataLabels: {
          name: {
            offsetY: -20,
            show: true,
            color: "#9a9a9a",
            fontSize: "15px"
          },
          value: {
            offsetY: 10,
            fontSize: "35px",
            formatter: function (val) {
              return val + "%";
            }
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#4f46e5"],
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    colors: ["#4f46e5"],
    stroke: {
      dashArray: 6
    },
    labels: ["Solved Tickets"],
    series: [68]
  };

  const chart8 = new ApexCharts(document.querySelector("#chart8"), chart8Options);
  chart8.render();


});