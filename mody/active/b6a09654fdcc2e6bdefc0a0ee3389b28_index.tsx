·7"use client";

/**
 * TemplateProductGrid - Main export (composed from sub-components)
 * Phase: Refactored for file size compliance (<150 lines)
 * ~100 lines - AI friendly
 */

import { useState } from "react";
import { useBuilderMode } from "../BuilderModeContext";
import { ProductEditorModal } from "../builder/ProductEditorModal";
import { ProductCard } from "../ProductCard";
import { useProductGridState, BuilderProduct, Product } from "./useProductGridState";
import { ProductGridHeader } from "./ProductGridHeader";
import { ProductGridTabs } from "./ProductGridTabs";
import { ProductGridFilters } from "./ProductGridFilters";
import { filterByCategory, filterBySearch, filterByStatus } from "./productGridUtils";

interface TemplateProductGridProps {
    title?: string;
    columns?: number;
    count?: number;
    showTabs?: boolean;
    defaultCategory?: string;
    onTitleChange?: (value: string) => void;
}

export function TemplateProductGrid({
    title = "FEATURED PRODUCTS",
    columns = 3,
    count = 6,
    showTabs = true,
    onTitleChange,
}: TemplateProductGridProps = {}) {
    const { isBuilderMode, isMobilePreview } = useBuilderMode();
    const [editingProduct, setEditingProduct] = useState<BuilderProduct | null>(null);
    const [isNewProduct, setIsNewProduct] = useState(false);

    const {
        activeCategory, setActiveCategory,
        searchQuery, setSearchQuery,
        showDrafts, setShowDrafts,
        showArchived, setShowArchived,
        toast, showToast, isLoading,
        categoryTabs, displayProducts,
        updateProduct, createProduct, duplicateProduct, archiveProduct, restoreProduct, deleteProduct
    } = useProductGridState();

    // Apply all filters
    const filtered = filterByCategory(displayProducts, activeCategory);
    const searched = filterBySearch(filtered, searchQuery);
    const filteredByStatus = filterByStatus(searched, showDrafts, showArchived);
    const visibleProducts = count > 0 ? filteredByStatus.slice(0, count) : filteredByStatus;

    const handleEditClick = (product: BuilderProduct | Product) => {
        const existingImages = (product as BuilderProduct).images || [];
        const legacyImage = "image" in product ? product.image : (product as BuilderProduct).image_url;
        const images = existingImages.length > 0 ? existingImages : (legacyImage ? [{ url: legacyImage, is_primary: true }] : []);

        const bp: BuilderProduct = {
            id: product.id,
            name: product.name,
            name_ar: (product as BuilderProduct).name_ar,
            description: (product as BuilderProduct).description,
            description_ar: (product as BuilderProduct).description_ar,
            price: product.price,
            compare_at_price: "originalPrice" in product ? product.originalPrice : (product as BuilderProduct).compare_at_price,
            image_url: legacyImage,
            status: "active",
            inventory_quantity: (product as BuilderProduct).inventory_quantity || 0,
            sku: (product as BuilderProduct).sku,
            images
        };
        setEditingProduct(bp);
        setIsNewProduct(false);
    };

    const handleAddProduct = () => { setEditingProduct(null); setIsNewProduct(true); };

    const handleSave = async (data: Partial<BuilderProduct>) => {
        if (isNewProduct) { await createProduct(data); showToast("‚úì Product created. Synced to Dashboard."); }
        else if (editingProduct) { await updateProduct(editingProduct.id, data); showToast("‚úì Product updated. Changes synced to Dashboard."); }
        setEditingProduct(null); setIsNewProduct(false);
    };

    const handleArchive = async (id: string) => { await archiveProduct(id); showToast("‚úì Product archived."); };
    const handleRestore = async (id: string) => { await restoreProduct(id); showToast("‚úì Product restored to active."); };
    const handleDelete = async (id: string) => { await deleteProduct(id); showToast("‚úì Product deleted."); };
    const handleDuplicate = async (product: BuilderProduct) => {
        const result = await duplicateProduct(product);
        if (result) showToast("‚úì Product duplicated as draft.");
    };

    const gridClass = `grid ${isMobilePreview ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6`;

    return (
        <section className="bg-[#1a1a1a] py-16 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <ProductGridHeader title={title} isBuilderMode={isBuilderMode} onAddProduct={handleAddProduct} onTitleChange={onTitleChange} />
                {showTabs && <ProductGridTabs categories={categoryTabs} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />}
                {isBuilderMode && <ProductGridFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} showDrafts={showDrafts} onShowDraftsChange={setShowDrafts} showArchived={showArchived} onShowArchivedChange={setShowArchived} />}

                <div className={gridClass}>
                    {isLoading ? (
                        /* Skeleton loading state - prevents flicker */
                        Array.from({ length: count || 6 }).map((_, i) => (
                            <div key={i} className="bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-square bg-gray-700" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                                    <div className="h-5 bg-gray-700 rounded w-1/3" />
                                </div>
                            </div>
                        ))
                    ) : visibleProducts.length > 0 ? (
                        visibleProducts.map(product => <ProductCard key={(product as BuilderProduct).id} product={product as BuilderProduct} isBuilderMode={isBuilderMode} onEdit={() => handleEditClick(product as BuilderProduct)} onDuplicate={() => handleDuplicate(product as BuilderProduct)} onRestore={() => handleRestore((product as BuilderProduct).id)} />)
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            {searchQuery ? `No products found for "${searchQuery}"` : "No products in this category"}
                        </div>
                    )}
                </div>
            </div>

            <ProductEditorModal isOpen={!!editingProduct || isNewProduct} product={editingProduct} isNew={isNewProduct} onClose={() => { setEditingProduct(null); setIsNewProduct(false); }} onSave={handleSave} onArchive={handleArchive} onDelete={handleDelete} />
            {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 bg-gray-900/90 backdrop-blur text-white shadow-2xl rounded-full text-sm">{toast}</div>}
        </section>
    );
}

export default TemplateProductGrid;
õ *cascade08õÆ*cascade08ÆØ *cascade08Ø÷*cascade08÷Á *cascade08ÁÚ*cascade08Ú¿ *cascade08¿“*cascade08“‚ *cascade08‚Ú*cascade08Ú˝ *cascade08˝ã*cascade08ãø *cascade08øººú *cascade08úﬂ *cascade08ﬂ è$ *cascade08è$≠$*cascade08≠$Í& *cascade08Í&≠'*cascade08≠'ı' *cascade08ı'è.*cascade08è.ˆ/ *cascade08ˆ/µ0*cascade08µ0œ0 *cascade08œ0è1*cascade08è1·7 *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¨file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/TemplateProductGrid/index.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version