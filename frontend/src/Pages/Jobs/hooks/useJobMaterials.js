import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as productService from "../services/productService";
import { useMemo } from "react";
import * as jobService from "../services/jobService";

export const useJobMaterials = () => {
  const [showingMaterialFormForJob, setShowingMaterialFormForJob] = useState(null);
  const [selectedJobForMaterial, setSelectedJobForMaterial] = useState(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);

  // Fetch products for material form
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
  });

  // Ensure products is always an array and handle the API response structure
  const products = useMemo(() => {
    console.log("Raw products data:", productsData);
    console.log("Products loading:", productsLoading);
    console.log("Products error:", productsError);
    if (!productsData) return [];
    // Handle different possible response structures
    if (Array.isArray(productsData)) return productsData;
    if (productsData.products && Array.isArray(productsData.products)) return productsData.products;
    if (productsData.content && Array.isArray(productsData.content)) return productsData.content;
    console.warn("Unexpected products data structure:", productsData);
    return [];
  }, [productsData, productsLoading, productsError]);

  const openMaterialForm = (job) => {
    setShowingMaterialFormForJob(job.id);
  };

  const closeMaterialForm = () => {
    setShowingMaterialFormForJob(null);
  };

  const handleBarcodeMaterial = async (jobId, materialData, addMaterialToJob, selectedJobForDetails, setSelectedJobForDetails, queryClient, searchTerm, page, pageSize, statusFilter) => {
    try {
      // Create a product for the barcode scanned material
      const productData = {
        name: materialData.name,
        description: materialData.description || `Product from barcode scan: ${materialData.name}`,
        unitPrice: materialData.unitPrice || materialData.price || 0,
        category: materialData.category || "Barcode Scan",
        supplier: materialData.supplier || "Unknown"
      };

      console.log("Creating product from barcode scan:", productData);
      const createdProduct = await productService.createProduct(productData);
      console.log("Product created:", createdProduct);

      // Invalidate products query to refresh the products list
      queryClient.invalidateQueries({ queryKey: ["products"] });

      // Now add the material to the job using the created product
      const materialDto = {
        productId: createdProduct.id,
        quantity: materialData.quantity || 1,
        unitPrice: materialData.unitPrice || materialData.price || 0,
        notes: materialData.notes || `Scanned from barcode: ${materialData.sku || 'N/A'}`
      };

      console.log("Adding barcode material through backend API:", materialDto);
      // Create sale and optimistically append to details view
      const sale = await addMaterialToJob.mutateAsync({
        jobId: jobId,
        material: materialDto
      });
      console.log("Barcode material added through backend API successfully");
      if (selectedJobForDetails && selectedJobForDetails.id === jobId && sale) {
        const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
        setSelectedJobForDetails({ ...selectedJobForDetails, sales: [...currentSales, sale] });
      }

      // Refresh the jobs data to show the new material
      // Use a more targeted invalidation to prevent job disappearance
      try {
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
      } catch (error) {
        console.error("Failed to invalidate queries:", error);
        // Don't let this error break the flow
      }
      
      // Update the selected job details if it's currently open
      if (selectedJobForDetails && selectedJobForDetails.id === jobId) {
        try {
          // Refetch the specific job to get updated data
          const updatedJob = await jobService.getJob(jobId);
          if (updatedJob) {
            setSelectedJobForDetails(updatedJob);
          }
        } catch (error) {
          console.error("Failed to refetch job:", error);
          // Don't let this error break the flow
        }
      }
      
      // Material added successfully (non-blocking)
      console.log("Material added successfully");
    } catch (error) {
      console.error("Failed to add barcode material:", error);
    }
  };

  const handleAddMaterial = (materialData, addMaterialToJob, selectedJobForDetails, setSelectedJobForDetails) => {
    if (showingMaterialFormForJob) {
      // Check if this is a barcode scanned material
      if (materialData.source === "Barcode Scan") {
        handleBarcodeMaterial(showingMaterialFormForJob, materialData, addMaterialToJob, selectedJobForDetails, setSelectedJobForDetails);
      } else {
        // Handle regular material addition and optimistically update
        addMaterialToJob.mutateAsync({
          jobId: showingMaterialFormForJob,
          material: materialData,
        }).then((sale) => {
          if (selectedJobForDetails && selectedJobForDetails.id === showingMaterialFormForJob && sale) {
            const currentSales = Array.isArray(selectedJobForDetails.sales) ? selectedJobForDetails.sales : [];
            setSelectedJobForDetails({ ...selectedJobForDetails, sales: [...currentSales, sale] });
          }
        }).catch((err) => console.error("Failed to add material:", err));
      }
      closeMaterialForm();
    }
  };

  return {
    showingMaterialFormForJob,
    selectedJobForMaterial,
    setSelectedJobForMaterial,
    showMaterialForm,
    setShowMaterialForm,
    products,
    productsLoading,
    productsError,
    openMaterialForm,
    closeMaterialForm,
    handleAddMaterial,
    handleBarcodeMaterial,
  };
};
