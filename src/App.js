import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import Home from "./Home";
import SignUp from "./signUp";
import Dashboard from "./dashboard";
import About from "./about";
import Advanced from "./Advanced";
import PyEdit from "./PyEdit";
import EducationalResource from "./EducationResource";
import FeedbackForm from "./FeedbackForm";
import PyAdvanced from "./PyAdvanced";
import './App.css';

function Navbar({ theme, toggleTheme }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const hideNavbarRoutes = ["/signup", "/", "/about"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  if (shouldHideNavbar) return null;

  const handleLinkClick = () => {
    setIsMenuOpen(false); 
  };

  return (
    <nav className="navbar">
      <button
        className="menu-toggle"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        ☰ {/* Hamburger icon */}
      </button>
      <ul className={`navbar-list ${isMenuOpen ? "open" : ""}`}>
        <li className="navbar-item">
          <Link to="/" className="navbar-link" onClick={handleLinkClick}>Home</Link>
        </li>
        <li className="navbar-item">
          <Link to="/about" className="navbar-link" onClick={handleLinkClick}>About</Link>
        </li>
        <li className="navbar-item">
          <Link to="/dashboard" className="navbar-link" onClick={handleLinkClick}>Dashboard</Link>
        </li>
        <li className="navbar-item">
          <Link to="/Advanced" className="navbar-link" onClick={handleLinkClick}>Advanced</Link>
        </li>
        <li className="navbar-item">
          <Link to="/PyEdit" className="navbar-link" onClick={handleLinkClick}>PyEdit</Link>
        </li>
        <li className="navbar-item">
          <Link to="/EducationalResource" className="navbar-link" onClick={handleLinkClick}>Educational Resource</Link>
        </li>
        {/* <li>
          <Link to="/PyAdvanced" className="navbar-link" onClick={handleLinkClick}>Python Advanced</Link>
        </li> */}
        {/* <li className="navbar-item theme-toggle-item">
          <button className="theme-toggle-button" onClick={toggleTheme}>
            Switch to {theme === 'light' ? 'dark' : 'light'} mode
          </button>
        </li> */}
      </ul>
    </nav>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemPrefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    console.log(`Theme set to: ${theme}`); 
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    console.log(`Theme toggled to: ${theme === 'light' ? 'dark' : 'light'}`); 
  };

  return (
    <Router>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <div className={`main-content app ${theme}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/Advanced" element={<Advanced />} />
          <Route path="/PyEdit" element={<PyEdit />} />
          <Route path="/EducationalResource" element={<EducationalResource />} />
          <Route path="/PyAdvanced" element={<PyAdvanced/>} />
          <Route path="/feedback" element={<FeedbackForm theme={theme} />} /> {/* Pass theme prop */}
        </Routes>
      </div>
    </Router>
  );
}