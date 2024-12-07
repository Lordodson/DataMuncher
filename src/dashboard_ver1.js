import React, { useState } from 'react';
import './App.css';
import muncher from './muncher.jpeg';
import Papa from 'papaparse';
import { Link } from "react-router-dom";
import { PDFDownloadLink, Document, Page, Text, View } from '@react-pdf/renderer';
import _ from 'lodash';
import { Bar, Line, Pie, Scatter, Radar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
// import { HeatmapController, HeatmapElement } from 'chartjs-chart-heatmap';
// import { BubbleController, BubbleElement } from 'chartjs-chart-bubble';
// import { SankeyController, Flow } from 'chartjs-chart-sankey';

ChartJS.register(ArcElement, Tooltip, Legend);
// ChartJS.register(TreemapController, TreemapElement);
ChartJS.register(BoxPlotController, BoxAndWiskers);
// ChartJS.register(HeatmapController, HeatmapElement);
// ChartJS.register(BubbleController, BubbleElement);
// ChartJS.register(SankeyController, Flow);

const Dashboard = () => {
  const [data, setData] = useState(null); // For storing CSV data
  const [summary, setSummary] = useState(null); // For storing summary of data
  const [graphData, setGraphData] = useState({}); // For storing graph data

  // File upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file && file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (result) => {
          const parsedData = result.data;
          setData(parsedData);
          generateSummary(parsedData);
          generateGraphs(parsedData);
        },
        header: true, // First row as headers
        skipEmptyLines: true,
      });
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  // Function to clean and summarize data
  const generateSummary = (data) => {
    if (data.length === 0) return;

    // Remove duplicates
    const uniqueData = _.uniqWith(data, _.isEqual);
    console.log("Duplicates removed");

    // Handle missing values
    const cleanedData = uniqueData.map(row => {
      const cleanedRow = {};
      for (const key in row) {
        cleanedRow[key] = row[key] || 'N/A'; // Fill missing values with 'N/A'
      }
      return cleanedRow;
    });
    console.log("Missing values handled");

    // Standardize data formats 
    const standardizedData = cleanedData.map(row => {
      const standardizedRow = { ...row };
      for (const key in row) {
        if (Date.parse(row[key])) {
          standardizedRow[key] = new Date(row[key]).toISOString(); // Convert dates to ISO format
        }
      }
      return standardizedRow;
    });
    console.log("Data formats standardized");

    const columns = Object.keys(standardizedData[0]);
    const rowCount = standardizedData.length;

    const summary = columns.map((column) => {
      const columnData = standardizedData.map(row => row[column]);
      const numericData = columnData.filter(value => !isNaN(value)).map(Number);

      const uniqueValues = _.uniq(columnData);
      const nonEmptyValues = columnData.filter(Boolean);

      const calculateMedian = (arr) => {
        const sortedArr = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sortedArr.length / 2);

        return sortedArr.length % 2 !== 0 ? sortedArr[mid] : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
      };

      const dataType = numericData.length ? (columnData.some(value => value.includes('.') || value.includes(',')) ? 'float' : 'int') : 'object';

      return {
        column,
        dataType,
        nonNullCount: nonEmptyValues.length,
        uniqueValuesCount: uniqueValues.length,
        mean: numericData.length ? _.mean(numericData) : null,
        median: numericData.length ? calculateMedian(numericData) : null,
        min: numericData.length ? _.min(numericData) : null,
        max: numericData.length ? _.max(numericData) : null,
      };
    });

    const overview = {
      rowCount,
      columnCount: columns.length,
      columns,
      summary,
    };

    setSummary(overview);
    console.log("Summary generated");
  };

  // Function to generate graph data
  const generateGraphs = (data) => {
    if (data.length === 0) return;

    // Determine the most useful columns for graphs
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

    // Prepare data for the graphs
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
      // Possibly add more graph types here...
    });
  };

  // PDF export
  const SummaryPDF = ({ summary }) => (
    <Document>
      <Page size="A4" style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>CSV Data Summary</Text>
        {summary.map((colSummary, idx) => (
          <View key={idx} style={{ marginTop: 10 }}>
            <Text>{`Column: ${colSummary.column}`}</Text>
            <Text>{`Non-null count: ${colSummary.nonNullCount}`}</Text>
            <Text>{`Unique values count: ${colSummary.uniqueValuesCount}`}</Text>
            <Text>{`Mean: ${colSummary.mean ?? 'N/A'}`}</Text>
            <Text>{`Median: ${colSummary.median ?? 'N/A'}`}</Text>
            <Text>{`Min: ${colSummary.min ?? 'N/A'}`}</Text>
            <Text>{`Max: ${colSummary.max ?? 'N/A'}`}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/">
            <img src={muncher} className="App-logo" alt="logo" />
        </Link>
        <h1>Dashboard</h1>
      </header>
      <div className="App-content">
        <p>Welcome to your dashboard!</p>
        <div className="import-box">
          <h2>Import Data</h2>
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </div>
        {summary && (
          <>
            <h2>Data Overview</h2>
            <p>{`Number of rows: ${summary.rowCount}`}</p>
            <p>{`Number of columns: ${summary.columnCount}`}</p>

            {/* Bar Graph */}
            {graphData.bar && (
              <>
                <h2>Bar Graph</h2>
                <Bar data={graphData.bar} />
              </>
            )}

            {/* Line Graph */}
            {graphData.line && (
              <>
                <h2>Line Graph</h2>
                <Line data={graphData.line} />
              </>
            )}

            {/* Pie Chart */}
            {graphData.pie && (
              <>
                <h2>Pie Chart</h2>
                <Pie data={graphData.pie} />
              </>
            )}

            {/* Scatter Plot */}
            {graphData.scatter && (
              <>
                <h2>Scatter Plot</h2>
                <Scatter data={graphData.scatter} />
              </>
            )}

            {/* Radar Chart */}
            {graphData.radar && (
              <>
                <h2>Radar Chart</h2>
                <Radar data={graphData.radar} />
              </>
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