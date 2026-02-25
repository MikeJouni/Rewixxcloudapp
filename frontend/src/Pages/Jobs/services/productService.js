import Backend from "../../../Backend";

export const getProducts = async () => {
  try {
    const response = await Backend.post("api/products/list");
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getProduct = (id) =>
  Backend.get(`api/products/${id}`);

export const searchProductsByName = async (name) => {
  try {
    const response = await Backend.post("api/products/search", { name });
    
    if (Array.isArray(response)) {
      // Found products in search response
    } else {
      // Search response is not an array
    }
    
    return response;
  } catch (error) {
    console.error("Error searching products by name:", error);
    throw error;
  }
};

export const createProduct = (product) =>
  Backend.post("api/products", product);
