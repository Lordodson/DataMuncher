import React, { useState } from 'react';
import './PyAd.css';
import muncher from './muncher.jpeg';
import { Link } from "react-router-dom";
import Papa from 'papaparse';
import DataModal from './DataModal';
import DataPagination from './DataPagination';

const PyAdvanced = () => {
    const [importedData, setImportedData] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [tableColumns, setTableColumns] = useState([]);
    const [summary, setSummary] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const handleFileUpload = (event) => {
        const files = event.target.files;

        if (files && files.length > 0) {
            const file = files[0];

            if (file && file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    complete: (result) => {
                        if (result.data.length > 0) {
                            setImportedData(result.data);
                            setTableColumns(Object.keys(result.data[0]));
                            setSuccessMessage("File imported successfully!");
                            setErrorMessage("");
                            generateSummary(result.data);
                        } else {
                            setImportedData([]);
                            setTableColumns([]);
                            setErrorMessage("No data found in the file.");
                            setSuccessMessage("");
                        }
                    },
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    error: (error) => {
                        setErrorMessage("Error parsing CSV: " + error.message);
                        setImportedData([]);
                        setSuccessMessage("");
                    }
                });
            } else {
                setErrorMessage(`File "${file.name}" is not a valid CSV file.`);
                setImportedData([]);
                setSuccessMessage("");
            }
        } else {
            setErrorMessage("No file selected.");
            setImportedData([]);
            setSuccessMessage("");
        }
    };

    const generateSummary = (data) => {
        const numericColumns = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');
        const summary = {};
    
        numericColumns.forEach(column => {
            const values = data.map(row => row[column]);
            const mean = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
            const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
            const mode = values.sort((a, b) =>
                values.filter(v => v === a).length - values.filter(v => v === b).length
            ).pop();
            const range = (Math.max(...values) - Math.min(...values)).toFixed(2);
            const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length).toFixed(2);
            const variance = (values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length).toFixed(2);
            const mad = (values.reduce((a, b) => a + Math.abs(b - mean), 0) / values.length).toFixed(2);
            const cv = (stdDev / mean).toFixed(2);
            const skewness = (values.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / values.length / Math.pow(stdDev, 3)).toFixed(2);
            const kurtosis = (values.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / values.length / Math.pow(variance, 2) - 3).toFixed(2);
            const percentiles = [25, 50, 75].map(p => values[Math.floor(p / 100 * values.length)]);
    
            summary[column] = {
                mean,
                median,
                mode,
                range,
                stdDev,
                variance,
                mad,
                cv,
                skewness,
                kurtosis,
                percentiles: {
                    25: percentiles[0],
                    50: percentiles[1],
                    75: percentiles[2]
                }
            };
        });
    
        setSummary(summary);
    };

    const handleClearData = () => {
        setImportedData([]);
        setErrorMessage("");
        setSuccessMessage("");
        setSummary(null);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleShowModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = importedData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(importedData.length / rowsPerPage);

    return (
        <div className="App">
            <header className="App-header">
                <Link to="/">
                    <img src={muncher} className="App-logo" alt="logo" />
                </Link>
                <h1 style={{ fontSize: 'clamp(0.2rem, 4vw, 3rem)' }}>Import Data</h1>
            </header>
            <div className="App-content">
                <div className="import-box">
                    <h2 className="import-header">Import CSV Data</h2>
                    <input type="file" accept=".csv" onChange={handleFileUpload} />
                    {errorMessage && <p className="pyad-error-message">{errorMessage}</p>}
                    {successMessage && <p className="pyad-success-message">{successMessage}</p>}
                </div>

                {importedData.length > 0 && (
                    <div>
                        <h2>Imported Data Preview</h2>
                        <button onClick={handleClearData} className="pyad-clear-button">Clear Data</button>
                        <button onClick={handleShowModal} className="pyad-view-button">View Dataset</button>
                    </div>
                )}

                {summary && (
                    <div>
                        <h2>Data Summary</h2>
                        <div className="summary-cards">
                            {Object.keys(summary).map((column, index) => (
                                <div key={index} className="summary-card">
                                    <h3>{column}</h3>
                                    <p><strong>Mean:</strong> {summary[column].mean}</p>
                                    <p><strong>Median:</strong> {summary[column].median}</p>
                                    <p><strong>Mode:</strong> {summary[column].mode}</p>
                                    <p><strong>Range:</strong> {summary[column].range}</p>
                                    <p><strong>Standard Deviation:</strong> {summary[column].stdDev}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showModal && (
                    <DataModal show={showModal} handleClose={handleCloseModal}>
                        <h2>Dataset</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {tableColumns.map((column, index) => (
                                        <th key={index}>{column}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((row, index) => (
                                    <tr key={index}>
                                        {tableColumns.map((column, columnIndex) => (
                                            <td key={columnIndex}>
                                                {row[column] !== undefined ? row[column] : ""}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <DataPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </DataModal>
                )}
            </div>
        </div>
    );
};

export default PyAdvanced;