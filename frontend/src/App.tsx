import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Drivers from './pages/Drivers';
import Destinations from './pages/Destinations';
import Trips from './pages/Trips';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-brand">
            <h1>Fahrdienst App</h1>
            <p>Medical Transport Coordination</p>
          </div>
          <ul className="navbar-menu">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/patients">Patienten</Link></li>
            <li><Link to="/drivers">Fahrer</Link></li>
            <li><Link to="/destinations">Ziele</Link></li>
            <li><Link to="/trips">Fahrten</Link></li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/trips" element={<Trips />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
