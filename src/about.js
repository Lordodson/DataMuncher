// src/About.js
import React from "react";
import './App.css';
import { Link } from "react-router-dom";
import muncher from './muncher.jpeg';

function About() {
  return (
    <div className="about-container">
      <Link to="/">
        <img src={muncher} className="home-logo" alt="logo" />
      </Link>
      <h1>About DataMuncher</h1>
      <p>DataMuncher is still in development.</p>
      <p>DataMuncher is a powerful tool designed to help you analyze data efficiently. Whether you're a data scientist, analyst, or just someone who loves working with data, DataMuncher provides a quick analysis.</p>
      <p>With features like data import, visualization, and advanced analytics, DataMuncher is your go-to solution for data analysis needs.</p>
    </div>
  );
}

export default About;
