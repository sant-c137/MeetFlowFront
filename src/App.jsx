import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const NotFoundPage = React.lazy(() => import("./NotFoundPage"));
const Loading = React.lazy(() => import("./Loading"));
const Authentication = React.lazy(() => import("./Authentication"));
const Home = React.lazy(() => import("./Home"));
const ProtectedRoute = React.lazy(() => import("./auth/ProtectedRoute"));
const EventDetailPage = React.lazy(() => import("./EventDetailPage"));

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Suspense fallback={<Loading />}>
          <Authentication />
        </Suspense>
      ),
      errorElement: <NotFoundPage />,
    },
    {
      path: "/",
      element: (
        <Suspense fallback={<Loading />}>
          <ProtectedRoute />
        </Suspense>
      ),
      errorElement: <NotFoundPage />,
      children: [
        {
          path: "/home",
          element: (
            <Suspense fallback={<Loading />}>
              <Home />
            </Suspense>
          ),
        },
        {
          path: "/events/:eventId",
          element: (
            <Suspense fallback={<Loading />}>
              <EventDetailPage />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "*",
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
