import React from "react";
import './App.css';
import muncher from './muncher.jpeg';
import { Link } from "react-router-dom";


function Dashboard() {
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
          <input type="file" />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
