import muncher from './muncher.jpeg';
import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as ss from 'simple-statistics';  
import { Link } from 'react-router-dom';
import KNN from 'ml-knn';
import FeedbackForm from './FeedbackForm';
import { Chart, Scatter } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

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
    const [knnModel, setKnnModel] = useState(null);
    const [knnPrediction, setKnnPrediction] = useState(null);
    const [knnAnalysis, setKnnAnalysis] = useState(null);
    const [showPopup, setShowPopup] = useState(false); 
    const [displayData, setDisplayData] = useState([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 50; 
    const [labelColumn, setLabelColumn] = useState(null);
    const chartRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');


    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            setIsLoading(true);
            setLoadingMessage("Loading and processing data...");
            Papa.parse(file, {
                complete: (result) => {
                const rawData = result.data;
                const cleanedData = preprocessData(rawData);
        
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
                    createMeanPrediction(cleanedData.slice(0, itemsPerPage)); 
                    createLinearRegression(cleanedData.slice(0, itemsPerPage), featureColumns, labelColumn); 
                    createKNNModel(cleanedData.slice(0, itemsPerPage), featureColumns, labelColumn); 
                    setShowPopup(false);
                    setIsLoading(false);
                    setLoadingMessage('');
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
    }, [displayData, labelColumn]);

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
    
    const preprocessDataForKNN = (data) => {
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

    const selectColumnsForKNN = (data) => {
        const { numericColumns } = detectColumns(data);
        const featureColumns = numericColumns.slice(0, -1); 
        const labelColumn = numericColumns.slice(-1)[0]; 
    
        return { featureColumns, labelColumn };
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

    const createKNNModel = (data, featureColumns, labelColumn) => {
        if (!featureColumns || featureColumns.length === 0 || !labelColumn) {
            console.error("Invalid feature or label columns for KNN.");
            return;
        }
    
        try {
            const features = data.map(row => featureColumns.map(col => row[col]));
            const labels = data.map(row => row[labelColumn]);
    
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
     
             const regression = ss.linearRegression(features.map((f, i) => [f[0], labels[i]]));
             const { m, b } = regression;
     
             const featureValues = features.map(row => row[0]);
             const correlation = ss.sampleCorrelation(featureValues, labels);
     
             console.log("Regression Model:", { m, b });
     
             setModelPrediction({ m, b });
     
             // Slope interpretation
             let slopeInterpretation = "";
             if (Math.abs(m) < 0.01) {
                 slopeInterpretation = "Very weak or no linear relationship between feature and label.";
             } else if (m > 0) {
                 slopeInterpretation = "Positive correlation between feature and label.";
             } else {
                 slopeInterpretation = "Negative correlation between feature and label.";
             }
     
             // Intercept interpretation
             let interceptInterpretation = `Intercept (b) is ${b.toFixed(2)}, indicating the label value when feature is 0.`;
             if (b > 0) {
                 interceptInterpretation += " This suggests a positive baseline label value.";
             } else if (b < 0) {
                 interceptInterpretation += " This suggests a negative baseline label value.";
             }
     
             // Correlation interpretation
             let correlationInterpretation = "";
             if (Math.abs(correlation) < 0.1) {
                 correlationInterpretation = "Very weak correlation, indicating a poor linear relationship.";
             } else if (Math.abs(correlation) < 0.5) {
                 correlationInterpretation = "Moderate correlation, suggesting a reasonable linear relationship.";
             } else {
                 correlationInterpretation = "Strong correlation, indicating a strong linear relationship.";
             }
     
             // Predicted label for specific feature values
             const exampleFeatureValue = 10; // Example: Use 10 as a sample input
             const predictedLabelForExample = (m * exampleFeatureValue + b).toFixed(2);
             const predictionExampleMessage = `For a feature value of ${exampleFeatureValue}, the predicted label is ${predictedLabelForExample}.`;
     
             // Confidence interpretation based on correlation
             let confidenceInterpretation = "";
             if (Math.abs(correlation) > 0.7) {
                 confidenceInterpretation = "High confidence in the model's predictions.";
             } else if (Math.abs(correlation) > 0.4) {
                 confidenceInterpretation = "Moderate confidence in the model's predictions.";
             } else {
                 confidenceInterpretation = "Low confidence in the model's predictions.";
             }
     
             // Update analysis with structured and concise insights
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
     
             // Replace newlines with <br /> tags for proper HTML rendering
             const formattedAnalysis = analysisText.replace(/\n/g, "<br />");
     
             setModelAnalysis(formattedAnalysis);
     
         } catch (error) {
             console.error("Error generating linear regression:", error);
             setModelPrediction(null);
             setModelAnalysis(`Linear regression failed to create: ${error}`);
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

    const renderKNNPrediction = () => {
        if (!knnModel) return null;
    
        return (
            <div className="predictions-card">
                <h3 className="predictions-header">KNN Prediction Result</h3>
                <div className="analysis-box">
                    <p className="analysis-text">{knnAnalysis}</p>
                    <p className="analysis-text">
                        <strong>What this prediction means:</strong> The KNN model uses the values of the nearest 3 neighbors 
                        (based on feature similarity) in the dataset to predict the label for the given input. It calculates 
                        the average or majority label (depending on regression or classification) among these neighbors.
                    </p>
                    <p className="analysis-text">
                        <strong>Interpreting the result:</strong> If the predicted value is close to one of the data points in 
                        your dataset, it means the input is similar to that data point based on the features provided. If the 
                        prediction seems far from expected, it may indicate that the input lies outside the range of your 
                        training data.
                    </p>
                    <p className="analysis-text">
                        <strong>Limitations:</strong> KNN predictions are sensitive to the choice of <code>k</code> (the number 
                        of neighbors) and the scale of features. Ensure that features are appropriately scaled to avoid bias 
                        towards features with larger ranges.
                    </p>
                </div>
                <div className="manual-prediction">
                    <label htmlFor="knn-x">Enter a value for prediction:</label>
                    <input
                        id="knn-x"
                        type="number"
                        placeholder="E.g., 50, 100, 150"
                        onChange={(e) => {
                            const x = parseFloat(e.target.value);
                            const prediction = knnModel.predict([x]);
                            setKnnPrediction(prediction[0]);
                        }}
                    />
                </div>
                {knnPrediction && (
                    <div className="manual-prediction-result">
                        <strong>Prediction:</strong> {knnPrediction}
                    </div>
                )}
                {/* Display KNN classification regions */}
               {featureColumns && featureColumns.length > 1 && (
                 <div className="knn-classification-regions">
                   <Scatter
                      data={{
                          datasets: [
                            {
                                label: 'Data points',
                                data: displayData.map(row => ({
                                  x: row[featureColumns[0]],
                                    y: row[featureColumns[1]],
                                    label: row[labelColumn]
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
                                      text: 'Feature 1' // Replace with the appropriate feature column name
                                }
                              },
                              y: {
                                  title: {
                                      display: true,
                                      text: 'Feature 2' // Replace with the appropriate feature column name
                                  }
                              }
                            },
                            plugins: {
                                title: {
                                  display: true,
                                 text: 'KNN Classification Regions'
                               }
                            }
                      }}
                   />
                 </div>
               )}
            </div>
        );
    };

    const renderCorrelationCard = () => {
         if (!meanPrediction || !modelPrediction || !knnModel || !featureColumns.length) return null;
     
         return (
             <div className="predictions-card">
                 <h3 className="predictions-header">Model Correlation and Insights</h3>
                 <div className="analysis-box">
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
                         <ul>
                             <li>If all three predictions are similar, the data may lack complex patterns, and simpler models might suffice.</li>
                             <li>Disparities between regression and KNN predictions might indicate non-linear relationships in the data.</li>
                             <li>A significant difference between mean-based and other models suggests that the data has predictive patterns beyond randomness or central tendency.</li>
                         </ul>
                     </p>
                 </div>
                 <div className="additional-insights">
                     <p>
                         <em>
                             Use these interpretations to understand how your models interact with the data. 
                            If you notice discrepancies, consider revisiting feature engineering, model parameters, or even exploring alternative models.
                         </em>
                     </p>
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
                   {/* Use dangerouslySetInnerHTML to render the HTML */}
                    <div className="analysis-text" dangerouslySetInnerHTML={{ __html: interpretation }} />
                 </div>
                <div className="prediction-result">
                    <strong>Slope (m):</strong> {m.toFixed(2)}
                </div>
                <div className="prediction-result">
                    <strong>Intercept (b):</strong> {b.toFixed(2)}
                </div>
    
                {/* Display scatter plot with regression line */}
               {featureColumns && featureColumns.length > 0 && (
                <div className="scatter-plot">
                    <Scatter
                        data={{
                            datasets: [
                                {
                                    label: 'Data points',
                                    data: displayData.map(row => ({
                                        x: row[featureColumns[0]],
                                        y: row[labelColumn]
                                    })),
                                    backgroundColor: 'blue'
                                },
                                {
                                    label: 'Regression line',
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
                                        text: 'Feature' 
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Label'
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Linear Regression Chart'
                                }
                            }
                        }}
                    />
                 </div>
               )}
    
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
                <h1  style={{ fontSize: 'clamp(0.2rem, 4vw, 3rem)' }}>Advanced ML Models</h1>
            </header>
            <div className="import-box">
                <h2>Import CSV Data Only</h2>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="file-input" />
                 {isLoading && <p>{loadingMessage}</p>}
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
            {renderMeanPrediction()}
            {renderLinearRegressionCard()}
            {renderKNNPrediction()}
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