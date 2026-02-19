'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';

export default function AttributesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [formData, setFormData] = useState({ category: '', name: '' });
  const [newValue, setNewValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [attrRes, catRes] = await Promise.all([
        attributeAPI.list(),
        categoryAPI.list(),
      ]);
      
      // Handle attributes
      const attrData = attrRes.data;
      if (Array.isArray(attrData)) {
        setAttributes(attrData);
      } else if (attrData?.results && Array.isArray(attrData.results)) {
        setAttributes(attrData.results);
      } else {
        setAttributes([]);
      }
      
      // Handle categories
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
      toast.error('Failed to load data');
      setAttributes([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await attributeAPI.create(formData);
      toast.success('Attribute created!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.name?.[0] || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddValue = async (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setSubmitting(true);
    try {
      await attributeAPI.addValue(selectedAttribute.id, newValue.trim());
      toast.success(`"${newValue}" added!`);
      setNewValue('');
      // Refresh to show new value
      const res = await attributeAPI.list();
      const data = res.data;
      const attrList = Array.isArray(data) ? data : (data.results || []);
      setAttributes(attrList);
      // Update selectedAttribute with fresh data
      const updated = attrList.find(a => a.id === selectedAttribute.id);
      if (updated) setSelectedAttribute(updated);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add value');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteValue = async (attributeId, valueId) => {
    if (!confirm('Delete this value?')) return;
    try {
      await attributeAPI.deleteValue(attributeId, valueId);
      toast.success('Value deleted!');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };
const handleDeleteAttribute = async (attributeId) => {
    const attribute = attributes.find(a => a.id === attributeId);
    const attributeName = attribute?.name || 'this attribute';
    
    if (!confirm(`Delete "${attributeName}"? All its values will be deleted too.`)) return;
    
    try {
      console.log('Deleting attribute ID:', attributeId); // Debug log
      
      const response = await attributeAPI.delete(attributeId);
      
      console.log('Delete response:', response); // Debug log
      
      toast.success(`✅ "${attributeName}" deleted!`);
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Delete attribute error:', error); // Debug log
      console.error('Error response:', error.response); // Debug log
      
      // Better error messages
      if (error.response?.status === 404) {
        toast.error('Attribute not found');
      } else if (error.response?.status === 403) {
        toast.error('Permission denied');
      } else if (error.response?.status === 401) {
        toast.error('Please login again');
        router.push('/login');
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Failed to delete attribute. Check console for details.');
      }
    }
  };

  const openValueModal = (attr) => {
    setSelectedAttribute(attr);
    setNewValue('');
    setShowValueModal(true);
  };

  const getCategoryName = (catId) =>
    categories.find((c) => c.id === catId)?.name || '';

  // Group by category - with safety check
  const grouped = Array.isArray(attributes) ? attributes.reduce((acc, attr) => {
    const name = getCategoryName(attr.category) || 'Uncategorized';
    if (!acc[name]) acc[name] = [];
    acc[name].push(attr);
    return acc;
  }, {}) : {};

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
            <h1 className="text-3xl font-bold text-gray-900">Attributes</h1>
            <p className="text-gray-500 mt-1">Define product attributes per category</p>
          </div>
          <button
            onClick={() => { setFormData({ category: '', name: '' }); setShowModal(true); }}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Add Attribute
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : attributes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
            <span className="text-6xl">🏷️</span>
            <h3 className="text-xl font-semibold text-gray-900 mt-4">No attributes yet</h3>
            <p className="text-gray-500 mt-2">e.g. Clothes → Size → 40, 42, 46</p>
            <button
              onClick={() => { setFormData({ category: '', name: '' }); setShowModal(true); }}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Attribute
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([catName, attrs]) => (
              <div key={catName} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex items-center gap-2">
                  <span>📁</span>
                  <h2 className="text-lg font-bold text-gray-900">{catName}</h2>
                  <span className="text-sm text-gray-400">({attrs.length} attributes)</span>
                </div>
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 w-48">Attribute</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Values</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 w-48">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attrs.map((attr) => (
                      <tr key={attr.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{attr.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {attr.values?.length > 0 ? (
                              attr.values.map((v) => (
                                <span key={v.id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                  {v.value}
                                  <button onClick={() => handleDeleteValue(attr.id, v.id)} className="text-blue-300 hover:text-red-500 ml-1 font-bold">×</button>
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm italic">No values yet</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openValueModal(attr)} 
                              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                            >
                              + Add Value
                            </button>
                            <button 
                              onClick={() => handleDeleteAttribute(attr.id)} 
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                              title="Delete Attribute"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Create Attribute Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold">Add Attribute</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl">×</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_path || c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attribute Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Size, Color, Material"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    💡 One at a time: first "Size", then separately "Color"
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Value Modal */}
        {showValueModal && selectedAttribute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold">Add Value</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {getCategoryName(selectedAttribute.category)} → <strong>{selectedAttribute.name}</strong>
                  </p>
                </div>
                <button onClick={() => setShowValueModal(false)} className="text-gray-400 text-2xl">×</button>
              </div>
              <div className="p-6">
                {/* Current Values */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Current Values:</p>
                  <div className="flex flex-wrap gap-2 min-h-8 p-3 bg-gray-50 rounded-lg">
                    {selectedAttribute.values?.length > 0 ? (
                      selectedAttribute.values.map((v) => (
                        <span key={v.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {v.value}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm italic">No values yet</span>
                    )}
                  </div>
                </div>

                {/* Add Value Form */}
                <form onSubmit={handleAddValue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Value *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={
                        selectedAttribute.name === 'Size' ? 'e.g. 30, 40, 42' :
                        selectedAttribute.name === 'Color' ? 'e.g. Black, Blue' : 'Enter value'
                      }
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      autoFocus
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Press "Add" for each value one at a time</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowValueModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Done</button>
                    <button type="submit" disabled={submitting || !newValue.trim()} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                      {submitting ? 'Adding...' : '+ Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}