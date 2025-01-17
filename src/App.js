import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import Home from "./Home";
import SignUp from "./signUp";
import Dashboard from "./dashboard";
import About from "./about";
import Advanced from "./Advanced";
import PyEdit from "./PyEdit";
import EducationalResource from "./EducationResource";
import './App.css';

function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const hideNavbarRoutes = ["/signup", "/"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  if (shouldHideNavbar) return null;

  const handleLinkClick = () => {setIsMenuOpen(false);} // Close the menu when a link is clicked};

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
          <Link to="/signup" className="navbar-link" onClick={handleLinkClick}>Sign Up</Link>
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
      </ul>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/Advanced" element={<Advanced />} />
          <Route path="/PyEdit" element={<PyEdit />} />
          <Route path="/EducationalResource" element={<EducationalResource />} />
        </Routes>
      </div>
    </Router>
  );
}