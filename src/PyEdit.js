import React, { useState, useEffect } from 'react';
import Sk from 'skulpt';  
import muncher from './muncher.jpeg';  
import { Link } from 'react-router-dom';
import './PyEdit.css';  
import { Chart } from 'chart.js';  

const PyEdit = () => {
  const [code, setCode] = useState('');  
  const [output, setOutput] = useState('');  
  const [data, setData] = useState([]);  

  useEffect(() => {
    Sk.configure({
      output: (text) => {
        setOutput((prevOutput) => prevOutput + text);
      },
      error: (text) => {
        setOutput((prevOutput) => prevOutput + `Error: ${text}`);
      },
    });
  }, []);

  const runPythonCode = () => {
    setOutput(''); 
    try {
      Sk.importMainWithBody('<stdin>', false, code, true);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const plotData = () => {
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((_, index) => `Data ${index + 1}`),
        datasets: [{
          label: 'Random Data',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  };

  useEffect(() => {
    if (data.length > 0) {
      plotData();
    }
  }, [data]);

  return (
    <div className="advanced-page">
      <header className="App-header">
        <Link to="/">
          <img src={muncher} className="App-logo" alt="logo" />
        </Link>
        <h1
          style={{fontSize: 'clamp(0.2rem, 4vw, 3rem)'}} 
        className="page-title">PyEdit</h1>
      </header>

      {/* Main Content */}
      <div className="content">
        <div className="pyedit-header">
          <p className="description">
            Run and test your Python code directly in the browser. Enter your code, run it, and see the results instantly.
          </p>
        </div>

        <div className="python-executor">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Python code here"
            rows="12"
            cols="70"
            className="code-area"
          />
          <button onClick={runPythonCode} className="run-button">
            Run Code
          </button>

          <div className="output">
            <h3>Output:</h3>
            <div id="output" className="output-text">
              {output}
              {/* Output will be displayed here */}
            </div>
          </div>

          <div className="chart-container">
            <canvas id="myChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PyEdit;