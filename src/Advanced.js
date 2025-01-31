import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as ss from 'simple-statistics';
import { Link } from 'react-router-dom';
import KNN from 'ml-knn';
import DataDisplay from './DataDisplay';
import ModelPredictionCard from './ModelPredictionCard';
import ChartComponent from './ChartComponent';
import FeedbackForm from './FeedbackForm';
import muncher from './muncher.jpeg';
import './App.css';
import { FaSyncAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const Advanced = () => {
    const [data, setData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [rawDataFromUpload, setRawDataFromUpload] = useState(null);
    const [meanPrediction, setMeanPrediction] = useState(null);
    const [meanAnalysis, setMeanAnalysis] = useState(null);
    const [modelPrediction, setModelPrediction] = useState(null);
    const [modelAnalysis, setModelAnalysis] = useState(null);
    const [manualPrediction, setManualPrediction] = useState(null);
    const [featureColumns, setFeatureColumns] = useState([]);
    const [knnModel, setKnnModel] = useState(null);
    const [knnPrediction, setKnnPrediction] = useState(null);
    const [knnAnalysis, setKnnAnalysis] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [displayData, setDisplayData] = useState([]);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [labelColumn, setLabelColumn] = useState(null);
    const chartRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [trimColumnNamesFlag, setTrimColumnNamesFlag] = useState(true);
    const [handleCommasAsDecimalFlag, setHandleCommasAsDecimalFlag] = useState(true);
    const [handleCategoricalDataFlag, setHandleCategoricalDataFlag] = useState(true);
    const [handleMissingValuesFlag, setHandleMissingValuesFlag] = useState(true);
    const [handleOutliersFlag, setHandleOutliersFlag] = useState(true);
    const [dataReloaded, setDataReloaded] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [statusMessages, setStatusMessages] = useState({
        fileUpload: { label: 'File Upload', completed: false },
        trimColumns: { label: 'Trim Column Names', completed: false, message: null },
        handleCommas: { label: 'Treat Commas as Decimal', completed: false, message: null },
        handleCategorical: { label: 'Handle Categorical Data', completed: false, message: null },
        handleMissing: { label: 'Handle Missing Values', completed: false, message: null },
        handleOutliers: { label: 'Handle Outliers', completed: false, message: null },
    });
    const [outlierThreshold, setOutlierThreshold] = useState(1.5);
    const [csvUploadTime, setCsvUploadTime] = useState(null);
    const [cleaningTimes, setCleaningTimes] = useState({
        trimColumns: null,
        handleCommas: null,
        handleCategorical: null,
        handleMissing: null,
        handleOutliers: null,
    });
    const [modelPredictionTimes, setModelPredictionTimes] = useState({
        mean: null,
        linearRegression: null,
        knn: null,
    });
    
    const [optionsOpen, setOptionsOpen] = useState(true);
    const toggleOptions = () => setOptionsOpen(!optionsOpen);

    useEffect(() => {
        setStatusMessages(prevState => ({
            ...prevState,
            fileUpload: { ...prevState.fileUpload, completed: originalData !== null },
            trimColumns: { ...prevState.trimColumns, completed: originalData ? trimColumnNamesFlag : false },
            handleCommas: { ...prevState.handleCommas, completed: originalData ? handleCommasAsDecimalFlag : false },
            handleCategorical: { ...prevState.handleCategorical, completed: originalData ? handleCategoricalDataFlag : false },
            handleMissing: { ...prevState.handleMissing, completed: originalData ? handleMissingValuesFlag : false },
            handleOutliers: { ...prevState.handleOutliers, completed: originalData ? handleOutliersFlag : false, },
        }));
    }, [originalData, trimColumnNamesFlag, handleCommasAsDecimalFlag, handleCategoricalDataFlag, handleMissingValuesFlag, handleOutliersFlag]);

    useEffect(() => {
        if (originalData) {
            setDataReloaded(false);
        }
    }, [trimColumnNamesFlag, handleCommasAsDecimalFlag, handleCategoricalDataFlag, handleMissingValuesFlag, handleOutliersFlag, originalData, outlierThreshold]);

    const trimColumnNames = (data) => {
        if (!trimColumnNamesFlag) return { data, message: null };
    
        if (!data || data.length === 0) {return { data, message: "No data to trim." };}
        try {
            const columns = Object.keys(data[0]);
            const trimmedColumns = columns.map(col => col.trim());
    
            const trimmedData = data.map(row => {
                const processedRow = {};
                trimmedColumns.forEach((col, index) => {
                    processedRow[col] = row[columns[index]];
                });
                return processedRow;
            });
            return { data: trimmedData, message: `Trimmed ${columns.length} column names.` };
        } catch (error) {return { data, message: `Error trimming column names: ${error}` };}
    };
    
    const parseValue = (value, treatCommasAsDecimal) => {
        if (!handleCommasAsDecimalFlag) return value;
    
        if (typeof value !== 'string') return value;
        const cleanedValue = treatCommasAsDecimal
            ? value.replace(/[^0-9.,-]/g, '').replace(',', '.')
            : value.replace(/[^0-9.-]/g, '');
    
    
        if (cleanedValue === "" || isNaN(cleanedValue)) return null;
        return parseFloat(cleanedValue);
    };
    
    
    const processRow = (row, treatCommasAsDecimal) => {
        const processedRow = {};
        for (const key in row) {
            if (row.hasOwnProperty(key) && key !== 'category') {
                const parsedValue = parseValue(row[key], treatCommasAsDecimal)
                processedRow[key] = parsedValue;
            }
        }
        return processedRow;
    };
    
    const handleCategoricalData = (data) => {
        if (!handleCategoricalDataFlag) return { data, message: null };
    
        if (!data || data.length === 0) {
            return { data, message: "No data to process." };
        }
        try {
            let categoricalCount = 0;
            const updatedData = data.map(row => {
            const newRow = {};
            for (const key in row) {
                if (typeof row[key] !== 'number' && typeof row[key] !== 'boolean' && row[key] !== null) {
                    newRow[key] = String(row[key]);
                    categoricalCount++
                } else {
                    newRow[key] = row[key];
                }
            }
            return newRow;
            });
    
            return { data: updatedData, message: `Handled ${categoricalCount} categorical values.` };
        } catch (error) {
            return { data, message: `Error handling categorical data: ${error}` };
        }
    };
    const handleMissingValues = (data) => {
        if (!handleMissingValuesFlag) return { data, message: null };
    
        if (!data || data.length === 0) {
            return { data, message: "No data to process." };
        }
    
        try {
            const columns = Object.keys(data[0]);
            let updatedData = [...data];
            let missingValueCount = 0;
    
            columns.forEach(col => {
                    const isNumericColumn = data.every(row => row[col] === null || row[col] === undefined || typeof row[col] === 'number');
                if (isNumericColumn) {
                    const validValues = data.filter(row => row[col] !== null && row[col] !== undefined).map(row => row[col]);
                    const meanValue = validValues.length > 0 ? ss.mean(validValues) : null;
    
                    updatedData = updatedData.map(row => {
                        if (row[col] === null || row[col] === undefined) {
                            missingValueCount++;
                            return { ...row, [col]: meanValue };
                        }
                        return row;
                    });
                } else {
                    const mostFrequent = data.reduce((acc, row) => {
                        if (row[col] != null && row[col] !== undefined) {
                            acc[row[col]] = (acc[row[col]] || 0) + 1;
                        }
                        return acc;
                    }, {});
                    const mostFrequentValue = Object.keys(mostFrequent).length > 0
                        ? Object.keys(mostFrequent).reduce((a, b) => mostFrequent[a] > mostFrequent[b] ? a : b)
                        : null;
                    updatedData = updatedData.map(row => {
                    if (row[col] === null || row[col] === undefined) {
                        missingValueCount++;
                        return { ...row, [col]: mostFrequentValue };
                    }
                    return row;
                    });
                }
            });
            return { data: updatedData, message: `Imputed ${missingValueCount} missing values.` };
        } catch (error) {
            return { data, message: `Error handling missing values: ${error}` };}
    };

    const handleOutliers = (data, featureColumns, threshold) => {
        if (!handleOutliersFlag) return { data, message: null };
    
        if (!data || data.length === 0 || !featureColumns || featureColumns.length === 0) {
            return { data, message: "No data or feature columns to process for outliers." };
        }
    
        try {
            let updatedData = [...data];
            let outlierCount = 0;
            
            for (const col of featureColumns) {
                const values = data.map(row => row[col]).filter(value => typeof value === 'number' && !isNaN(value));
                
                if (values.length > 5) {
                    const q1 = ss.quantile(values, 0.25);
                    const q3 = ss.quantile(values, 0.75);
                    const iqr = q3 - q1;
                    const lowerBound = q1 - threshold * iqr;
                    const upperBound = q3 + threshold * iqr;
                    updatedData = updatedData.map(row => {
                        if (typeof row[col] === 'number' && !isNaN(row[col])) {
                            if (row[col] < lowerBound || row[col] > upperBound) {
                                outlierCount++;
                                return { ...row, [col]: ss.median(values) };
                            }
                        }
                        return row;
                    });
                }
            }
             return { data: updatedData, message: `Handled ${outlierCount} outliers using the IQR method.` };
        } catch (error) {
            return { data, message: `Error handling outliers: ${error}` };
        }
    };
    
    const preprocessData = (data, treatCommasAsDecimal = false) => {
        if (!data || data.length === 0) return data;
    
        let processedData = [...data];
        let trimResult = trimColumnNames(processedData);
        processedData = trimResult.data;
        processedData = processedData.map(row => processRow(row, treatCommasAsDecimal));
        let categoricalResult = handleCategoricalData(processedData);
        processedData = categoricalResult.data
        let missingResult = handleMissingValues(processedData);
        processedData = missingResult.data;
    
        return processedData;
    };

    const applyDataTuning = async () => {
        setIsSpinning(true);
        setIsLoading(true);
        setLoadingMessage("Applying data cleaning and tuning...");
        setDataReloaded(false);
        setStatusMessages(prevState => ({
            ...prevState,
            trimColumns: { ...prevState.trimColumns, completed: false, message: null },
            handleCommas: { ...prevState.handleCommas, completed: false, message: null },
            handleCategorical: { ...prevState.handleCategorical, completed: false, message: null },
            handleMissing: { ...prevState.handleMissing, completed: false, message: null },
            handleOutliers: { ...prevState.handleOutliers, completed: false, message: null },
        }));

        let tunedData = [...rawDataFromUpload];
        let startTime;
        let endTime;
        startTime = performance.now();
        let trimResult = trimColumnNames(tunedData);
        tunedData = trimResult.data;
        endTime = performance.now();
        setCleaningTimes(prev => ({ ...prev, trimColumns: (endTime - startTime) / 1000 }));
        startTime = performance.now();
        let commasData = null;
        if (handleCommasAsDecimalFlag) {
            commasData = tunedData.map(row => processRow(row, handleCommasAsDecimalFlag));
        } else {
            commasData = tunedData;
        }
        endTime = performance.now();
        setCleaningTimes(prev => ({ ...prev, handleCommas: (endTime - startTime) / 1000 }));

        startTime = performance.now();
        let categoricalResult = handleCategoricalData(commasData);
        tunedData = categoricalResult.data
        endTime = performance.now();
        setCleaningTimes(prev => ({ ...prev, handleCategorical: (endTime - startTime) / 1000 }));
        startTime = performance.now();
        let missingResult = handleMissingValues(tunedData);
        tunedData = missingResult.data
        endTime = performance.now();
        setCleaningTimes(prev => ({ ...prev, handleMissing: (endTime - startTime) / 1000 }));
        const { featureColumns: calculatedFeatureColumns, labelColumn } = selectColumns(tunedData);
        setFeatureColumns(calculatedFeatureColumns);
        setLabelColumn(labelColumn);
        startTime = performance.now();
        let outliersResult = handleOutliers(tunedData, calculatedFeatureColumns, outlierThreshold);
        tunedData = outliersResult.data;
        endTime = performance.now();
        setCleaningTimes(prev => ({ ...prev, handleOutliers: (endTime - startTime) / 1000 }));

        const validationIssues = validateData(tunedData, calculatedFeatureColumns, labelColumn);

        if (validationIssues.length > 0) {
            console.error("Validation Issues:", validationIssues);
            alert("Validation Errors:\n" + validationIssues.join("\n"));
            setIsLoading(false);
            setTimeout(() => setIsSpinning(false), 300);
            setLoadingMessage('');
        } else {
            console.log("Features:", calculatedFeatureColumns);
            console.log("Label:", labelColumn);
            console.log("Cleaned and Tuned Data:", tunedData);
            setData(tunedData);
            setDisplayData(tunedData.slice(0, itemsPerPage));
            let meanStartTime = performance.now()
            createMeanPrediction(tunedData.slice(0, itemsPerPage));
            let meanEndTime = performance.now()
            let linearStartTime = performance.now();
            createLinearRegression(tunedData.slice(0, itemsPerPage), calculatedFeatureColumns, labelColumn);
            let linearEndTime = performance.now();
            let knnStartTime = performance.now();
            createKNNModel(tunedData.slice(0, itemsPerPage), calculatedFeatureColumns, labelColumn);
            let knnEndTime = performance.now()

            setModelPredictionTimes(prev => ({
                ...prev,
                mean: (meanEndTime - meanStartTime) / 1000,
                linearRegression: (linearEndTime - linearStartTime) / 1000,
                knn: (knnEndTime - knnStartTime) / 1000
            }));

            setShowPopup(false);
            setIsLoading(false);
            setTimeout(() => setIsSpinning(false), 300);
            setLoadingMessage('');
            setDataReloaded(true);
            setStatusMessages(prevState => ({
                ...prevState,
                trimColumns: { ...prevState.trimColumns, completed: trimColumnNamesFlag, message: trimResult.message },
                handleCommas: { ...prevState.handleCommas, completed: handleCommasAsDecimalFlag, message: handleCommasAsDecimalFlag ? 'Commas treated as decimals.' : null },
                handleCategorical: { ...prevState.handleCategorical, completed: handleCategoricalDataFlag, message: categoricalResult.message },
                handleMissing: { ...prevState.handleMissing, completed: handleMissingValuesFlag, message: missingResult.message },
                handleOutliers: { ...prevState.handleOutliers, completed: handleOutliersFlag, message: outliersResult.message },
            }));
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];

        if (file && file.name.endsWith('.csv')) {
            setIsLoading(true);
            setLoadingMessage("Loading and processing data...");

            const startTime = performance.now();
            Papa.parse(file, {
                complete: (result) => {
                    const endTime = performance.now();
                    setCsvUploadTime((endTime - startTime) / 1000)
                    const rawData = result.data;
                    setRawDataFromUpload(rawData);
        
                    let detectedDelimiter = ','; 
                    if (rawData.length > 1 && typeof rawData[0] === 'object') {
                        const firstRow = Object.values(rawData[0]).join(''); 
                        if (firstRow.includes(';')) {
                            detectedDelimiter = ';'; 
                        }
                    }
                    console.log("Detected Delimiter:", detectedDelimiter);
        
                    const transformedData = rawData.map(row => {
                        const newRow = {};
                        for (const key in row) {
                            if (row.hasOwnProperty(key)) {
                                if (typeof row[key] === 'string' && /^[0-9,.]+$/.test(row[key])) {
                                    let cleanedValue = row[key];
                                    const commaReplaced = row[key].replace(',', '.');
                                    const commaNum = parseFloat(commaReplaced);
                                    const periodReplaced = row[key].replace('.', ',');
                                    const periodNum = parseFloat(periodReplaced);
        
                                    if(!isNaN(commaNum)) {
                                        cleanedValue = commaReplaced;
                                        newRow[key] = commaNum;
                                    } else if (!isNaN(periodNum)) {
                                        cleanedValue = periodReplaced;
                                        newRow[key] = periodNum;
                                    } else {
                                        newRow[key] = row[key];
                                    }
        
                                } else {
                                    newRow[key] = row[key]; 
                                }
                            }
                        }
                        return newRow;
                    });
        
                    setOriginalData(transformedData);
        
                    const {data: cleanedData, messages} = preprocessDataWithMessages(transformedData, true);
        
                    const { featureColumns, labelColumn } = selectColumns(cleanedData);
                    setFeatureColumns(featureColumns);
                    setLabelColumn(labelColumn);
                    const validationIssues = validateData(cleanedData, featureColumns, labelColumn);
        
                    if (validationIssues.length > 0) {
                        console.error("Validation Issues:", validationIssues);
                        alert("Validation Errors:\n" + validationIssues.join("\n"));
                        setIsLoading(false);
                        setLoadingMessage('');
                    } else {
                        console.log("Features:", featureColumns);
                        console.log("Label:", labelColumn);
                        console.log("Cleaned and Validated Data:", cleanedData);
                        setData(cleanedData);
                        setDisplayData(cleanedData.slice(0, itemsPerPage));
                        let meanStartTime = performance.now()
                        createMeanPrediction(cleanedData.slice(0, itemsPerPage));
                        let meanEndTime = performance.now()
                        let linearStartTime = performance.now();
                        createLinearRegression(cleanedData.slice(0, itemsPerPage), featureColumns, labelColumn);
                        let linearEndTime = performance.now();
                        let knnStartTime = performance.now();
                        createKNNModel(cleanedData.slice(0, itemsPerPage), featureColumns, labelColumn);
                        let knnEndTime = performance.now()
                        setModelPredictionTimes(prev => ({
                            ...prev,
                            mean: (meanEndTime - meanStartTime) / 1000,
                            linearRegression: (linearEndTime - linearStartTime) / 1000,
                            knn: (knnEndTime - knnStartTime) / 1000
                        }));
        
                        setShowPopup(false);
                        setIsLoading(false);
                        setLoadingMessage('');
                        setDataReloaded(false);
                        setStatusMessages(prevState => ({
                            ...prevState,
                            fileUpload: { ...prevState.fileUpload, completed: true },
                            trimColumns: { ...prevState.trimColumns, completed: trimColumnNamesFlag, message: messages.trimMessage },
                            handleCommas: { ...prevState.handleCommas, completed: handleCommasAsDecimalFlag, message: handleCommasAsDecimalFlag ? 'Commas treated as decimals.' : null },
                            handleCategorical: { ...prevState.handleCategorical, completed: handleCategoricalDataFlag, message: messages.categoricalMessage },
                            handleMissing: { ...prevState.handleMissing, completed: handleMissingValuesFlag, message: messages.missingMessage },
                            handleOutliers: { ...prevState.handleOutliers, completed: handleOutliersFlag, message: messages.outlierMessage },
                        }));
                    }
                },
                header: true,
                skipEmptyLines: true,
            });
        } else {
            alert("Please upload a valid CSV file.");
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const preprocessDataWithMessages = (data, treatCommasAsDecimal = false) => {
        if (!data || data.length === 0) return {data, messages: {}};
    
        let processedData = [...data];
    
        let trimResult = trimColumnNames(processedData);
        processedData = trimResult.data;
        processedData = processedData.map(row => processRow(row, treatCommasAsDecimal));
        let categoricalResult = handleCategoricalData(processedData);
        processedData = categoricalResult.data
        let missingResult = handleMissingValues(processedData);
        processedData = missingResult.data;
    
        let outlierResult = {data: processedData, message: null};
        if (handleOutliersFlag) {
            const { featureColumns } = selectColumns(processedData);
            outlierResult = handleOutliers(processedData, featureColumns, outlierThreshold);
            processedData = outlierResult.data;
        }
        console.log("Data after preprocessDataWithMessages:", processedData) 
    
        return {
          data: processedData,
          messages: {
            trimMessage: trimResult.message,
            categoricalMessage: categoricalResult.message,
            missingMessage: missingResult.message,
            outlierMessage: outlierResult.message,
            }
        };
    };

    const loadMoreData = () => {
        const nextPage = page + 1;
        const newData = data.slice(0, nextPage * itemsPerPage);
        setDisplayData(newData);
        setPage(nextPage);
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

    useEffect(() => {
        if (displayData.length > 0 && labelColumn) {
            createMeanPrediction(displayData);
            createLinearRegression(displayData, featureColumns, labelColumn);
            createKNNModel(displayData, featureColumns, labelColumn);
        }
    }, [displayData, labelColumn, featureColumns]);
    
    
    const detectColumns = (data) => {
        const columns = Object.keys(data[0] || {});
        const numericColumns = columns.filter(column =>
            data.every(row => {
                const value = row[column];
                return (value !== null && value !== "" && !isNaN(value));
            })
        );
        const nonNumericColumns = columns.filter(column => !numericColumns.includes(column));
    
        console.log("Numeric Columns:", numericColumns);
        console.log("Non-Numeric Columns:", nonNumericColumns);
        return { numericColumns, nonNumericColumns };
    };
    
   const validateData = (data, featureColumns, labelColumn) => {
        const issues = [];
        if (!data || data.length === 0) {
            issues.push("Dataset is empty.");
            return issues;
        }
    
        if (!labelColumn) {
            issues.push("No label column detected. Ensure that your dataset contains at least 2 numeric columns.");
            return issues;
        }
    
        featureColumns.forEach(col => {
            if (!data.every(row => typeof row[col] === 'number' && !isNaN(row[col]))) {
                issues.push(`Feature column "${col}" contains non-numeric or NaN values. Ensure the column only has numbers.`);
            }
        });
    
        if (!data.every(row => typeof row[labelColumn] === 'number' && !isNaN(row[labelColumn]))) {issues.push(`Label column "${labelColumn}" contains non-numeric or NaN values. Ensure the column only has numbers.`);}
    
        const missingInFeatures = featureColumns.some(col => data.some(row => row[col] === null));
        if (missingInFeatures) {issues.push("Missing values found in feature columns. Please make sure that your data doesn't have empty spaces.");}
    
        const missingInLabel = data.some(row => row[labelColumn] === null);
        if (missingInLabel) {issues.push("Missing values found in label column. Please make sure that your data doesn't have empty spaces.");}
        return issues;
    };
    
    const selectColumns = (data) => {
        const { numericColumns, nonNumericColumns } = detectColumns(data);
        console.log("Numeric Columns:", numericColumns);
        console.log("Non-Numeric Columns:", nonNumericColumns);
        console.log("Data inside Select Columns:", data);
    
        if (numericColumns.length < 2) {
            console.error("Not enough numeric columns to select a feature and label.");
            return { featureColumns: [], labelColumn: null };
        }
    
        const featureColumns = numericColumns.slice(0, -1);
        const labelColumn = numericColumns.slice(-1)[0];
        const validFeatureColumns = featureColumns.filter(col => data.every(row => !isNaN(row[col]) && row[col] !== null && row[col] !== ""));
        const isLabelColumnNumeric = data.every(row => !isNaN(row[labelColumn]) && row[labelColumn] !== null && row[labelColumn] !== "");
    
        if (validFeatureColumns.length === 0 || !isLabelColumnNumeric) {
            console.error("All feature columns must be numeric, and label column must also be numeric.");
            return { featureColumns: [], labelColumn: null };
        }
    
        return { featureColumns: validFeatureColumns, labelColumn };
    };

    const manualPredict = (x) => {
        if (!modelPrediction) {
            console.error("Model coefficients not available.");
            return null;
        }
        const { m, b } = modelPrediction;
        const y = parseFloat(m) * parseFloat(x) + parseFloat(b);
    
        if (Math.abs(m) < 0.01) {
            console.log(`Warning: The slope is nearly zero (${m.toFixed(2)}), which means the prediction won't vary much based on x.`);
        }
    
        console.log(`For x = ${x}, the predicted y is ${y}`);
        setManualPrediction({ x, y });
        return y;
    };

    const createKNNModel = (data, featureColumns, labelColumn) => {
        if (!featureColumns || featureColumns.length === 0 || !labelColumn) {
            console.error("Invalid feature or label columns for KNN.");
            return;
        }
    
        try {
            const features = data.map(row => featureColumns.map(col => parseFloat(row[col])));
            const labels = data.map(row => parseFloat(row[labelColumn]));
    
            const knn = new KNN(features, labels, { k: 3 });
            setKnnModel(knn);
    
            const initialFeature = features[0];
            const initialPrediction = knn.predict([initialFeature]);
    
            setKnnPrediction(initialPrediction[0]);
    
            const knnAnalysisText = `KNN model created with k=3. The model uses ${featureColumns.length} features to predict the label.`;
            setKnnAnalysis(knnAnalysisText);
    
            console.log("KNN Model:", knn);
            console.log("Initial KNN Prediction:", initialPrediction[0]);
        } catch (error) {
            console.error("Error creating KNN model:", error);
            setKnnModel(null);
            setKnnAnalysis(`KNN model not created, error: ${error}`)
        }
    };
    
    const createMeanPrediction = (data) => {
        try {
            const cleanedData = preprocessData(data);
    
            if (cleanedData.length === 0) {
                console.error('No valid data available after cleaning.');
                alert('No valid data available after cleaning. Please check the CSV for missing or invalid values.');
                return;
            }
    
            const labelName = Object.keys(cleanedData[0]).pop();
            const labels = cleanedData.map(row => parseFloat(row[labelName]));
            console.log('Labels:', labels);
            const meanLabel = ss.mean(labels);
    
            setMeanPrediction(meanLabel);
    
            const meanAnalysisText = `The predicted value is based on the average of all labels, which is ${meanLabel.toFixed(2)}. This provides a baseline for understanding the central tendency of your data.`;
            setMeanAnalysis(meanAnalysisText);
    
            console.log('Mean-Based Prediction:', meanLabel);
        } catch (error) {
            console.error('Error generating mean-based prediction:', error);
            setMeanPrediction(null);
            setMeanAnalysis(`Mean-based prediction failed: ${error}`);
             return
        }
    };
    
    const createLinearRegression = (data, featureColumns, labelColumn) => {
        if (!featureColumns || featureColumns.length === 0 || !labelColumn) {
            console.error("Invalid feature or label columns for linear regression.");
            setModelPrediction(null);
            setModelAnalysis(`Linear regression failed to create: Invalid feature or label columns.`);
             return;
        }
    
        try {
            console.log("Data in Regression Function: ", data)
            console.log("Features Columns: ", featureColumns)
            console.log("Label Column: ", labelColumn)
            
            const features = data.map(row => featureColumns.map(col => parseFloat(row[col])));
            const labels = data.map(row => parseFloat(row[labelColumn]));

            console.log("Data Length:", data.length)
            console.log("Features: ", features)
            console.log("Features Length: ", features.length)
            console.log("Labels: ", labels)
            console.log("Labels Length: ", labels.length)
    
            if (features.some(row => row.some(val => isNaN(val))) || labels.some(val => isNaN(val))) {
                console.error("Data contains NaN values, unable to create model.")
                setModelPrediction(null);
                setModelAnalysis(`Linear regression failed to create: Data contains NaN values`);
                return
            }
            
             if (features.length < 2 || labels.length < 2) {
                console.error("Not enough data points to perform linear regression.");
                setModelPrediction(null);
                setModelAnalysis("Not enough data points to perform linear regression.");
                return;
            }

            let validFeatures = [];

            for(let col of featureColumns) {
                const featureValues = data.map(row => parseFloat(row[col]));
                const featureVariance = ss.sampleVariance(featureValues);

                 if (featureVariance > 0) {
                     validFeatures.push(col);
                } else {
                    console.log(`Skipping feature column ${col} as it has zero variance.`)
                }
            }
            
            if (validFeatures.length === 0) {
                console.error("No feature columns with non-zero variance found, cannot create model.")
                setModelPrediction(null);
                setModelAnalysis("No feature columns with non-zero variance found, cannot create model.");
                return;
            }

            console.log("Valid Features:", validFeatures);

            const validFeatureValues = data.map(row => validFeatures.map(col => parseFloat(row[col])));
            console.log("Feature type:", typeof validFeatureValues[0][0]);
            const regression = ss.linearRegression(validFeatureValues.map((f, i) => [f[0], labels[i]]));
            const { m, b } = regression;
            const correlation = ss.sampleCorrelation(validFeatureValues.map(f => f[0]), labels);

            console.log("Regression Model:", { m, b });
    
            setModelPrediction({ m, b });
    
            let slopeInterpretation = "";
            if (Math.abs(m) < 0.01) {
                slopeInterpretation = "Very weak or no linear relationship between feature and label.";
            } else if (m > 0) {
                slopeInterpretation = "Positive correlation between feature and label.";
            } else {
                slopeInterpretation = "Negative correlation between feature and label.";
            }
    
            let interceptInterpretation = `Intercept (b) is ${b.toFixed(2)}, indicating the label value when feature is 0.`;
            if (b > 0) {
                interceptInterpretation += " This suggests a positive baseline label value.";
            } else if (b < 0) {
                interceptInterpretation += " This suggests a negative baseline label value.";
            }
    
            let correlationInterpretation = "";
            if (Math.abs(correlation) < 0.1) {
                correlationInterpretation = "Very weak correlation, indicating a poor linear relationship.";
            } else if (Math.abs(correlation) < 0.5) {
                correlationInterpretation = "Moderate correlation, suggesting a reasonable linear relationship.";
            } else {
                correlationInterpretation = "Strong correlation, indicating a strong linear relationship.";
            }
    
            const exampleFeatureValue = 10; 
            const predictedLabelForExample = (m * exampleFeatureValue + b).toFixed(2);
            const predictionExampleMessage = `For a feature value of ${exampleFeatureValue}, the predicted label is ${predictedLabelForExample}.`;
    
            let confidenceInterpretation = "";
            if (Math.abs(correlation) > 0.7) {
                confidenceInterpretation = "High confidence in the model's predictions.";
            } else if (Math.abs(correlation) > 0.4) {
                confidenceInterpretation = "Moderate confidence in the model's predictions.";
            } else {
                confidenceInterpretation = "Low confidence in the model's predictions.";
            }
    
            const analysisText = `
                <strong>Regression Equation:</strong>
                y = ${m.toFixed(2)}x + ${b.toFixed(2)}
    
            <strong>Slope Interpretation:</strong>
                - ${slopeInterpretation}
    
            <strong>Intercept Interpretation:</strong>
                - ${interceptInterpretation}
    
                <strong>Correlation Interpretation:</strong>
                - ${correlationInterpretation}
    
            <strong>Predicted Label (for feature value = 10):</strong>
                - ${predictionExampleMessage}
    
            <strong>Model Confidence:</strong>
            - ${confidenceInterpretation}
        `;
            const formattedAnalysis = analysisText.replace(/\n/g, "<br />");
            setModelAnalysis(formattedAnalysis);
    
        } catch (error) {
            console.error("Error generating linear regression:", error);
            setModelPrediction(null);
            setModelAnalysis(`Linear regression failed to create: ${error}`);
        }
    };
        
    const renderKNNPredictionCard = () => {
        if (!knnModel || !featureColumns || featureColumns.length === 0) return null;

        if (featureColumns.length === 1) {
            return (
                <ModelPredictionCard
                    title="Prediction Based on Similarity"
                    analysis={(
                        <>
                            <p className="analysis-text">{knnAnalysis}</p>
                            <p className="analysis-text">
                                This model looks at the closest data points to your input to make a prediction. It finds the 3 most similar neighbors to your input and bases the prediction on their label.
                            </p>
                            <p className="analysis-text">
                                <strong>Interpreting the result:</strong>  If the predicted value is close to one of the data points you uploaded, it means the input is similar to that data point based on the features you provided. If the prediction seems unexpected, it may indicate that the input lies outside the range of your training data.
                            </p>
                            <p className="analysis-text">
                                <strong>Important Note:</strong> These types of predictions are dependent on the number of neighbors it looks at, and the scale of your features.
                            </p>
                        </>
                    )}>
                                <div className="manual-prediction">
                        <label htmlFor="knn-x">Enter a value for prediction:</label>
                        <input
                            id="knn-x"
                            type="number"
                            placeholder="E.g., 50, 100, 150"
                            onChange={(e) => {
                                const x = parseFloat(e.target.value);
                                const prediction = knnModel.predict([[x]]);
                                setKnnPrediction(prediction[0]);
                            }}
                        />
                    </div>
                    {knnPrediction && (
                        <div className="manual-prediction-result">
                            <strong>Predicted Value:</strong> {knnPrediction}
                        </div>
                    )}
                    {/* Display KNN classification regions */}
                    {featureColumns && featureColumns.length > 1 && (
                        <div className="knn-classification-regions">
                            <ChartComponent
                                type="scatter"
                                data={{
                                    datasets: [
                                        {
                                            label: 'Data Points',
                                            data: displayData.map(row => ({
                                                x: row[featureColumns[0]],
                                                y: row[featureColumns[1]],
                                                label: row
                                                [labelColumn]
                                            })),
                                            backgroundColor: displayData.map(row => row[labelColumn] === 0 ? 'red' : 'blue')
                                        }
                                    ]
                                }}
                                options={{
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Feature 1'
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Feature 2'
                                            }
                                        }
                                    },
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Data Points and Neighbor Boundaries'
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </ModelPredictionCard>
            );
        } else {
            return (
                    <ModelPredictionCard
                        title="Prediction Based on Similarity"
                        analysis={(
                            <>
                                <p className="analysis-text">{knnAnalysis}</p>
                                <p className="analysis-text">
                                    This model looks at the closest data points to your input to make a prediction. It finds the 3 most similar neighbors to your input and bases the prediction on their label.
                                </p>
                                <p className="analysis-text">
                                    <strong>Interpreting the result:</strong>  If the predicted value is close to one of the data points you uploaded, it means the input is similar to that data point based on the features you provided. If the prediction seems unexpected, it may indicate that the input lies outside the range of your training data.
                                </p>
                                <p className="analysis-text">
                                    <strong>Important Note:</strong> These types of predictions are dependent on the number of neighbors it looks at, and the scale of your features.
                                </p>
                            </>
                        )}>
                        <div className="manual-prediction">
                            {/* <label>Enter feature values:</label> */}
                            {/* {featureColumns.map((feature, index) => (
                                <div key={index}>
                                    <label htmlFor={`knn-feature-${index}`}>{feature}:</label>
                                    <input
                                        id={`knn-feature-${index}`}
                                        type="number"
                                        placeholder={`E.g., ${index * 50 + 50}`}
                                        onChange={(e) => {
                                                const values = featureColumns.map((col, colIndex) => {
                                                    if (colIndex === index){
                                                        return parseFloat(e.target.value);
                                                    } else {
                                                        const inputElement = document.getElementById(`knn-feature-${colIndex}`);
                                                        return inputElement ? parseFloat(inputElement.value) : 0;
                                                    }
                                                })
                                                const prediction = knnModel.predict([values]);
                                                setKnnPrediction(prediction[0]);
                                        }}

                                    />
                                </div>
                            ))} */}
                        </div>
                        {knnPrediction && (
                            <div className="manual-prediction-result">
                                <strong>Predicted Value:</strong> {knnPrediction}
                            </div>
                        )}
                        {/* Display KNN classification regions */}
                        {featureColumns && featureColumns.length > 1 && (
                            <div className="knn-classification-regions">
                                <ChartComponent
                                    type="scatter"
                                    data={{
                                        datasets: [
                                            {
                                                label: 'Data Points',
                                                data: displayData.map(row => ({
                                                    x: row[featureColumns[0]],
                                                    y: row[featureColumns[1]],
                                                    label: row
                                                    [labelColumn]
                                                })),
                                                backgroundColor: displayData.map(row => row[labelColumn] === 0 ? 'red' : 'blue')
                                            }
                                        ]
                                    }}
                                    options={{
                                        scales: {
                                            x: {
                                                title: {
                                                    display: true,
                                                    text: 'Feature 1'
                                                }
                                            },
                                            y: {
                                                title: {
                                                    display: true,
                                                    text: 'Feature 2'
                                                }
                                            }
                                        },
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Data Points and Neighbor Boundaries'
                                            }
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </ModelPredictionCard>
                );
        }
    };

    const renderCorrelationCard = () => {
        // if (!meanPrediction || !modelPrediction || !knnModel || !featureColumns.length) return null;
        return (
            <ModelPredictionCard title="Model Correlation and Insights" analysis={
                <>
                    <p className="analysis-text">
                        <strong>Mean-Based Prediction:</strong>
                        This model calculates the average value of the target variable. It's a simple benchmark that represents the central tendency of the data.
                        If other models deviate significantly from the mean, it suggests they are capturing patterns beyond a simple average.
                    </p>
                    <p className="analysis-text">
                        <strong>Linear Regression Prediction:</strong>
                        The regression model attempts to capture linear relationships between the input features and the target variable.
                        A close match between the regression and mean predictions may indicate a weak or non-existent linear trend, while significant differences suggest a strong linear relationship.
                    </p>
                    <p className="analysis-text">
                        <strong>KNN Prediction:</strong>
                        The K-Nearest Neighbors (KNN) model bases its predictions on the similarity between data points. This approach is especially useful for capturing non-linear patterns that regression may miss.
                        If KNN predictions closely align with the mean or regression, it may indicate that the underlying relationships in the data are either simple or linear.
                    </p>
                    <p className="analysis-text">
                        <strong>Insights and Correlations:</strong>
                        Observing the relationships between predictions can reveal useful information:
                    </p>
                    <ul>
                        <li>If all three predictions are similar, the data may lack complex patterns, and simpler models might suffice.</li>
                        <li>Disparities between regression and KNN predictions might indicate non-linear relationships in the data.</li>
                        <li>A significant difference between mean-based and other models suggests that the data has predictive patterns beyond randomness or central tendency.</li>
                    </ul>
                    <div className="additional-insights">
                    </div>
                </>
            } />
        );
    };

    const renderMeanPredictionCard = () => {
        if (meanPrediction === null) return null;
        return (
            <ModelPredictionCard
                title="Average Prediction (Mean-based)"
                analysis={(
                    <p className="analysis-text">
                        This prediction is based on the average value of all your data. It's a simple way to get a sense of the typical value in your data set. This gives you a baseline to compare the other models against.
                    </p>
                )}
            >
                <div className="prediction-result">
                    <strong>Predicted Value:</strong> {meanPrediction.toFixed(2)}
                </div>
            </ModelPredictionCard>
        );
    };

            
    const renderLinearRegressionCard = () => {
        if (!modelPrediction) return null;
        const { m, b } = modelPrediction;
        const analysisText = `
        <p>
            This model tries to find a line that best represents the relationship between the feature you uploaded and the corresponding label you uploaded.
        </p>
        <p>
            <strong>Line Equation:</strong>  If you plot your feature values and their labels on a graph, this line is represented by:
            y = ${m.toFixed(2)}x + ${b.toFixed(2)}
        </p>
        <p>
            <strong>How to understand this:</strong>
            The slope of the line(${m.toFixed(2)}) tells you if the relationship between the feature and label are positive or negative.
            If the number is very small, the relationship is not very strong. The intercept of the line (${b.toFixed(2)}) tells you what the label value would be if the feature was zero.
        </p>
    `;
        return (
            <ModelPredictionCard
                title="Relationship Prediction (Linear Regression)"
                analysis={<div className="analysis-text"
                    dangerouslySetInnerHTML={{ __html: analysisText }} />}
        >
            <div className="prediction-result">
                <strong>Slope:</strong> {m.toFixed(2)} (Indicates how much the predicted value changes with a change in your feature value)
            </div>
            <div className="prediction-result">
                <strong>Intercept:</strong> {b.toFixed(2)} (The predicted label if your feature was zero)
            </div>
            {/* Display scatter plot with regression line */}
            {featureColumns && featureColumns.length > 0 && (
                <div className="scatter-plot">
                    <ChartComponent
                        type="scatter"
                        data={{
                            datasets: [
                                {
                                    label: 'Data Points',
                                    data: displayData.map(row => ({
                                        x: row[featureColumns[0]],
                                        y: row[labelColumn]
                                    })),
                                    backgroundColor: 'blue'
                                },
                                {
                                    label: 'Relationship Line',
                                    data: displayData.map(row => ({
                                        x: row[featureColumns[0]],
                                        y: modelPrediction.m * row[featureColumns[0]] + modelPrediction.b
                                    })),
                                    type: 'line',
                                    borderColor: 'red',
                                    fill: false
                                }
                            ]
                        }}
                        options={{
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Your Feature'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Your Label'
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Data Points and Relationship Line'
                                }
                            }
                        }}
                    />
                </div>
            )}
    
            {/* Instructions for manual prediction */}
            <div className="manual-prediction-instructions">
                <p>
                    <strong>Instructions:</strong> Enter a feature value to see the predicted label based on the relationship model. This is usually a value within the range of your uploaded dataset.
                </p>
            </div>
            {/* Input for manual prediction */}
            <div className="manual-prediction">
                <label htmlFor="manual-x">Enter a value for your feature:</label>
                <input
                    id="manual-x"
                    type="number"
                    placeholder="E.g., 50, 100, 150"
                    onChange={(e) => manualPredict(parseFloat(e.target.value))}
                />
            </div>
            {/* Display manual prediction */}
            {manualPrediction && (
                <div className="manual-prediction-result">
                    <strong>Predicted Value:</strong> {manualPrediction.y.toFixed(2)}
                </div>
            )}
        </ModelPredictionCard>
    );
};

const formatTime = (time) => {
    if (time === null) return 'N/A';
        if (time < 0.00001) {
        return time.toExponential(2) + ' seconds';
    } else if(time < 0.01) {
        return time.toFixed(6) + ' seconds';
    } else {
        return time.toFixed(2) + ' seconds';
    }
};
    
return (
    <div className="advanced-page">
        <header className="App-header">
            <Link to="/">
                <img src={muncher} className="App-logo" alt="logo" />
            </Link>
            <h1 style={{ fontSize: 'clamp(0.2rem, 4vw, 3rem)' }}>Advanced ML Models</h1>
        </header>
        <div className='import-controls'>

            <div className="import-box">
                <h2>Import CSV Data Only</h2>
                <p style={{fontSize: '0.8em'}}>Important Note: Certain models may not be capable of making predictions with all types of data, which may result in a null prediction for some data.</p>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="file-input" />
                {isLoading && <p>{loadingMessage}</p>}
            </div>

            <div className={`toggle-options-container ${optionsOpen ? '' : 'collapsed'}`}>
                <div className="toggle-button" onClick={toggleOptions}>
                    {optionsOpen ? <FaArrowRight /> : <FaArrowLeft />}
                    </div>
                <p style={{fontSize: '1em'}}>Cleaning Options</p>
                <div className="toggle-option">
                    <input type="checkbox" id="trimColumns" checked={trimColumnNamesFlag} onChange={() => setTrimColumnNamesFlag(!trimColumnNamesFlag)} />
                    <label htmlFor="trimColumns">Trim Column Names</label>
                </div>
                <div className="toggle-option">
                    <input type="checkbox" id="handleCommas" checked={handleCommasAsDecimalFlag} onChange={() => setHandleCommasAsDecimalFlag(!handleCommasAsDecimalFlag)} />
                    <label htmlFor="handleCommas">Treat Commas as Decimal</label>
                </div>
                <div className="toggle-option">
                    <input type="checkbox" id="handleCategorical" checked={handleCategoricalDataFlag} onChange={() => setHandleCategoricalDataFlag(!handleCategoricalDataFlag)} />
                    <label htmlFor="handleCategorical">Handle Categorical Data</label>
                </div>
                <div className="toggle-option">
                    <input type="checkbox" id="handleMissing" checked={handleMissingValuesFlag} onChange={() => setHandleMissingValuesFlag(!handleMissingValuesFlag)} />
                    <label htmlFor="handleMissing">Handle Missing Values</label>
                </div>
                <div className="toggle-option">
                    <input type="checkbox" id="handleOutliers" checked={handleOutliersFlag} onChange={() => setHandleOutliersFlag(!handleOutliersFlag)} />
                    <label htmlFor="handleOutliers">Handle Outliers</label>
                </div>
                <div className="toggle-option">
                        <label htmlFor="outlierThreshold">Outlier Sensitivity:</label>
                        <input
                            type="number"
                            id="outlierThreshold"
                            value={outlierThreshold}
                            onChange={(e) => setOutlierThreshold(parseFloat(e.target.value))}
                        />
                    </div>
                <button onClick={applyDataTuning} className="refresh-button" style={isSpinning ? { transform: 'rotate(360deg)' } : {}} disabled={dataReloaded}>
                    <FaSyncAlt color="#007bff" size="1em" />
                </button>
            </div>
        </div>
        <div className="status-message-container">
            <ul style={{ listStyleType: "none", padding: "0px" }}>
                <h2 className="status-message-header">Data Status</h2>
                {Object.values(statusMessages).map((message, index) => (
                    <li
                        key={index}
                        className="status-message"
                        style={{ display: message.completed ? 'block' : 'none' }}
                    >
                        ✅ {message.label} Cleaning Complete!
                        {message.message && <p className='status-message-detail'>{message.message}</p>}
                    </li>
                ))}
                <div className="performance-stats-container">
                    <h2 className="status-message-header">Performance Stats</h2>
                    {csvUploadTime !== null && (
                        <li className="status-message">
                            <strong>File Upload Time: </strong> {formatTime(csvUploadTime)}
                        </li>
                    )}
                    {Object.entries(cleaningTimes).map(([key, time]) => {
                        return time !== null && (
                            <li key={key} className="status-message">
                                <strong>{statusMessages[key]?.label || key}: </strong> {formatTime(time)}
                            </li>
                        );
                    })}
                    {Object.entries(modelPredictionTimes).map(([key, time]) => {
                        return time !== null && (
                            <li key={key} className="status-message">
                                <strong>{key} Model Prediction Time: </strong> {formatTime(time)}
                            </li>
                        );
                    })}
                </div>
            </ul>
        </div>
        <DataDisplay data={data} showPopup={showPopup} setShowPopup={setShowPopup} />
        {renderMeanPredictionCard()}
        {renderLinearRegressionCard()}
        {renderKNNPredictionCard()}
        {renderCorrelationCard()}
        <div>
            <footer className='footer'>
                <FeedbackForm />
            </footer>
        </div>
    </div>
    );
};

export default Advanced;