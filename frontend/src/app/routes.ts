import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import PlaygroundRoute from "./pages/PlaygroundRoute";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Invoice from "./pages/Invoice";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "product/:id", Component: ProductDetail },
      { path: "playground", Component: PlaygroundRoute },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "invoice", Component: Invoice },
      { path: "wishlist", Component: Wishlist },
      { path: "orders", Component: Orders },
      // Catch-all 404 — must be the last child route under Root so it only
      // matches when nothing else does (keeps Navbar/Footer chrome visible).
      { path: "*", Component: NotFound },
    ],
  },
  { path: "/auth", Component: Auth },
  // Catch-all for top-level mismatches (e.g. /auth/extra/segments)
  { path: "*", Component: NotFound },
]);
