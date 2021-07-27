import React from 'react';
import ReactDOM from 'react-dom';
import '@tensorflow/tfjs-backend-webgl';
import App from './App';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
