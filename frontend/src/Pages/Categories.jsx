// frontend/src/Pages/Categories.jsx

import { getCategories } from "../services/categoryService";
import CategoryCard from "../components/CategoryCard";
import SEO from "../components/SEO";
import { useSSRFetch } from "../context/SSRDataContext";


const Categories = () => {

  const [rawCategories] = useSSRFetch("categories:list", getCategories, []);
  const categories = rawCategories || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO page="categories" />

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Heading */}
        <h2 className="text-3xl font-bold mb-10">
          Shop by Categories
        </h2>

        {/* Grid */}
        <div
          className="
            grid
            gap-6
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
          "
        >
          {categories?.map(cat => (
            <CategoryCard key={cat.id} data={cat} />
          ))}
        </div>

      </div>

    </div>
  );
};

export default Categories;
