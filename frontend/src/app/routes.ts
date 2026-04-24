import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import Playground from "./pages/Playground";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Invoice from "./pages/Invoice";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "product/:id", Component: ProductDetail },
      { path: "playground", Component: Playground },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "invoice", Component: Invoice },
    ],
  },
  { path: "/auth", Component: Auth },
]);
