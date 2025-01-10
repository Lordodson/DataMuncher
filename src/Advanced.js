import muncher from './muncher.jpeg';
import React, { useState } from 'react';
import Papa from 'papaparse';
import * as ss from 'simple-statistics';  
import { Link } from 'react-router-dom';

const Advanced = () => {
    const [data, setData] = useState(null);
    const [meanPrediction, setMeanPrediction] = useState(null);
    const [meanAnalysis, setMeanAnalysis] = useState(null);  
    const [modelPrediction, setModelPrediction] = useState(null);
    const [modelAnalysis, setModelAnalysis] = useState(null);  
    const [modelError, setModelError] = useState(null);  
    const [predictionType, setPredictionType] = useState(null); 
    const [manualPrediction, setManualPrediction] = useState(null);
    const [featureColumns, setFeatureColumns] = useState([]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            Papa.parse(file, {
                complete: (result) => {
                    const rawData = result.data;
                    const cleanedData = preprocessData(rawData);
    
                    const { featureColumns, labelColumn } = selectColumns(cleanedData);
                    setFeatureColumns(featureColumns);  
                    const validationIssues = validateData(cleanedData, featureColumns, labelColumn);
    
                    if (validationIssues.length > 0) {
                        console.error("Validation Issues:", validationIssues);
                        alert("Validation Errors:\n" + validationIssues.join("\n"));
                    } else {
                        console.log("Features:", featureColumns);
                        console.log("Label:", labelColumn);
                        console.log("Cleaned and Validated Data:", cleanedData);
    
                        setData(cleanedData);
                        createMeanPrediction(cleanedData);
                        createLinearRegression(cleanedData, featureColumns, labelColumn);
                    }
                },
                header: true,
                skipEmptyLines: true,
            });
        } else {
            alert("Please upload a valid CSV file.");
        }
    };
    
    const preprocessData = (data) => {
        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            columns.forEach((column, index) => {
                columns[index] = column.trim();
            });
        }
    
        return data.map(row => {
            const processedRow = {};
            Object.keys(row).forEach(key => {
                let value = row[key];
                if (typeof value === 'string') {
                    value = value.replace(/[^0-9.-]+/g, ''); 
                }
                processedRow[key] = value === "" || isNaN(value) ? value : parseFloat(value);
            });
            return processedRow;
        });
    };
    
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
    
        featureColumns.forEach(col => {
            if (!data.every(row => !isNaN(row[col]))) {issues.push(`Feature column "${col}" contains non-numeric values.`);}});
    
        if (!data.every(row => !isNaN(row[labelColumn]))) {issues.push(`Label column "${labelColumn}" contains non-numeric values.`); }
    
        const missingInFeatures = featureColumns.some(col =>data.some(row => row[col] === null || row[col] === ""));
        if (missingInFeatures) {issues.push("Missing values found in feature columns.");}
    
        const missingInLabel = data.some(row => row[labelColumn] === null || row[labelColumn] === "");
        if (missingInLabel) {issues.push("Missing values found in label column.");}
    
        return issues;
    };
    
    const selectColumns = (data) => {
        const { numericColumns, nonNumericColumns } = detectColumns(data);
        console.log("Numeric Columns:", numericColumns);
        console.log("Non-Numeric Columns:", nonNumericColumns);
    
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
        const y = m * x + b;
    
        if (Math.abs(m) < 0.01) {console.log(`Warning: The slope is nearly zero (${m.toFixed(2)}), which means the prediction won't vary much based on x.`);}
    
        console.log(`For x = ${x}, the predicted y is ${y}`);
        setManualPrediction({ x, y });
        return y;
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
        }
    };

    const createLinearRegression = (data, featureColumns, labelColumn) => {
        if (!featureColumns || featureColumns.length === 0 || !labelColumn) {
            console.error("Invalid feature or label columns for linear regression.");
            return;
        }
    
        try {
            const features = data.map(row => featureColumns.map(col => row[col]));
            const labels = data.map(row => row[labelColumn]);
    
            const regression = ss.linearRegression(features.map((f, i) => [...f, labels[i]]));
            const { m, b } = regression; 
    
            const featureValues = features.map(row => row[0]); 
            const correlation = ss.sampleCorrelation(featureValues, labels); 
    
            console.log("Regression Model:", { m, b });
    
            setModelPrediction({ m, b });
    
            let slopeInterpretation = "";
            if (Math.abs(m) < 0.01) {
                slopeInterpretation = "The slope is close to zero, suggesting a weak or no linear relationship between the feature and the label.";
            } else if (m > 0) {
                slopeInterpretation = "The slope is positive, indicating a positive correlation between the feature and the label.";
            } else {
                slopeInterpretation = "The slope is negative, indicating a negative correlation between the feature and the label.";
            }
    
            let correlationInterpretation = "";
            if (Math.abs(correlation) < 0.1) {
                correlationInterpretation = "The correlation between the feature and the label is very weak, supporting a weak linear relationship.";
            } else if (Math.abs(correlation) < 0.5) {
                correlationInterpretation = "There is a moderate correlation between the feature and the label.";
            } else {
                correlationInterpretation = "The feature and the label have a strong correlation.";
            }
    
            setModelAnalysis(`
                The regression equation is: y = ${m.toFixed(2)}x + ${b.toFixed(2)}.\n
                Slope Interpretation: ${slopeInterpretation}.\n
                Correlation Interpretation: ${correlationInterpretation}.
            `);
    
        } catch (error) {
            console.error("Error generating linear regression:", error);
            setModelPrediction(null);
        }
    };
    
    const calculateCorrelation = (meanPrediction, regressionPredictions) => {
        const n = regressionPredictions.length;
        const meanOfPredictions = ss.mean(regressionPredictions);
        const covariance = regressionPredictions.reduce((sum, y_pred) => sum + (meanPrediction - meanOfPredictions) * (y_pred - meanOfPredictions), 0);
        const stdDevMeanPrediction = Math.sqrt(regressionPredictions.reduce((sum, y_pred) => sum + Math.pow(y_pred - meanPrediction, 2), 0) / n);
        const stdDevRegression = Math.sqrt(regressionPredictions.reduce((sum, y_pred) => sum + Math.pow(y_pred - meanOfPredictions, 2), 0) / n);
        const correlation = covariance / (stdDevMeanPrediction * stdDevRegression);
        return correlation;
    };
    
    const renderCorrelationCard = () => {
        if (meanPrediction === null || !modelPrediction || featureColumns.length === 0) return null;
    
        const firstRow = data[0];
        const xValue = firstRow[featureColumns[0]]; 
        const regressionPrediction = modelPrediction.m * xValue + modelPrediction.b;
        const regressionPredictions = data.map(row => row[featureColumns[0]] * modelPrediction.m + modelPrediction.b);
        const correlation = calculateCorrelation(meanPrediction, regressionPredictions);
    
        let correlationText = `The correlation between the mean-based prediction and the linear regression model's predictions is ${correlation.toFixed(2)}.`;
    
        if (correlation > 0.8) {
            correlationText += " This indicates a strong positive relationship between the two models.";
        } else if (correlation < -0.8) {
            correlationText += " This indicates a strong negative relationship between the two models.";
        } else if (correlation > 0.4) {
            correlationText += " This indicates a moderate positive relationship.";
        } else if (correlation < -0.4) {
            correlationText += " This indicates a moderate negative relationship.";
        } else {
            correlationText += " This indicates a weak or no relationship between the two models.";
        }
    
        return (
            <div className="predictions-card">
                <h3 className="predictions-header">Correlation and Analysis</h3>
                <div className="analysis-box">
                    {/* <p className="analysis-text">
                        <strong>Mean-Based Prediction:</strong> {meanPrediction.toFixed(2)}
                    </p>
                    <p className="analysis-text">
                        <strong>Linear Regression Prediction = </strong> {regressionPrediction.toFixed(2)} */}
                    {/* </p> */}
                    <p className="analysis-text">{correlationText}</p>
                </div>
            </div>
        );
    };

    const renderMeanPrediction = () => {
        if (meanPrediction === null) return null;
        return (
            <div className="predictions-card">
                <h3 className="predictions-header">Mean-Based Prediction Result</h3>
                <div className="analysis-box">
                    <p className="analysis-text">{meanAnalysis}</p>
                </div>
                <div className="prediction-result">
                    <strong>Predicted Value:</strong> {meanPrediction.toFixed(2)}
                </div>
            </div>
        );
    };

    const renderLinearRegressionCard = () => {
        if (!modelPrediction) return null;
    
        const { m, b } = modelPrediction;
        const interpretation = modelAnalysis; 
    
        return (
            <div className="predictions-card">
                <h3 className="predictions-header">Linear Regression Result</h3>
                <div className="analysis-box">
                    <p className="analysis-text">{interpretation}</p>
                </div>
                <div className="prediction-result">
                    <strong>Slope (m):</strong> {m.toFixed(2)}
                </div>
                <div className="prediction-result">
                    <strong>Intercept (b):</strong> {b.toFixed(2)}
                </div>
    
                {/* Instructions for manual prediction */}
                <div className="manual-prediction-instructions">
                    <p>
                        <strong>Instructions:</strong> Enter a value for <code>x</code> to calculate the predicted value 
                        <code> y</code> using the regression model. This should typically be a numeric value within the range of your dataset.
                    </p>
                    <p>
                        <em>Example:</em> If your dataset represents house prices with features like size or rooms, enter the
                        corresponding feature value for prediction. However, if m = 0, the prediction will not change with a different value for x.
                    </p>
                </div>
    
                {/* Input for manual prediction */}
                <div className="manual-prediction">
                    <label htmlFor="manual-x">Enter a value for x:</label>
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
                        <strong>Prediction for y = {manualPrediction.x}:</strong> {manualPrediction.y.toFixed(2)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="advanced-page">
            <header className="App-header">
                <Link to="/">
                    <img src={muncher} className="App-logo" alt="logo" />
                </Link>
                <h1 className="page-title">Advanced</h1>
            </header>
            <div className="import-box">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="file-input" />
            </div>
            {renderMeanPrediction()}
            {renderLinearRegressionCard()}
            {renderCorrelationCard()}
        </div>
    );
};

export default Advanced;
