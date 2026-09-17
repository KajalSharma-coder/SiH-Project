import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import "./index.css";
import { BuyerDashboard, BuyerDemand, BuyerMatches } from "./pages/Buyer";
import { CreateLot, FarmerDashboard, FarmerMatches, QualityPassport } from "./pages/Farmer";
import { Home } from "./pages/Home";
import { PricePulse, Reliability } from "./pages/Insights";
import { Market } from "./pages/Market";
import { Admin, Login, Settings } from "./pages/Misc";
import { Bill, DealRoom } from "./pages/Transactions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "market", element: <Market /> },
      { path: "farmer/dashboard", element: <FarmerDashboard /> },
      { path: "farmer/create-lot", element: <CreateLot /> },
      { path: "farmer/quality", element: <QualityPassport /> },
      { path: "farmer/matches", element: <FarmerMatches /> },
      { path: "buyer/dashboard", element: <BuyerDashboard /> },
      { path: "buyer/demand", element: <BuyerDemand /> },
      { path: "buyer/matches", element: <BuyerMatches /> },
      { path: "deal-room/:id", element: <DealRoom /> },
      { path: "bill/:id", element: <Bill /> },
      { path: "reliability", element: <Reliability /> },
      { path: "price-pulse", element: <PricePulse /> },
      { path: "admin", element: <Admin /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
