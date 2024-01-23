import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomeView from './HomeView/HomeView';
import LiveGameView from './LiveGameView/LiveGameView';
import PreviousGameView from './PreviousGameView/PreviousGameView';
import { Navigate } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomeView />} />
          <Route path="/live/:id" element={<LiveGameView />} />
          <Route path="/gamehistory/:gameId" element={<PreviousGameView />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
