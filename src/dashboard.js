import React, { useState,useEffect } from 'react';
import './App.css';
import muncher from './muncher.jpeg';
import Papa from 'papaparse';
import { Link } from "react-router-dom";
import { PDFDownloadLink, Document, Page, Text, View } from '@react-pdf/renderer';
import _ from 'lodash';
import { Bar, Line, Pie, Scatter, Radar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
import { FaChartBar, FaChartLine, FaChartPie, FaChartArea } from 'react-icons/fa';
import { Tooltip as ReactTooltip } from 'react-tooltip';


ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(BoxPlotController, BoxAndWiskers);

const SummaryCard = ({ title, value, icon, tooltip }) => (
  <div className="summary-card" data-tip={tooltip}>
    <div className="summary-icon">{icon}</div>
    <div className="summary-content">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
    <ReactTooltip place="top" type="dark" effect="float" />
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [graphData, setGraphData] = useState({});
  const [showPopup, setShowPopup] = useState(false); 
  const [displayData, setDisplayData] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 50; 

  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (result) => {
          const parsedData = result.data;
          setData(parsedData);
          setDisplayData(parsedData.slice(0, itemsPerPage)); 
        },
        header: true,
        skipEmptyLines: true,
      });
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

useEffect(() => {
  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight) {
      loadMoreData();
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [page, data]);

  const loadMoreData = () => {
    const nextPage = page + 1;
    const newData = data.slice(0, nextPage * itemsPerPage);
    setDisplayData(newData);
    setPage(nextPage);
  };

  useEffect(() => {
    if (displayData.length > 0) {
      generateSummary(displayData);
      generateGraphs(displayData);
    }
  }, [displayData]);

  const generateSummary = (data) => {
    if (data.length === 0) return;

    const uniqueData = _.uniqWith(data, _.isEqual);
    console.log("Duplicates removed");
  
    const cleanedData = uniqueData.map(row => {
      const cleanedRow = {};
      for (const key in row) {
        cleanedRow[key] = row[key] || 'N/A'; 
      }
      return cleanedRow;
    });
    console.log("Missing values handled");
  
    const standardizedData = cleanedData.map(row => {
      const standardizedRow = { ...row };
      for (const key in row) {
        if (Date.parse(row[key])) {
          standardizedRow[key] = new Date(row[key]).toISOString(); 
        }
      }
      return standardizedRow;
    });
    console.log("Data formats standardized");
  
    const columns = Object.keys(standardizedData[0]);
    const rowCount = standardizedData.length;
  
    const allNumericData = [];
    standardizedData.forEach(row => {
      columns.forEach(column => {
        const value = row[column];
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
          allNumericData.push(Number(value));
        }
      });
    });
  
    console.log("All numeric data:", allNumericData);
  
    const calculateMedian = (arr) => {
      const sortedArr = arr.slice().sort((a, b) => a - b);
      const mid = Math.floor(sortedArr.length / 2);
      return sortedArr.length % 2 !== 0 ? sortedArr[mid] : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
    };
  
    const calculateMode = (arr) => {
      const frequency = {};
      arr.forEach(value => frequency[value] = (frequency[value] || 0) + 1);
      const maxFreq = Math.max(...Object.values(frequency));
      return Object.keys(frequency).filter(key => frequency[key] === maxFreq);
    };
  
    const calculateStandardDeviation = (arr) => {
      const mean = _.mean(arr);
      const squaredDiffs = arr.map(value => Math.pow(value - mean, 2));
      return Math.sqrt(_.mean(squaredDiffs));
    };
  
    const calculateVariance = (arr) => {
      const mean = _.mean(arr);
      const squaredDiffs = arr.map(value => Math.pow(value - mean, 2));
      return _.mean(squaredDiffs);
    };
  
    const calculateRange = (arr) => {
      return _.max(arr) - _.min(arr);
    };
  
    const calculateIQR = (arr) => {
      const sortedArr = arr.slice().sort((a, b) => a - b);
      const q1 = sortedArr[Math.floor(sortedArr.length / 4)];
      const q3 = sortedArr[Math.floor(sortedArr.length * 3 / 4)];
      return q3 - q1;
    };
  
    const calculateSkewness = (arr) => {
      const mean = _.mean(arr);
      const n = arr.length;
      const m3 = _.mean(arr.map(value => Math.pow(value - mean, 3)));
      const m2 = Math.pow(_.mean(arr.map(value => Math.pow(value - mean, 2))), 1.5);
      return (n * m3) / ((n - 1) * (n - 2) * m2);
    };
  
    const calculateKurtosis = (arr) => {
      const mean = _.mean(arr);
      const n = arr.length;
      const m4 = _.mean(arr.map(value => Math.pow(value - mean, 4)));
      const m2 = Math.pow(_.mean(arr.map(value => Math.pow(value - mean, 2))), 2);
      return (n * (n + 1) * m4) / ((n - 1) * (n - 2) * (n - 3) * m2) - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    };
  
    const summary = {
      mean: allNumericData.length ? _.mean(allNumericData) : 'N/A',
      median: allNumericData.length ? calculateMedian(allNumericData) : 'N/A',
      mode: allNumericData.length ? calculateMode(allNumericData) : 'N/A',
      standardDeviation: allNumericData.length ? calculateStandardDeviation(allNumericData) : 'N/A',
      variance: allNumericData.length ? calculateVariance(allNumericData) : 'N/A',
      range: allNumericData.length ? calculateRange(allNumericData) : 'N/A',
      iqr: allNumericData.length ? calculateIQR(allNumericData) : 'N/A',
      skewness: allNumericData.length ? calculateSkewness(allNumericData) : 'N/A',
      kurtosis: allNumericData.length ? calculateKurtosis(allNumericData) : 'N/A',
      min: allNumericData.length ? _.min(allNumericData) : 'N/A',
      max: allNumericData.length ? _.max(allNumericData) : 'N/A',
    };
  
    const overview = {
      rowCount,
      columnCount: columns.length,
      summary,
    };
  
    setSummary(overview);
    console.log("Summary generated:", overview);
  };

  const generateGraphs = (data) => {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    let selectedColumnX = null;
    let selectedColumnY = null;

    for (const column of columns) {
      const columnData = data.map(row => row[column]);
      if (columnData.every(value => !isNaN(value))) {
        if (!selectedColumnX) {
          selectedColumnX = column;
        } else if (!selectedColumnY) {
          selectedColumnY = column;
          break;
        }
      }
    }

    if (!selectedColumnX || !selectedColumnY) return;

    const labels = data.map((row, index) => `Row ${index + 1}`);
    const valuesX = data.map(row => Number(row[selectedColumnX]));
    const valuesY = data.map(row => Number(row[selectedColumnY]));

    setGraphData({
      bar: {
        labels,
        datasets: [
          {
            label: selectedColumnX,
            data: valuesX,
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(75,192,192,1)',
            borderWidth: 1,
          },
        ],
      },
      line: {
        labels,
        datasets: [
          {
            label: selectedColumnX,
            data: valuesX,
            fill: false,
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(75,192,192,1)',
          },
        ],
      },
      pie: {
        labels,
        datasets: [
          {
            label: selectedColumnX,
            data: valuesX,
            backgroundColor: labels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.4)`),
            borderColor: labels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`),
            borderWidth: 1,
          },
        ],
      },
      scatter: {
        labels,
        datasets: [
          {
            label: `${selectedColumnX} vs ${selectedColumnY}`,
            data: valuesX.map((value, index) => ({ x: value, y: valuesY[index] })),
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(75,192,192,1)',
          },
        ],
      },
      radar: {
        labels,
        datasets: [
          {
            label: selectedColumnX,
            data: valuesX,
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(75,192,192,1)',
            pointBackgroundColor: 'rgba(75,192,192,1)',
          },
        ],
      },
      
    });
  };

  const SummaryPDF = ({ summary }) => (
    <Document>
      <Page size="A4" style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>CSV Data Summary</Text>
        <View style={{ marginTop: 10 }}>
          <Text>{`Mean: ${summary.mean ?? 'N/A'}`}</Text>
          <Text>{`Median: ${summary.median ?? 'N/A'}`}</Text>
          <Text>{`Mode: ${summary.mode ?? 'N/A'}`}</Text>
          <Text>{`Standard Deviation: ${summary.standardDeviation ?? 'N/A'}`}</Text>
          <Text>{`Variance: ${summary.variance ?? 'N/A'}`}</Text>
          <Text>{`Range: ${summary.range ?? 'N/A'}`}</Text>
          <Text>{`Interquartile Range (IQR): ${summary.iqr ?? 'N/A'}`}</Text>
          <Text>{`Skewness: ${summary.skewness ?? 'N/A'}`}</Text>
          <Text>{`Kurtosis: ${summary.kurtosis ?? 'N/A'}`}</Text>
          <Text>{`Min: ${summary.min ?? 'N/A'}`}</Text>
          <Text>{`Max: ${summary.max ?? 'N/A'}`}</Text>
        </View>
      </Page>
    </Document>
  );

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/">
          <img src={muncher} className="App-logo" alt="logo" />
        </Link>
        <h1 style={{fontSize: 'clamp(0.2rem, 4vw, 3rem)'}}>Dashboard</h1>
      </header>
      <div className="App-content">
        <p>Welcome to your dashboard!</p>
        <div className="import-box">
          <h2>Import CSV Data Only</h2>
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </div>
        {data && (
          <>
            <button className="btn" onClick={() => setShowPopup(true)}>Review Uploaded CSV - Cleaned & Tuned</button>
            {showPopup && (
              <div className="popup">
                <div className="popup-content">
                  <button className="close-btn" onClick={() => setShowPopup(false)}>X</button>
                  <h2>Uploaded CSV Data</h2>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {Object.keys(data[0]).map((key, index) => (
                          <th key={index}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {summary && (
          <>
            <h2>Data Overview</h2>
            <div className="summary-grid">
              <SummaryCard title="Mean" value={summary.summary.mean ?? 'N/A'} icon={<FaChartBar />} tooltip="The mean is the average of all numeric values in the dataset." />
              <SummaryCard title="Median" value={summary.summary.median ?? 'N/A'} icon={<FaChartLine />} tooltip="The median is the middle value when all numeric values are sorted in order." />
              <SummaryCard title="Mode" value={summary.summary.mode ?? 'N/A'} icon={<FaChartPie />} tooltip="The mode is the most frequently occurring value in the dataset." />
              <SummaryCard title="Standard Deviation" value={summary.summary.standardDeviation ?? 'N/A'} icon={<FaChartArea />} tooltip="Standard deviation measures the amount of variation or dispersion in the dataset." />
              <SummaryCard title="Variance" value={summary.summary.variance ?? 'N/A'} icon={<FaChartBar />} tooltip="Variance is the average of the squared differences from the mean." />
              <SummaryCard title="Range" value={summary.summary.range ?? 'N/A'} icon={<FaChartLine />} tooltip="The range is the difference between the maximum and minimum values in the dataset." />
              <SummaryCard title="IQR" value={summary.summary.iqr ?? 'N/A'} icon={<FaChartPie />} tooltip="The interquartile range (IQR) is the range between the first quartile (Q1) and the third quartile (Q3)." />
              <SummaryCard title="Skewness" value={summary.summary.skewness ?? 'N/A'} icon={<FaChartArea />} tooltip="Skewness measures the asymmetry of the distribution of values in the dataset." />
              <SummaryCard title="Kurtosis" value={summary.summary.kurtosis ?? 'N/A'} icon={<FaChartBar />} tooltip="Kurtosis measures the 'tailedness' of the distribution of values in the dataset." />
              <SummaryCard title="Min" value={summary.summary.min ?? 'N/A'} icon={<FaChartLine />} tooltip="The minimum value is the smallest numeric value in the dataset." />
              <SummaryCard title="Max" value={summary.summary.max ?? 'N/A'} icon={<FaChartPie />} tooltip="The maximum value is the largest numeric value in the dataset." />
            </div>

            {/* Bar Graph */}
            {graphData.bar && (
              <div className="chart-container">
                <h2>Bar Graph</h2>
                <Bar data={graphData.bar} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            )}

            {/* Line Graph */}
            {graphData.line && (
              <div className="chart-container">
                <h2>Line Graph</h2>
                <Line data={graphData.line} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            )}

            {/* Pie Chart */}
            {graphData.pie && (
              <div className="chart-container">
                <h2>Pie Chart</h2>
                <Pie data={graphData.pie} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            )}

            {/* Scatter Plot */}
            {graphData.scatter && (
              <div className="chart-container">
                <h2>Scatter Plot</h2>
                <Scatter data={graphData.scatter} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            )}

            {/* Radar Chart */}
            {graphData.radar && (
              <div className="chart-container">
                <h2>Radar Chart</h2>
                <Radar data={graphData.radar} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            )}

            {/* Maybe more graph types here... */}

            {/* PDF Export Button */}
            <PDFDownloadLink
              document={<SummaryPDF summary={summary.summary} />}
              fileName="data-summary.pdf"
            >
              {({ loading }) => (loading ? 'Loading PDF...' : 'Download PDF')}
            </PDFDownloadLink>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;