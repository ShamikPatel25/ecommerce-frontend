'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function GenerateCatalogPage() {
  const router = useRouter();
  const params = useParams();
  const user = useAuthStore((state) => state.user);
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  const [attributes, setAttributes] = useState([]);
  
  // Mode: false = Multiple (checkbox), true = Single (radio)
  const [multipleValueMode, setMultipleValueMode] = useState(false);
  
  // Selected values per attribute
  const [selections, setSelections] = useState({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProductData();
  }, [user, productId]);

  const fetchProductData = async () => {
    try {
      const response = await productAPI.get(productId);
      const productData = response.data;
      
      setProduct(productData);
      
      // Get selected attributes with their values
      const attrs = productData.selected_attributes || [];
      setAttributes(attrs);
      
      // Initialize selections
      const initialSelections = {};
      attrs.forEach(attr => {
        initialSelections[attr.attribute] = [];
      });
      setSelections(initialSelections);
      
    } catch (error) {
      console.error('Fetch product error:', error);
      toast.error('Failed to load product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleValueToggle = (attributeId, valueId) => {
    setSelections(prev => {
      const current = prev[attributeId] || [];
      
      if (multipleValueMode) {
        // Multiple selection mode (checkbox)
        if (current.includes(valueId)) {
          return {
            ...prev,
            [attributeId]: current.filter(id => id !== valueId)
          };
        } else {
          return {
            ...prev,
            [attributeId]: [...current, valueId]
          };
        }
      } else {
        // Single selection mode (radio)
        return {
          ...prev,
          [attributeId]: [valueId]
        };
      }
    });
  };

  const generateCombinations = () => {
    // Get all selected values per attribute
    const attributeValues = Object.entries(selections)
      .map(([attrId, valueIds]) => ({
        attributeId: parseInt(attrId),
        values: valueIds
      }))
      .filter(item => item.values.length > 0);

    if (attributeValues.length === 0) {
      toast.error('Please select at least one value for each attribute');
      return [];
    }

    // Check if all attributes have selections
    const missingAttributes = attributes.filter(attr => 
      !selections[attr.attribute] || selections[attr.attribute].length === 0
    );

    if (missingAttributes.length > 0) {
      toast.error(`Please select values for: ${missingAttributes.map(a => a.attribute_name).join(', ')}`);
      return [];
    }

    if (!multipleValueMode) {
      // Single mode: Create only ONE combination
      const combination = attributeValues.flatMap(item => item.values);
      return [{ attribute_values: combination }];
    } else {
      // Multiple mode: Generate all combinations (Cartesian product)
      const valueSets = attributeValues.map(item => item.values);
      
      const cartesian = (...arrays) => {
        return arrays.reduce((acc, curr) => {
          return acc.flatMap(a => curr.map(c => [...a, c]));
        }, [[]]);
      };
      
      const combinations = cartesian(...valueSets);
      return combinations.map(combo => ({ attribute_values: combo }));
    }
  };

  const handleGenerateCatalog = async () => {
    const combinations = generateCombinations();
    
    if (combinations.length === 0) {
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await productAPI.generateCatalog(productId, {
        single_catalog_mode: !multipleValueMode,
        selected_combinations: combinations
      });

      toast.success(`✅ Generated ${combinations.length} variant(s)!`);
      router.push('/products');
      
    } catch (error) {
      console.error('Generate catalog error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate catalog');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedCombinations = generateCombinations();
  const totalVariants = selectedCombinations.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/products')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Products
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Generate Product Catalog</h1>
          <p className="text-gray-500 mt-1">
            Product: <strong>{product?.name}</strong>
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Selection Mode</h2>
              <p className="text-sm text-gray-500 mt-1">
                {multipleValueMode 
                  ? '✅ Multiple values per attribute (generates all combinations)'
                  : '⭕ Single value per attribute (generates one variant)'
                }
              </p>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => {
                setMultipleValueMode(!multipleValueMode);
                // Reset selections when mode changes
                const resetSelections = {};
                attributes.forEach(attr => {
                  resetSelections[attr.attribute] = [];
                });
                setSelections(resetSelections);
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                multipleValueMode ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  multipleValueMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Attribute Selection */}
        <div className="space-y-6">
          {attributes.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <span className="text-6xl">🏷️</span>
              <h3 className="text-xl font-semibold text-gray-900 mt-4">No attributes selected</h3>
              <p className="text-gray-500 mt-2">Go back and select attributes first</p>
            </div>
          ) : (
            attributes.map((attr) => (
              <div key={attr.id} className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {attr.attribute_name}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({attr.attribute_values?.length || 0} values)
                  </span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {attr.attribute_values?.map((val) => {
                    const isSelected = selections[attr.attribute]?.includes(val.id);
                    
                    return (
                      <button
                        key={val.id}
                        onClick={() => handleValueToggle(attr.attribute, val.id)}
                        className={`p-4 border-2 rounded-lg text-center transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {multipleValueMode ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 pointer-events-none"
                            />
                          ) : (
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 pointer-events-none"
                            />
                          )}
                          <span className="font-medium">{val.value}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preview & Generate */}
        {attributes.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Preview
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {totalVariants === 0 
                    ? 'Select values to generate variants'
                    : `Will generate ${totalVariants} variant${totalVariants !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              
              <button
                onClick={handleGenerateCatalog}
                disabled={submitting || totalVariants === 0}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Generating...' : `Generate ${totalVariants} Variant${totalVariants !== 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Selected Values Summary */}
            {totalVariants > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Values:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selections).map(([attrId, valueIds]) => {
                    const attr = attributes.find(a => a.attribute === parseInt(attrId));
                    return valueIds.map(valueId => {
                      const value = attr?.attribute_values?.find(v => v.id === valueId);
                      return value ? (
                        <span key={`${attrId}-${valueId}`} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {attr.attribute_name}: {value.value}
                        </span>
                      ) : null;
                    });
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}