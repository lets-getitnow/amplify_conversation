import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BasicChat from "./BasicChat";
import TestChat from "./TestChat";


function App() {
  return (
    <Router>
      <main>
        <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>AIConversation Chat</Link>
          <Link to="/test">Javascript Frontend Chat</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<BasicChat />} />
          <Route path="/test" element={<TestChat />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
