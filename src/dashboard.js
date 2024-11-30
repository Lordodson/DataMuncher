import React, { useState } from 'react';
import './App.css';
import muncher from './muncher.jpeg';
import Papa from 'papaparse';
import { Link } from "react-router-dom";
import { PDFDownloadLink, Document, Page, Text, View } from '@react-pdf/renderer';
import _ from 'lodash';

const Dashboard = () => {
  const [data, setData] = useState(null); // For storing CSV data
  const [summary, setSummary] = useState(null); // For storing summary of data

  // File upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file && file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (result) => {
          const parsedData = result.data;
          setData(parsedData);
          generateSummary(parsedData);
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

  const columns = Object.keys(standardizedData);
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
            {/*  REQUIRES FURTHER REFACTORING
             <p>{`Columns: ${summary.columns.join(', ')}`}</p> */}
    
            {/* <h2>Data Summary</h2>
            <table border="1">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Non-null count</th>
                  <th>Unique values count</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Min</th>
                  <th>Max</th>
                </tr>
              </thead>
              <tbody>
                {summary.summary.map((colSummary, idx) => (
                  <tr key={idx}>
                    <td>{colSummary.column}</td>
                    <td>{colSummary.nonNullCount}</td>
                    <td>{colSummary.uniqueValuesCount}</td>
                    <td>{colSummary.mean ?? 'N/A'}</td>
                    <td>{colSummary.median ?? 'N/A'}</td>
                    <td>{colSummary.min ?? 'N/A'}</td>
                    <td>{colSummary.max ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table> */}
          
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