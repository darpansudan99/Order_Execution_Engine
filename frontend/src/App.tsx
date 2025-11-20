import './App.css';
import { Terminal } from './components/Terminal'; // Will create this
import { Dashboard } from './components/Dashboard'; // Will create this

function App() {
  return (
    <div className="app-container">
      <div className="terminal-pane">
        <Terminal />
      </div>
      <div className="dashboard-pane">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;