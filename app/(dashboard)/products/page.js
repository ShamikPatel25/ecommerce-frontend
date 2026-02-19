'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productAPI, categoryAPI, attributeAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function ProductsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '', sku: '', price: '', compare_at_price: '',
    stock: 0, category: '', product_type: 'single',
    is_active: true, is_featured: false,
  });
  
  // Catalog-specific state
  const [showAttributeSelection, setShowAttributeSelection] = useState(false);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [tempProductId, setTempProductId] = useState(null);
  const tempProductIdRef = useRef(null); // Use ref for reliable storage

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productAPI.list(),
        categoryAPI.list(),
      ]);
      
      const prodData = prodRes.data;
      if (Array.isArray(prodData)) {
        setProducts(prodData);
      } else if (prodData?.results && Array.isArray(prodData.results)) {
        setProducts(prodData.results);
      } else {
        setProducts([]);
      }
      
      const catData = catRes.data;
      if (Array.isArray(catData)) {
        setCategories(catData);
      } else if (catData?.results && Array.isArray(catData.results)) {
        setCategories(catData.results);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load products');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attributes when category changes
  const fetchAttributesForCategory = async (categoryId) => {
    if (!categoryId) {
      setAvailableAttributes([]);
      return;
    }
    
    try {
      console.log('🔍 Fetching attributes for category:', categoryId); // Debug
      
      const response = await attributeAPI.byCategory(categoryId);
      console.log('✅ Attributes response:', response.data); // Debug
      
      // Handle different response formats
      let attrs = [];
      if (Array.isArray(response.data)) {
        attrs = response.data;
      } else if (response.data?.attributes && Array.isArray(response.data.attributes)) {
        attrs = response.data.attributes;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        attrs = response.data.data;
      }
      
      console.log('📊 Parsed attributes:', attrs); // Debug
      setAvailableAttributes(attrs);
      
    } catch (error) {
      console.error('❌ Fetch attributes error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error URL:', error.config?.url);
      
      if (error.response?.status === 404) {
        toast.error('No attributes found for this category');
      } else {
        toast.error('Failed to load attributes');
      }
      setAvailableAttributes([]);
    }
  };

  const handleCreate = () => {
    setEditProduct(null);
    setFormData({
      name: '', sku: '', price: '', compare_at_price: '',
      stock: 0, category: '', product_type: 'single',
      is_active: true, is_featured: false,
    });
    setShowModal(true);
    setShowAttributeSelection(false);
    setSelectedAttributes([]);
  };

  const handleEdit = (p) => {
    setEditProduct(p);
    setFormData({
      name: p.name, sku: p.sku, price: p.price,
      compare_at_price: p.compare_at_price || '',
      stock: p.stock, category: p.category || '',
      product_type: p.product_type,
      is_active: p.is_active, is_featured: p.is_featured,
    });
    setShowModal(true);
  };

  const handleCategoryChange = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    if (formData.product_type === 'catalog' && categoryId) {
      fetchAttributesForCategory(categoryId);
    }
  };

  const handleProductTypeChange = (type) => {
    setFormData({ ...formData, product_type: type });
    if (type === 'catalog' && formData.category) {
      fetchAttributesForCategory(formData.category);
    } else {
      setAvailableAttributes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.sku.trim()) {
      toast.error('SKU is required');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    if (formData.product_type === 'catalog' && !formData.category) {
      toast.error('Please select a category for catalog products');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const data = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        price: parseFloat(formData.price).toFixed(2),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price).toFixed(2) : null,
        stock: parseInt(formData.stock) || 0,
        category: formData.category || null,
        product_type: formData.product_type,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };
      
      if (editProduct) {
        await productAPI.update(editProduct.id, data);
        toast.success('✅ Product updated!');
        setShowModal(false);
        fetchData();
      } else {
        // ========== CREATE PRODUCT ==========
        console.log('📤 STEP 1: Creating product with data:', data);
        
        const response = await productAPI.create(data);
        
        console.log('📤 STEP 2: Full response object:', response);
        console.log('📤 STEP 3: Response.data:', response.data);
        console.log('📤 STEP 4: Response.data type:', typeof response.data);
        console.log('📤 STEP 5: Response.data keys:', Object.keys(response.data || {}));
        console.log('📤 STEP 6: Response status:', response.status);
        console.log('📤 STEP 7: Response headers:', response.headers);
        
        // Extract product ID with multiple fallbacks
        let productId = null;
        
        // Check all possible ID field names
        if (response.data?.id) {
          productId = response.data.id;
          console.log('✅ Found ID at response.data.id:', productId);
        } else if (response.data?.pk) {
          productId = response.data.pk;
          console.log('✅ Found ID at response.data.pk:', productId);
        } else if (response.data?.product_id) {
          productId = response.data.product_id;
          console.log('✅ Found ID at response.data.product_id:', productId);
        } else if (response.data?.data?.id) {
          productId = response.data.data.id;
          console.log('✅ Found ID at response.data.data.id:', productId);
        } else if (response.data?.product?.id) {
          productId = response.data.product.id;
          console.log('✅ Found ID at response.data.product.id:', productId);
        } else {
          // Backend didn't return ID, fetch products and find by SKU
          console.warn('⚠️ ID not in response, fetching product by SKU...');
          console.log('🔍 Looking for SKU:', data.sku);
          
          try {
            const productsResponse = await productAPI.list();
            const productsList = Array.isArray(productsResponse.data) 
              ? productsResponse.data 
              : productsResponse.data.results || [];
            
            console.log('📋 Fetched products:', productsList.length);
            
            const foundProduct = productsList.find(p => p.sku === data.sku);
            
            if (foundProduct?.id) {
              productId = foundProduct.id;
              console.log('✅ Found product by SKU, ID:', productId);
            } else {
              console.error('❌ Could not find created product by SKU');
              console.error('❌ Expected SKU:', data.sku);
              console.error('❌ Available products:', productsList.map(p => ({ id: p.id, sku: p.sku })));
              toast.error('Product created but ID not found. Please refresh.');
              setShowModal(false);
              fetchData();
              setSubmitting(false);
              return;
            }
          } catch (fetchError) {
            console.error('❌ Error fetching products after create:', fetchError);
            toast.error('Product created but ID not found. Please refresh.');
            setShowModal(false);
            fetchData();
            setSubmitting(false);
            return;
          }
        }
        
        console.log('✅ STEP 6: Extracted product ID:', productId);
        console.log('✅ STEP 7: Product type:', formData.product_type);
        
        toast.success('✅ Product created!');
        
        // If catalog type, show attribute selection
        if (formData.product_type === 'catalog') {
          console.log('🔄 STEP 8: Setting tempProductId to:', productId);
          setTempProductId(productId);
          tempProductIdRef.current = productId; // Store in ref for reliable access
          
          console.log('🔄 STEP 9: Closing modal');
          setShowModal(false);
          
          console.log('🔄 STEP 10: Fetching attributes for category:', formData.category);
          await fetchAttributesForCategory(formData.category);
          
          console.log('🔄 STEP 11: Opening attribute selection modal');
          setShowAttributeSelection(true);
          
          // Verify state was set
          console.log('✅ STEP 12: tempProductId should now be:', productId);
          console.log('✅ STEP 13: tempProductIdRef.current:', tempProductIdRef.current);
        } else {
          setShowModal(false);
          fetchData();
        }
      }
    } catch (error) {
      console.error('❌ Product save error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        const firstError = Object.entries(errorData)[0];
        if (firstError) {
          const [field, messages] = firstError;
          const message = Array.isArray(messages) ? messages[0] : messages;
          toast.error(`${field}: ${message}`);
        }
      } else {
        toast.error('Failed to save product');
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleAttributeToggle = (attrId) => {
    setSelectedAttributes(prev => {
      if (prev.includes(attrId)) {
        return prev.filter(id => id !== attrId);
      } else {
        return [...prev, attrId];
      }
    });
  };

  const handleProceedToCatalogGeneration = async () => {
    console.log('═══════════════════════════════════════');
    console.log('🚀 PROCEED TO CATALOG GENERATION CLICKED');
    console.log('═══════════════════════════════════════');
    
    // Use ref value as primary source
    const productId = tempProductIdRef.current || tempProductId;
    
    console.log('📊 tempProductId (state):', tempProductId);
    console.log('📊 tempProductIdRef.current:', tempProductIdRef.current);
    console.log('📊 Using productId:', productId);
    console.log('📊 productId type:', typeof productId);
    console.log('📊 Selected attributes:', selectedAttributes);
    console.log('📊 Selected attributes count:', selectedAttributes.length);
    console.log('═══════════════════════════════════════');
    
    if (selectedAttributes.length === 0) {
      toast.error('Please select at least one attribute');
      return;
    }

    if (!productId || productId === 'undefined') {
      console.error('❌ CRITICAL: productId is invalid!');
      console.error('❌ Value:', productId);
      console.error('❌ Type:', typeof productId);
      toast.error('Product ID is missing. Please try creating the product again.');
      return;
    }

    try {
      console.log('📤 Calling selectAttributes API...');
      console.log('📤 Product ID:', productId);
      console.log('📤 Attribute IDs:', selectedAttributes);
      
      const response = await productAPI.selectAttributes(productId, selectedAttributes);
      
      console.log('✅ Select attributes response:', response);
      
      toast.success('Attributes saved!');
      
      console.log('🔄 Navigating to generate-catalog page...');
      router.push(`/products/${productId}/generate-catalog`);
    } catch (error) {
      console.error('═══════════════════════════════════════');
      console.error('❌ ERROR SAVING ATTRIBUTES');
      console.error('═══════════════════════════════════════');
      console.error('Error object:', error);
      console.error('Error response:', error.response?.data);
      console.error('Product ID used:', productId);
      console.error('Selected attributes:', selectedAttributes);
      console.error('═══════════════════════════════════════');
      toast.error('Failed to save attributes');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Deleted!');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const getCategoryName = (catId) =>
    categories.find((c) => c.id === catId)?.name || '—';

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 mt-1">Manage your product catalog</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Add Product
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl">📦</span>
              <h3 className="text-xl font-semibold text-gray-900 mt-4">No products yet</h3>
              <p className="text-gray-500 mt-2">Add your first product</p>
              <button onClick={handleCreate} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Add Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.isArray(products) && products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">📦</div>
                          <div>
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            {p.is_featured && <span className="text-xs text-yellow-600">⭐ Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{getCategoryName(p.category)}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">${p.price}</p>
                        {p.compare_at_price && (
                          <p className="text-xs text-gray-400 line-through">${p.compare_at_price}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.product_type === 'catalog' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {p.product_type === 'catalog' ? '📚 Catalog' : '📦 Single'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(p)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">✏️</button>
                          <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl">×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g. Samsung Galaxy S24" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g. SAM-S24-001" 
                    value={formData.sku} 
                    onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                    required 
                  />
                </div>

                {/* Price & Compare Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0.00" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Compare Price</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0.00" 
                      value={formData.compare_at_price} 
                      onChange={(e) => setFormData({...formData, compare_at_price: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category {formData.product_type === 'catalog' && <span className="text-red-500">*</span>}
                  </label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={formData.category} 
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required={formData.product_type === 'catalog'}
                  >
                    <option value="">Select Category</option>
                    {Array.isArray(categories) && categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                    ))}
                  </select>
                  {formData.product_type === 'catalog' && !formData.category && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ Category is required for catalog products</p>
                  )}
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Product Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      onClick={() => handleProductTypeChange('single')}
                      className={`p-4 border-2 rounded-lg text-left transition ${formData.product_type === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="text-2xl mb-2">📦</p>
                      <p className="font-semibold text-sm">Single Product</p>
                      <p className="text-xs text-gray-500">No variants needed</p>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleProductTypeChange('catalog')}
                      className={`p-4 border-2 rounded-lg text-left transition ${formData.product_type === 'catalog' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="text-2xl mb-2">📚</p>
                      <p className="font-semibold text-sm">Catalog</p>
                      <p className="text-xs text-gray-500">With variants (Size, Color, etc.)</p>
                    </button>
                  </div>
                </div>

                {/* Stock (only for single products) */}
                {formData.product_type === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0" 
                      value={formData.stock} 
                      onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                    />
                  </div>
                )}

                {/* Image Upload Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer">
                    <p className="text-gray-500 text-sm">📷 Click to upload image</p>
                    <p className="text-gray-400 text-xs mt-1">(Coming soon)</p>
                  </div>
                </div>

                {/* Active & Featured */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded" 
                      checked={formData.is_active} 
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded" 
                      checked={formData.is_featured} 
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} 
                    />
                    <span className="text-sm font-medium text-gray-700">⭐ Featured</span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Attribute Selection Modal (After creating catalog product) */}
        {showAttributeSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Select Attributes for Catalog</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose which attributes to use for product variants
                </p>
              </div>

              <div className="p-6">
                {availableAttributes.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-5xl">🏷️</span>
                    <p className="text-gray-600 mt-4">No attributes available for this category</p>
                    <p className="text-gray-400 text-sm mt-2">Please create attributes first</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableAttributes.map((attr) => (
                      <label
                        key={attr.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedAttributes.includes(attr.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded"
                          checked={selectedAttributes.includes(attr.id)}
                          onChange={() => handleAttributeToggle(attr.id)}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{attr.attribute_name}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {attr.attribute_values?.slice(0, 5).map((val, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {val.value}
                              </span>
                            ))}
                            {attr.attribute_values?.length > 5 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{attr.attribute_values.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {attr.values_count} values
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowAttributeSelection(false);
                    setSelectedAttributes([]);
                    setTempProductId(null);
                    tempProductIdRef.current = null;
                    fetchData();
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToCatalogGeneration}
                  disabled={selectedAttributes.length === 0}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Catalog →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}