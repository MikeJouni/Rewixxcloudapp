import Backend from "../../../Backend";

export const getProducts = async () => {
  try {
    console.log("Fetching products from backend...");
    const response = await Backend.get("api/products");
    console.log("Products response:", response);
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getProduct = (id) =>
  Backend.get(`api/products/${id}`);

export const createProduct = (product) =>
  Backend.post("api/products", product);
