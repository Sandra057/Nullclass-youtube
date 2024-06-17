import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { auth, db, dbRef } from './components/firebaseConfig';
import { onValue, set } from 'firebase/database';
import VideoFeed from './components/VideoFeed';
import VideoDetail from './components/VideoDetail';
import VideoCall from './components/VideoCall';
import Profile from './components/Profile';
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './App.css';

const App = () => {
  const [points, setPoints] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setAuthInitialized(true);
      if (user) {
        const userWatchedVideosRef = dbRef(db, `users/${user.uid}/watchedVideos`);
        onValue(userWatchedVideosRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setWatchedVideos(data);
          }
        });

        const userPointsRef = dbRef(db, `users/${user.uid}/points`);
        onValue(userPointsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setPoints(data);
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleVideoWatched = (videoId) => {
    if (!watchedVideos.includes(videoId)) {
      const newWatchedVideos = [...watchedVideos, videoId];
      setWatchedVideos(newWatchedVideos);
      const newPoints = points + 5;
      setPoints(newPoints);

      if (user) {
        const userWatchedVideosRef = dbRef(db, `users/${user.uid}/watchedVideos`);
        set(userWatchedVideosRef, newWatchedVideos);

        const userPointsRef = dbRef(db, `users/${user.uid}/points`);
        set(userPointsRef, newPoints);
      }
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
    setWatchedVideos([]);
    setPoints(0);
  };

  if (!authInitialized) {
    return <div>Loading...</div>; // or a loading spinner
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header currentUser={user} handleLogout={handleLogout} points={points} />
              <div className="app__body">
                {user && <Sidebar />}
                <VideoFeed onVideoWatched={handleVideoWatched} watchedVideos={watchedVideos} />
              </div>
            </>
          }
        />
        <Route
          path="/video/:id"
          element={user ? <VideoDetail onVideoWatched={handleVideoWatched} /> : <Navigate to="/login" />}
        />
        <Route
          path="/video-call"
          element={user ? <VideoCall /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile handleLogout={handleLogout} points={points} /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
      </Routes>
    </Router>
  );
};

export default App;
