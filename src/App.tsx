import './App.css';
import PopupPage from './pages/popup';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <Routes>
          <Route path="/dashboard" element={<h1>Hello from dashboard</h1>} />
          <Route path="*" element={<PopupPage />} />
        </Routes>
      </ChakraProvider>
    </BrowserRouter>
  );
}

export default App;
