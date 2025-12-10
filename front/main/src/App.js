import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Notes from './pages/Notes';
import Layout from './components/Layout';
import NoteDetail from './pages/NoteDetail';
import NoteEdit from './pages/NoteEdit';
import NoteQuiz from './pages/NoteQuiz';
import Explore from './pages/Explore';
import './App.css';

function App() {
  return (
    <Router>
    <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/upload" element={
            <Layout>
              <Upload />
            </Layout>
          } />
          <Route path="/notes" element={
            <Layout>
              <Notes />
            </Layout>
          } />
          <Route path="/notes/:noteId" element={
            <Layout>
              <NoteDetail />
            </Layout>
          } />
          <Route path="/notes/:noteId/quiz" element={
            <Layout>
              <NoteQuiz />
            </Layout>
          } />
          <Route path="/notes/:noteId/edit" element={
            <Layout>
              <NoteEdit />
            </Layout>
          } />
          <Route path="/explore" element={
            <Layout>
              <Explore />
            </Layout>
          } />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
