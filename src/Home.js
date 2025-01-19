import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import muncher from './muncher.jpeg';
import './App.css';
import { Link } from "react-router-dom";


function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = getAuth();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        navigate("/dashboard");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Error signing in:", errorCode, errorMessage);
      });
  };

  return (
    <div className="home-container">
      <img src={muncher} className="home-logo" alt="logo" />
      <h1>Welcome to DataMuncher!</h1>
      <form onSubmit={handleSignIn} className="login-form">
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={handleEmailChange} required />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" value={password} onChange={handlePasswordChange} required />
        </div>
        <button type="submit" className="btn">Sign In</button>
        <button onClick={() => navigate("/signup")} className="btn secondary">Sign Up</button>
        <Link className="about-link" to="/about">About DataMuncher</Link>
      </form>
    </div>
  );
}

export default Home;
