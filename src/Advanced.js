import muncher from './muncher.jpeg';
import React, { useState } from 'react';
import Papa from 'papaparse';
import * as ss from 'simple-statistics';
import { Link } from 'react-router-dom';

const Advanced = () => {
    const [data, setData] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [analysis, setAnalysis] = useState(null); // State for analysis text

    // Step 1: Preprocess the uploaded data
    const preprocessData = (data) => {
        return data.map(row => {
            const processedRow = {};
            Object.keys(row).forEach(key => {
                // Attempt to parse each value as a float. If it fails, leave it as a string.
                processedRow[key] = isNaN(row[key]) ? row[key] : parseFloat(row[key]);
            });
            return processedRow;
        });
    };

    // Step 2: Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            Papa.parse(file, {
                complete: (result) => {
                    const parsedData = preprocessData(result.data); // Preprocess the data
                    setData(parsedData);
                    createMLModel(parsedData); // Train model after parsing
                },
                header: true,
                skipEmptyLines: true,
            });
        } else {
            alert("Please upload a valid CSV file.");
        }
    };

    // Step 3: Create and train the mean-based prediction model
    const createMLModel = (data) => {
        try {
            const cleanedData = preprocessData(data);

            if (cleanedData.length === 0) {
                console.error('No valid data available after cleaning.');
                alert('No valid data available after cleaning. Please check the CSV for missing or invalid values.');
                return;
            }

            // Assuming the last column is the label
            const labelName = Object.keys(cleanedData[0]).pop(); // Last column
            const labels = cleanedData.map(row => parseFloat(row[labelName])); // Extract labels

            console.log('Labels:', labels);  // Debugging line

            // Calculate the mean of the labels
            const meanLabel = ss.mean(labels);

            setPrediction(meanLabel); // Store the prediction

            // Generate analysis
            const analysisText = `The predicted value is based on the average of all labels, which is ${meanLabel.toFixed(2)}. This provides a baseline for understanding the central tendency of your data.`;
            setAnalysis(analysisText); // Store analysis text

            console.log('Prediction:', meanLabel); // Debugging line
        } catch (error) {
            console.error('Error training the model:', error);
            alert('Failed to train model. Please check your data.');
        }
    };

    // Step 4: Render predictions and analysis
    const renderPredictions = () => {
        if (prediction === null) return <div className="predictions-box"></div>;
        return (
            <div className="predictions-card">
                <h3 className="predictions-header">Mean-Based Prediction Result</h3>
                <div className="analysis-box">
                    <p className="analysis-text">{analysis}</p>
                </div>
                <div className="prediction-result">
                    <strong>Predicted Value:</strong> {prediction.toFixed(2)}
                </div>
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
            {renderPredictions()}
        </div>
    );
};

export default Advanced;
