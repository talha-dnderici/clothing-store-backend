# Database Design

This project uses MongoDB Atlas as the shared database for all backend services.

## Existing Core Collections

- `users`: customer and admin-like user accounts
- `products`: store catalog and stock data
- `cards`: shopping cart data
- `login_sessions`: authentication session records

## Added Design Collections

- `orders`: placed orders and order statuses
- `comments`: product comments and ratings with manager approval
- `wishlists`: customer wish list entries and discount notifications
- `invoices`: invoice metadata and PDF delivery state
- `refund_requests`: selective return and refund workflow
- `deliveries`: delivery records handled by product managers

## Requirement Mapping

- Product minimum fields are now represented by `name`, `model`, `serialNumber`,
  `description`, `stock`, `price`, `warrantyStatus`, and `distributor`.
- User minimum fields are represented by `name`, `taxId`, `email`, `address`,
  `password`, and `role`.
- Order lifecycle is represented by `processing`, `in-transit`, `delivered`,
  `cancelled`, and `refunded`.
- Product comments are stored separately and remain invisible until approved.
- Wishlist, invoice, refund, and delivery data each have their own collections so
  the project can grow into the full course scope without redesigning the database.
