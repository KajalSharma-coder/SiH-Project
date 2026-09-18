import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PublicShell } from "./components/PublicShell";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import "./index.css";
import { BuyerDashboard, BuyerDemand, BuyerMatches } from "./pages/Buyer";
import { CreateLot, FarmerDashboard, FarmerMatches, QualityPassport } from "./pages/Farmer";
import { Home } from "./pages/Home";
import { DailyPriceTracking, PricePrediction, PricePulse, Reliability } from "./pages/Insights";
import { Marketplace } from "./pages/Market";
import { Admin, Login, Settings } from "./pages/Misc";
import { Bill, DealRoom, Transactions } from "./pages/Transactions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicShell />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Login initialMode="signup" /> },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "marketplace", element: <Marketplace /> },
      { path: "market", element: <Navigate to="/marketplace" replace /> },
      { path: "price-prediction", element: <PricePrediction /> },
      { path: "daily-prices", element: <DailyPriceTracking /> },
      {
        path: "farmer/dashboard",
        element: (
          <ProtectedRoute roleRequired="Farmer">
            <FarmerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "farmer/create-lot",
        element: (
          <ProtectedRoute roleRequired="Farmer">
            <CreateLot />
          </ProtectedRoute>
        ),
      },
      {
        path: "farmer/quality",
        element: (
          <ProtectedRoute roleRequired="Farmer">
            <QualityPassport />
          </ProtectedRoute>
        ),
      },
      {
        path: "farmer/matches",
        element: (
          <ProtectedRoute roleRequired="Farmer">
            <FarmerMatches />
          </ProtectedRoute>
        ),
      },
      {
        path: "buyer/dashboard",
        element: (
          <ProtectedRoute roleRequired="Buyer">
            <BuyerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "buyer/demand",
        element: (
          <ProtectedRoute roleRequired="Buyer">
            <BuyerDemand />
          </ProtectedRoute>
        ),
      },
      {
        path: "buyer/matches",
        element: (
          <ProtectedRoute roleRequired="Buyer">
            <BuyerMatches />
          </ProtectedRoute>
        ),
      },
      { path: "deal-room/:id", element: <DealRoom /> },
      { path: "bill/:id", element: <Bill /> },
      { path: "transactions", element: <Transactions /> },
      { path: "reliability", element: <Reliability /> },
      { path: "price-pulse", element: <PricePulse /> },
      { path: "admin", element: <Admin /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
