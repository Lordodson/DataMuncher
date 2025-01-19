
// src/SignIn.js
import React, { useState } from "react";
import { signIn } from "./auth";
import { auth } from "./firebase";


const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Sign In</button>
      <li>
        <Link to="/about">About DataMuncher</Link>
      </li>
    </form>
  );
};

export default SignIn;