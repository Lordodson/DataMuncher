import React from 'react';
import muncher from './muncher.jpeg';
import { Link } from 'react-router-dom';
import styles from './EducationalResource.css';
import TableOfContents from './TableOfContents';

const EducationalResource = () => {
  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className="App-header">
        <Link to="/">
          <img src={muncher} className="App-logo" alt="logo" />
        </Link>
        <h1 style={{ fontSize: 'clamp(0.2rem, 4vw, 3rem)' }} className="page-title">
          Educational Resource
        </h1>
      </header>

      {/* Layout for TOC and Content */}
      <div className={styles.layout}>
        {/* Sidebar Navigation (TOC) */}
        <div className="toc">
          <TableOfContents />
        </div>

        {/* Main Content */}
        <div className="content">
          <h2 id="section1">Example Section 1</h2>
          <p>Content for section 1...</p>
          {/* Add more sections here */}
        </div>
      </div>
    </div>
  );
};

export default EducationalResource;
