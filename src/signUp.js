import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import muncher from './muncher.jpeg';
import './App.css';

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const auth = getAuth();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setError(""); 
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("User signed up:", user);
        navigate("/"); 
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Error signing up:", errorCode, errorMessage);
        if (errorCode === 'auth/email-already-in-use') {
          setError("An account with this email already exists.");
        } else {
          setError(errorMessage);
        }
        console.log("Error state set to:", error);
      });
  };

  return (
    <div className="signup-container">
      <Link to="/">
        <img src={muncher} className="home-logo" alt="logo" />
      </Link>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignUp} className="signup-form">
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={handleEmailChange} required />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" value={password} onChange={handlePasswordChange} required />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn">Sign Up</button>
        <Link className="about-link" to="/about">About DataMuncher</Link>
      </form>
    </div>
  );
}

export default SignUp;
