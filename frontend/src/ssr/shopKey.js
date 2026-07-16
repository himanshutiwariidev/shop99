// Shared between Shop.jsx (client) and routeLoaders.js (server) so both sides
// build the same SSR data key for a given URL's query params.
export const buildShopSSRKey = (categoryParam, subCategoryParam, search) =>
  `shop:${categoryParam || ""}:${subCategoryParam || ""}:${search || ""}`;
