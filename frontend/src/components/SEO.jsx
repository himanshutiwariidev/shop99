// components/SEO.jsx

import { Helmet } from "react-helmet-async";
import { useContext } from "react";
import { getSEOByPageApi } from "../api/api";
import { SSRDataContext, useSSRFetch } from "../context/SSRDataContext";

const fetchSeoForPage = async (page) => {
  let res = await getSEOByPageApi(page);
  if (
    res == null &&
    page !== "shop" &&
    String(page).startsWith("shop-category-")
  ) {
    res = await getSEOByPageApi("shop");
  }
  return res;
};

const SEO = ({ page }) => {
  const ssrData = useContext(SSRDataContext);
  const [seo] = useSSRFetch(page ? `seo:${page}` : null, () => fetchSeoForPage(page), [page]);

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : ssrData?.__currentUrl;

  return (
    <Helmet>
      <title>{seo?.meta_title || "Default Title"}</title>

      <meta
        name="description"
        content={seo?.meta_description || "Default description"}
      />

      <meta name="keywords" content={seo?.meta_keywords || ""} />

      {(seo?.canonical_url || currentUrl) && (
        <link rel="canonical" href={seo?.canonical_url || currentUrl} />
      )}

      {/* OG */}
      <meta property="og:title" content={seo?.og_title || ""} />
      <meta property="og:description" content={seo?.og_description || ""} />
      {seo?.og_image && (
        <meta
          property="og:image"
          content={`https://api.shop99.co.in/uploads/${seo.og_image}`}
        />
      )}
    </Helmet>
  );
};

export default SEO;