import React, { useState, useEffect, useRef } from 'react';
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
import { FaChartBar, FaChartLine, FaChartPie, FaChartArea, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import FeedbackForm from './FeedbackForm';
import PivotTableUI from 'react-pivottable';
import 'react-pivottable/pivottable.css';

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
    const [sampledData, setSampledData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [graphData, setGraphData] = useState({});
    const [showPopup, setShowPopup] = useState(false);
    const [displayData, setDisplayData] = useState([]);
    const [page, setPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [fileUploaded, setFileUploaded] = useState(false);
    const [duplicateRemovalComplete, setDuplicateRemovalComplete] = useState(false);
    const [missingValueHandlingComplete, setMissingValueHandlingComplete] = useState(false);
    const [numericColumnIdentificationComplete, setNumericColumnIdentificationComplete] = useState(false);
    const [extractionOfNumericDataComplete, setExtractionOfNumericDataComplete] = useState(false);
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [handleMissingValues, setHandleMissingValues] = useState(true);
    const [identifyNumericColumns, setIdentifyNumericColumns] = useState(true);
    const [extractNumericData, setExtractNumericData] = useState(true);
    const [graphErrorMessage, setGraphErrorMessage] = useState("");
    const [summaryErrorMessage, setSummaryErrorMessage] = useState("");
    const fileInputRef = useRef(null);
    const [isSpinning, setIsSpinning] = useState(false);

    const [csvUploadTime, setCsvUploadTime] = useState(null);
    const [processingTimes, setProcessingTimes] = useState({
        duplicateRemoval: null,
        missingValueHandling: null,
        numericColumnIdentification: null,
        extractionOfNumericData: null,
    });
    const [summaryGenerationTime, setSummaryGenerationTime] = useState(null);
    const [graphGenerationTime, setGraphGenerationTime] = useState(null);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [missingValueCount, setMissingValueCount] = useState(0);
    const [numericColumnCount, setNumericColumnCount] = useState(0);
    const [extractedValueCount, setExtractedValueCount] = useState(0);
    const [optionsOpen, setOptionsOpen] = useState(true);
    const toggleOptions = () => setOptionsOpen(!optionsOpen);
    const [pivotState, setPivotState] = useState({});
    const [pivotOptions, setPivotOptions] = useState({
        rows: [],
        cols: [],
        vals: [],
        aggregatorName: "Sum",
        rendererName: "Table",
    });

    const [chartSelections, setChartSelections] = useState({
        bar: { xAxis: "" },
        line: { xAxis: "" },
        pie: { xAxis: "" },
        scatter: { xAxis: "" },
        radar: { xAxis: "" },
    });

    const [selectedColumn, setSelectedColumn] = useState(''); 

    const SAMPLE_SIZE = 500;

    const sampleData = (data) => {
        if (!data || data.length <= SAMPLE_SIZE) {
            return data;
        }

        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, SAMPLE_SIZE);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            const startTime = performance.now();
            Papa.parse(file, {
                complete: (result) => {
                    const endTime = performance.now();

                    setCsvUploadTime(Math.max((endTime - startTime) / 1000, Number.EPSILON))
                    const parsedData = result.data;
                    console.log("Parsed data:", parsedData);
                    setData(parsedData);

                    const sampled = sampleData(parsedData);
                    setSampledData(sampled);

                    const initialDisplayData = parsedData.slice(0, itemsPerPage);
                    setDisplayData(initialDisplayData);
                    setFileUploaded(true);
                    setDuplicateRemovalComplete(false);
                    setMissingValueHandlingComplete(false);
                    setNumericColumnIdentificationComplete(false);
                    setExtractionOfNumericDataComplete(false);
                    setSelectedColumn(''); 

                    setDuplicateCount(0);
                    setMissingValueCount(0);
                    setNumericColumnCount(0);
                    setExtractedValueCount(0);
                    setGraphErrorMessage("");
                    setSummaryErrorMessage("");

                    if (parsedData && parsedData.length > 0) {
                        const headers = Object.keys(parsedData[0]);

                        if (headers.length === 0) {
                            console.error("CSV file has no headers or data rows.");
                            return;
                        }

                        setPivotOptions(prev => ({
                            ...prev,
                            rows: headers.length > 0 ? headers.slice(0, 1) : [],
                            cols: headers.length > 1 ? headers.slice(1, 2) : [],
                            vals: headers.length > 2 ? headers.slice(2, 3) : [],
                        }));

                        setPivotState({});

                        setChartSelections((prev) => ({
                            bar: { xAxis: headers[0] || "" },
                            line: { xAxis: headers[0] || "" },
                            pie: { xAxis: headers[0] || "" },
                            scatter: { xAxis: headers[0] || "" },
                            radar: { xAxis: headers[0] || "" },
                        }));
                    }
                },
                header: true,
                skipEmptyLines: true,
            });
        } else {
            alert("Please upload a valid CSV file.");
        }
    };

    useEffect(() => {
        if (data) {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = page * itemsPerPage;
            setDisplayData(data.slice(startIndex, endIndex));
        }
    }, [page, data, itemsPerPage]);


    useEffect(() => {
        if (sampledData && selectedColumn) {
            setIsSpinning(true); 
            generateSummary(sampledData, selectedColumn);
            generateGraphs(sampledData);
            setTimeout(() => setIsSpinning(false), 300); 
        }
    }, [sampledData, selectedColumn, removeDuplicates, handleMissingValues, identifyNumericColumns, extractNumericData, chartSelections]);

    const generateSummary = (data, selectedColumn) => {
        if (!data || data.length === 0) {
            setSummaryErrorMessage("No data available.");
            setSummary(null);
            return;
        }

        if (!selectedColumn) {
            setSummaryErrorMessage("Please select a column to analyze.");
            setSummary(null);
            return;
        }

        let startTime = performance.now();

        const columnData = data.map(row => row[selectedColumn]);

        
        const isNumericColumn = columnData.every(value => {
            return !isNaN(parseFloat(value)) && isFinite(value);
        });

        let summary;

        if (isNumericColumn) {
            
            const numericData = columnData.map(value => Number(value));

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

            summary = {
                type: 'numerical', 
                mean: numericData.length ? _.mean(numericData).toFixed(4) : 'N/A',
                median: numericData.length ? calculateMedian(numericData).toFixed(4) : 'N/A',
                mode: numericData.length ? calculateMode(numericData) : 'N/A',
                standardDeviation: numericData.length ? calculateStandardDeviation(numericData).toFixed(4) : 'N/A',
                variance: numericData.length ? calculateVariance(numericData).toFixed(4) : 'N/A',
                range: numericData.length ? calculateRange(numericData).toFixed(4) : 'N/A',
                iqr: numericData.length ? calculateIQR(numericData).toFixed(4) : 'N/A',
                skewness: numericData.length ? calculateSkewness(numericData).toFixed(4) : 'N/A',
                kurtosis: numericData.length ? calculateKurtosis(numericData).toFixed(4) : 'N/A',
                min: numericData.length ? _.min(numericData).toFixed(4) : 'N/A',
                max: numericData.length ? _.max(numericData).toFixed(4) : 'N/A',
            };
        } else {
            
            const valueCounts = _.countBy(columnData);
            const uniqueValues = Object.keys(valueCounts);
            const topValues = uniqueValues
                .sort((a, b) => valueCounts[b] - valueCounts[a])
                .slice(0, 5); 

            summary = {
                type: 'categorical',  
                uniqueCount: uniqueValues.length,
                topValues: topValues.map(value => ({ value, count: valueCounts[value] })),
            };
        }

        let endTime = performance.now();
        setSummaryGenerationTime(Math.max((endTime - startTime) / 1000, Number.EPSILON));

        setSummary(summary);
        console.log("Summary generated:", summary);
        setSummaryErrorMessage("");
    };

    const generateGraphs = (data) => {
        let startTime = performance.now();
        if (data && data.length === 0) return;

        if (!extractNumericData || !identifyNumericColumns) {
            setGraphErrorMessage("Graph generation is not possible without the 'Identify Numeric Columns' and 'Extract Numeric Data' options turned on");
            setGraphData({});
            return;
        } else {
            setGraphErrorMessage("");
        }

        const generateChartData = (chartType) => {
            if (!data) return null;
            const columns = Object.keys(data[0]);

            const xAxisColumn = chartSelections[chartType].xAxis || columns[0];
            const yAxisColumn = chartSelections[chartType].yAxis || columns[1];


            const labels = data.map((row, index) => `Row ${index + 1}`);
            const valuesX = data.map(row => Number(row[xAxisColumn]));
            const valuesY = data.map(row => Number(row[yAxisColumn]));


            switch (chartType) {
                case "bar":
                    return {
                        labels,
                        datasets: [
                            {
                                label: xAxisColumn,
                                data: valuesX,
                                backgroundColor: 'rgba(75,192,192,0.4)',
                                borderColor: 'rgba(75,192,192,1)',
                                borderWidth: 1,
                            },
                        ],
                    };
                case "line":
                    return {
                        labels,
                        datasets: [
                            {
                                label: xAxisColumn,
                                data: valuesX,
                                fill: false,
                                backgroundColor: 'rgba(75,192,192,0.4)',
                                borderColor: 'rgba(75,192,192,1)',
                            },
                        ],
                    };
                case "pie":
                    return {
                        labels,
                        datasets: [
                            {
                                label: xAxisColumn,
                                data: valuesX,
                                backgroundColor: labels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.4)`),
                                borderColor: labels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`),
                                borderWidth: 1,
                            },
                        ],
                    };
                case "scatter":
                    return {
                        labels,
                        datasets: [
                            {
                                label: `${xAxisColumn} vs ${yAxisColumn}`,
                                data: valuesX.map((value, index) => ({ x: value, y: valuesY[index] })),
                                backgroundColor: 'rgba(75,192,192,0.4)',
                                borderColor: 'rgba(75,192,192,1)',
                            },
                        ],
                    };
                case "radar":
                    return {
                        labels,
                        datasets: [
                            {
                                label: xAxisColumn,
                                data: valuesX,
                                backgroundColor: 'rgba(75,192,192,0.4)',
                                borderColor: 'rgba(75,192,192,1)',
                                pointBackgroundColor: 'rgba(75,192,192,1)',
                            },
                        ],
                    };
                default:
                    return null;
            }
        }

        let endTime = performance.now();
        setGraphGenerationTime(Math.max((endTime - startTime) / 1000, Number.EPSILON));

        setGraphData({
            bar: generateChartData("bar"),
            line: generateChartData("line"),
            pie: generateChartData("pie"),
            scatter: generateChartData("scatter"),
            radar: generateChartData("radar")
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


    const handlePivotChange = (state) => {
        setPivotState(state);
        setPivotOptions(prevState => ({
            ...prevState,
            rows: state.rows || [],
            cols: state.cols || [],
            vals: state.vals || [],
            aggregatorName: state.aggregatorName,
            rendererName: state.rendererName,
        }));
    };

    const handlePivotOptionChange = (option, value) => {
        setPivotOptions(prevOptions => ({
            ...prevOptions,
            [option]: value
        }));
    };

    const handleChartAxisChange = (chartType, axis, value) => {
        setChartSelections((prev) => ({
            ...prev,
            [chartType]: {
                xAxis: value,
            }
        }));
    };

    return (
        <div className="App">
            <header className="App-header">
                <Link to="/">
                    <img src={muncher} className="App-logo" alt="logo" />
                </Link>
                <h1 style={{ fontSize: 'clamp(0.2rem, 4vw, 3rem)' }}>Dashboard</h1>
            </header>
            <div className="App-content">
                {/* <p>Welcome to your dashboard!</p> */}
                <div className="import-controls">

                    <div className="import-box">
                        <h2 className="import-header">Import CSV Data Only</h2>
                        <p style={{ fontSize: '0.8em' }}>Important Note: Some datasets may not return a summary or graphs.</p>
                        <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} />
                    </div>

                    <div className={`toggle-options-container-dash ${optionsOpen ? '' : 'collapsed'}`}>
                        <div className="toggle-button" onClick={toggleOptions}>
                            {optionsOpen ? <FaArrowRight /> : <FaArrowLeft />}
                        </div>
                        <p style={{ fontSize: '1em' }}>Cleaning Options</p>
                        <div className="toggle-option">
                            <input type="checkbox" id="removeDuplicates" checked={removeDuplicates} onChange={(e) => setRemoveDuplicates(e.target.checked)} />
                            <label htmlFor="removeDuplicates">Remove Duplicates</label>
                        </div>
                        <div className="toggle-option">
                            <input type="checkbox" id="handleMissingValues" checked={handleMissingValues} onChange={(e) => setHandleMissingValues(e.target.checked)} />
                            <label htmlFor="handleMissingValues">Handle Missing Values</label>
                        </div>
                        <div className="toggle-option">
                            <input type="checkbox" id="identifyNumericColumns" checked={identifyNumericColumns} onChange={(e) => setIdentifyNumericColumns(e.target.checked)} />
                            <label htmlFor="identifyNumericColumns">Identify Numeric Columns</label>
                        </div>
                        <div className="toggle-option">
                            <input type="checkbox" id="extractNumericData" checked={extractNumericData} onChange={(e) => setExtractNumericData(e.target.checked)} />
                            <label htmlFor="extractNumericData">Extract Numeric Data</label>
                        </div>
                        {/*<button onClick={handleRefresh} className="refresh-button" style={isSpinning ? { transform: 'rotate(360deg)' } : {}}>*/}
                        {/*    <FaSyncAlt color="#007bff" size="1em" />*/}
                        {/*</button>*/}
                    </div>
                </div>

                <div className="status-message-container">
                    <ul style={{ listStyleType: "none", padding: "0px" }}>
                        <h2 className="status-message-header">Data Status</h2>
                        <li className="status-message" style={{ display: fileUploaded ? 'block' : 'none' }}>✅ .csv uploaded!</li>
                        {removeDuplicates && (<li className="status-message" style={{ display: duplicateRemovalComplete ? 'block' : 'none' }}>✅ Duplicate Removal Cleaning Complete! {duplicateCount > 0 ? `(${duplicateCount} duplicates removed)` : "(0 duplicates removed)"}</li>)}
                        {handleMissingValues && (<li className="status-message" style={{ display: missingValueHandlingComplete ? 'block' : 'none' }}>✅ Missing Value Handling Cleaning Complete! {missingValueCount > 0 ? `(${missingValueCount} missing values handled)` : "(0 missing values handled)"}</li>)}
                        {identifyNumericColumns && (<li className="status-message" style={{ display: numericColumnIdentificationComplete ? 'block' : 'none' }}>✅ Numeric Column identification Cleaning Complete! {numericColumnCount > 0 ? `(${numericColumnCount} numeric columns identified)` : "(0 numeric columns identified)"}</li>)}
                        {extractNumericData && (<li className="status-message" style={{ display: extractionOfNumericDataComplete ? 'block' : 'none' }}>✅ Extraction of Numeric Data Complete! {extractedValueCount > 0 ? `(${extractedValueCount} numeric values extracted)` : "(0 numeric values extracted)"}</li>)}
                        <div className="performance-stats-container">
                            <h2 className="status-message-header">Performance Stats</h2>
                            {csvUploadTime !== null && (
                                <li className="status-message">
                                    <strong>File Upload Time: </strong> {csvUploadTime.toFixed(6)} seconds
                                </li>
                            )}
                            {Object.entries(processingTimes).map(([key, time]) => {
                                return time !== null && (
                                    <li key={key} className="status-message">
                                        <strong>{key}: </strong> {time.toFixed(6)} seconds
                                    </li>
                                );
                            })}
                            {summaryGenerationTime !== null && (
                                <li className="status-message">
                                    <strong>Summary Generation Time: </strong> {summaryGenerationTime.toFixed(6)} seconds
                                </li>
                            )}
                            {graphGenerationTime !== null && (
                                <li className="status-message">
                                    <strong>Graph Generation Time: </strong> {graphGenerationTime.toFixed(6)} seconds
                                </li>
                            )}
                        </div>
                    </ul>
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
                                            {displayData.map((row, index) => (
                                                <tr key={index}>
                                                    {Object.values(row).map((value, cellIndex) => (
                                                        <td key={cellIndex}>{value}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="pagination-buttons">
                                        <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page <= 1}>
                                            Previous Page
                                        </button>
                                        <span>Page {page}</span>
                                        <button onClick={() => setPage(prev => prev + 1)} disabled={displayData.length < page * itemsPerPage || data.length <= page * itemsPerPage}>
                                            Next Page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {data && (
                    <>
                        <div style={{ paddingTop: '20px'}}>
                        <h2>Data Overview</h2>
                            <label htmlFor="columnSelect">Select Column:</label>
                            <select id="columnSelect" value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)}>
                                <option value="">-- Select a Column --</option>
                                {data[0] && Object.keys(data[0]).map((columnName) => (
                                    <option key={columnName} value={columnName}>{columnName}</option>
                                ))}
                            </select>
                        </div>
                        {summaryErrorMessage && (
                            <h2 className="error-message">{summaryErrorMessage}</h2>
                        )}
                        {summary && (
                            <>
                                {summary.type === 'numerical' ? (
                                    <div className="summary-grid">
                                        <SummaryCard title="Mean" value={summary.mean ?? 'N/A'} icon={<FaChartBar />} tooltip="The mean is the average of all numeric values." />
                                        <SummaryCard title="Median" value={summary.median ?? 'N/A'} icon={<FaChartLine />} tooltip="The median is the middle value." />
                                        <SummaryCard title="Mode" value={summary.mode ?? 'N/A'} icon={<FaChartPie />} tooltip="The mode is the most frequent value." />
                                        <SummaryCard title="Standard Deviation" value={summary.standardDeviation ?? 'N/A'} icon={<FaChartArea />} tooltip="Standard deviation measures the amount of variation or dispersion." />
                                        <SummaryCard title="Variance" value={summary.variance ?? 'N/A'} icon={<FaChartBar />} tooltip="Variance measures the spread of data around the mean." />
                                        <SummaryCard title="Range" value={summary.range ?? 'N/A'} icon={<FaChartLine />} tooltip="The range is the difference between the highest and lowest values." />
                                        <SummaryCard title="IQR" value={summary.iqr ?? 'N/A'} icon={<FaChartPie />} tooltip="The interquartile range is the range of the middle 50% of the data." />
                                        <SummaryCard title="Skewness" value={summary.skewness ?? 'N/A'} icon={<FaChartArea />} tooltip="Skewness measures the asymmetry of the data distribution." />
                                        <SummaryCard title="Kurtosis" value={summary.kurtosis ?? 'N/A'} icon={<FaChartBar />} tooltip="Kurtosis measures the 'tailedness' of the data distribution." />
                                        <SummaryCard title="Min" value={summary.min ?? 'N/A'} icon={<FaChartLine />} tooltip="The minimum value." />
                                        <SummaryCard title="Max" value={summary.max ?? 'N/A'} icon={<FaChartPie />} tooltip="The maximum value." />
                                    </div>
                                ) : (
                                    <div>
                                        <p>Unique Value Count: {summary.uniqueCount}</p>
                                        <p>Top Values:</p>
                                        <ul>
                                            {summary.topValues.map((item) => (
                                                <li key={item.value}>{item.value}: {item.count}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* PDF Export Button */}
                                <PDFDownloadLink
                                    document={<SummaryPDF summary={summary} />}
                                    fileName="data-summary.pdf"
                                >
                                    {({ loading }) => (loading ? 'Loading PDF...' : 'Download PDF')}
                                </PDFDownloadLink>
                            </>
                        )}
                    </>
                )}

                <div className="section-separator"></div>

                {data && (
                    <div className="pivot-table-container">
                        <h2>Interactive Pivot Table</h2>
                        <PivotTableUI
                            data={data}
                            onChange={handlePivotChange}
                            {...pivotState}
                            options={pivotOptions}

                        />
                    </div>
                )}

                {graphErrorMessage && (
                    <h2 className="error-message">{graphErrorMessage}</h2>
                )}
                {/* Bar Graph */}
                {graphData.bar && (
                    <div className="chart-container">
                        <h2>Bar Graph</h2>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '1em', marginBottom: '0.5em', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ whiteSpace: 'nowrap', margin: 0 }}>X-Axis:</label>
                            <select
                                style={{ minWidth: 'fit-content' }}
                                value={chartSelections.bar.xAxis}
                                onChange={(e) => handleChartAxisChange('bar', 'xAxis', e.target.value)}
                            >
                                <option value="">Select X Axis</option>
                                {data && Object.keys(data[0]).map((column, index) => (
                                    <option value={column} key={index}>{column}</option>
                                ))}
                            </select>
                        </div>
                        <Bar data={graphData.bar} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                )}
                {/* Line Graph */}
                {graphData.line && (
                    <div className="chart-container">
                        <h2>Line Graph</h2>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '1em', marginBottom: '0.5em', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ whiteSpace: 'nowrap', margin: 0 }}>X-Axis:</label>
                            <select
                                style={{ minWidth: 'fit-content' }}
                                value={chartSelections.line.xAxis}
                                onChange={(e) => handleChartAxisChange('line', 'xAxis', e.target.value)}
                            >
                                <option value="">Select X Axis</option>
                                {data && Object.keys(data[0]).map((column, index) => (
                                    <option value={column} key={index}>{column}</option>
                                ))}
                            </select>
                        </div>
                        <Line data={graphData.line} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                )}
                {/* Pie Chart */}
                {graphData.pie && (
                    <div className="chart-container">
                        <h2>Pie Chart</h2>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '1em', marginBottom: '0.5em', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ whiteSpace: 'nowrap', margin: 0 }}>Category:</label>
                            <select
                                style={{ minWidth: 'fit-content' }}
                                value={chartSelections.pie.xAxis}
                                onChange={(e) => handleChartAxisChange('pie', 'xAxis', e.target.value)}
                            >
                                <option value="">Select Category</option>
                                {data && Object.keys(data[0]).map((column, index) => (
                                    <option value={column} key={index}>{column}</option>
                                ))}
                            </select>
                        </div>
                        <Pie data={graphData.pie} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                )}
                {/* Scatter Plot */}
                {graphData.scatter && (
                    <div className="chart-container">
                        <h2>Scatter Plot</h2>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '1em', marginBottom: '0.5em', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ whiteSpace: 'nowrap', margin: 0 }}>X-Axis:</label>
                            <select
                                style={{ minWidth: 'fit-content' }}
                                value={chartSelections.scatter.xAxis}
                                onChange={(e) => handleChartAxisChange('scatter', 'xAxis', e.target.value)}
                            >
                                <option value="">Select X Axis</option>
                                {data && Object.keys(data[0]).map((column, index) => (
                                    <option value={column} key={index}>{column}</option>
                                ))}
                            </select>
                        </div>
                        <Scatter data={graphData.scatter} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                )}
                {/* Radar Chart */}
                {graphData.radar && (
                    <div className="chart-container">
                        <h2>Radar Chart</h2>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '1em', marginBottom: '0.5em', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ whiteSpace: 'nowrap', margin: 0 }}>X-Axis:</label>
                            <select
                                style={{ minWidth: 'fit-content' }}
                                value={chartSelections.radar.xAxis}
                                onChange={(e) => handleChartAxisChange('radar', 'xAxis', e.target.value)}
                            >
                                <option value="">Select X Axis</option>
                                {data && Object.keys(data[0]).map((column, index) => (
                                    <option value={column} key={index}>{column}</option>
                                ))}
                            </select>
                        </div>
                        <Radar data={graphData.radar} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                )}
            </div>
            <div>
                <footer className='footer'>
                    <FeedbackForm />
                </footer>
            </div>
        </div>
    );

};

export default Dashboard;