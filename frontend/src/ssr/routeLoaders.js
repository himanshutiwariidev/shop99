import { matchPath } from "react-router-dom";
import {
  getSEOByPageApi,
  getBrandsApi,
  getPopularProductsApi,
  getLatestProductsApi,
  getMostSellingProductsApi,
  getProductByIdApi,
  getCategoriesApi,
  getBlogsApi,
  getBlogByIdApi,
  getProductsApi,
  getDealsProductsApi,
} from "../api/api";
import { getCategories } from "../services/categoryService";
import { buildShopSSRKey } from "./shopKey";

const slugify = (text) =>
  text
    ?.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

// A loader failure should never take the whole page down — worst case it
// just falls back to the pre-SSR behaviour (client fetches after hydration).
async function safe(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error("SSR loader step failed:", err);
    return null;
  }
}

const routeLoaders = [
  {
    path: "/",
    loader: async () => ({
      "seo:home": await safe(() => getSEOByPageApi("home")),
      "home:brands": await safe(() => getBrandsApi()),
      "home:popular": await safe(() => getPopularProductsApi()),
      "home:latest": await safe(() => getLatestProductsApi()),
      "home:mostSelling": await safe(() => getMostSellingProductsApi()),
    }),
  },
  {
    path: "/productPage/:id",
    loader: async (params) => ({
      [`product:${params.id}`]: await safe(() => getProductByIdApi(params.id)),
    }),
  },
  {
    path: "/shop",
    loader: async (_params, searchParams) => {
      const categoryParam = searchParams.get("category") || "";
      const subCategoryParam = searchParams.get("subCategory") || "";
      const search = searchParams.get("search") || "";
      const categoryForApi = subCategoryParam || categoryParam;
      const seoPage = subCategoryParam
        ? `shop-category-${slugify(subCategoryParam)}`
        : categoryParam
          ? `shop-category-${slugify(categoryParam)}`
          : "shop";

      const [productRes, categoryRes, brandRes] = await Promise.all([
        safe(() => getProductsApi({ category: categoryForApi, search, page: 1, limit: 20 })),
        safe(() => getCategoriesApi()),
        safe(() => getBrandsApi()),
      ]);

      const products = productRes?.data?.data || productRes?.data || [];
      const meta = productRes?.data?.meta ?? productRes?.meta;
      const totalPages = meta?.totalPages ?? productRes?.totalPages ?? 1;
      const categories = Array.isArray(categoryRes) ? categoryRes : categoryRes?.categories || [];

      return {
        [buildShopSSRKey(categoryParam, subCategoryParam, search)]: {
          products: Array.isArray(products) ? products : [],
          categories,
          brands: brandRes || [],
          totalPages,
        },
        [`seo:${seoPage}`]: await safe(() => getSEOByPageApi(seoPage)),
      };
    },
  },
  {
    path: "/categories",
    loader: async () => ({
      "categories:list": await safe(() => getCategories()),
      "seo:categories": await safe(() => getSEOByPageApi("categories")),
    }),
  },
  {
    path: "/brands",
    loader: async () => ({
      "brands:list": await safe(() => getBrandsApi()),
      "seo:brands": await safe(() => getSEOByPageApi("brands")),
    }),
  },
  {
    path: "/blog",
    loader: async () => ({
      "blogs:list": await safe(() => getBlogsApi()),
      "seo:blogs": await safe(() => getSEOByPageApi("blogs")),
    }),
  },
  {
    path: "/blog/:id",
    loader: async (params) => ({
      [`blog:${params.id}`]: await safe(() => getBlogByIdApi(params.id)),
      "seo:blog": await safe(() => getSEOByPageApi("blog")),
    }),
  },
  {
    path: "/about",
    loader: async () => ({ "seo:about": await safe(() => getSEOByPageApi("about")) }),
  },
  {
    path: "/contact",
    loader: async () => ({ "seo:contact": await safe(() => getSEOByPageApi("contact")) }),
  },
  {
    path: "/deals",
    loader: async () => ({
      "deals:list": await safe(() => getDealsProductsApi()),
      "seo:deals": await safe(() => getSEOByPageApi("deals")),
    }),
  },
  {
    path: "/most-selling-products",
    loader: async () => ({
      "mostSelling:list": await safe(() => getMostSellingProductsApi()),
      "seo:most-selling-products": await safe(() => getSEOByPageApi("most-selling-products")),
    }),
  },
  {
    path: "/privacy-policy",
    loader: async () => ({
      "seo:privacy-policy": await safe(() => getSEOByPageApi("privacy-policy")),
    }),
  },
];

export async function runLoaderForUrl(url) {
  const [pathname, search = ""] = String(url || "/").split("?");
  const searchParams = new URLSearchParams(search);

  for (const { path, loader } of routeLoaders) {
    const match = matchPath({ path, end: true }, pathname);
    if (match) {
      try {
        const data = await loader(match.params || {}, searchParams);
        return { ...data, __currentUrl: `https://shop99.co.in${url}` };
      } catch (err) {
        console.error("SSR loader failed for", url, err);
        return { __currentUrl: `https://shop99.co.in${url}` };
      }
    }
  }
  return { __currentUrl: `https://shop99.co.in${url}` };
}
