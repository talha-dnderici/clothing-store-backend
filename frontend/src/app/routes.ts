import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import Playground from "./pages/Playground";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "product/:id", Component: ProductDetail },
      { path: "playground", Component: Playground },
    ],
  },
  { path: "/auth", Component: Auth },
]);
