import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
// import './App.css';

const NotFoundPage = React.lazy(() => import('./NotFoundPage'));
const Loading = React.lazy(() => import('./Loading'));
const Authentication = React.lazy(() => import('./Authentication'));
const Home = React.lazy(() => import('./Home'));
const ProtectedRoute = React.lazy(() => import('./auth/ProtectedRoute'));

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        <Suspense fallback={<Loading />}>
          <Authentication />
        </Suspense>
      ),
      errorElement: <NotFoundPage />,
    },

    {
      path: '/',
      element: (
        <Suspense fallback={<Loading />}>
          <ProtectedRoute />
        </Suspense>
      ),
      errorElement: <NotFoundPage />,
      children: [
        {
          path: '/notes',
          element: (
            <Suspense fallback={<Loading />}>
              <Home />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: '*',
      element: (
        <Suspense fallback={<Loading />}>
          <NotFoundPage />
        </Suspense>
      ),
    },
  ]);

  return router;
}

export default App;
