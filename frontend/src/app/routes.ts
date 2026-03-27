import { createMemoryRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";

export const router = createMemoryRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "product/:id", Component: ProductDetail },
    ],
  },
  { path: "/auth", Component: Auth },
]);
