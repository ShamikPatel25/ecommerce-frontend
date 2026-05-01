'use client';

import { useState } from 'react';

const tabs = [
  { id: 'admin', label: 'Admin Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'storefront', label: 'Storefront', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'mobile', label: 'Mobile View', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
];

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState('admin');

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 landing-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold mb-6 text-gray-900">
            Beautiful Interfaces, Ready to Use
          </h2>
          <p className="text-gray-600 text-lg">Professional storefronts and powerful admin tools.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white rounded-xl p-1.5 landing-shadow-soft gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'landing-gradient-bg text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Showcase Container */}
        <div className="bg-white rounded-3xl landing-shadow-hard overflow-hidden">
          <div
            className="landing-slider flex"
            style={{ transform: `translateX(-${tabs.findIndex(t => t.id === activeTab) * 100}%)` }}
          >
            {/* Admin Dashboard Slide */}
            <div className="min-w-full p-8">
              <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-100 p-4 border-b flex items-center">
                  <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="text-sm text-gray-600 font-mono">admin.yourbrand.com</div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-2">
                      <h3 className="text-xl font-bold mb-6 text-gray-900">Store Performance Overview</h3>
                      <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-gray-500">Interactive analytics chart</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-6 text-gray-900">Quick Actions</h3>
                      <div className="space-y-4">
                        <button className="w-full landing-gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition">
                          + New Store
                        </button>
                        <button className="w-full border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-medium hover:bg-purple-50 transition">
                          Manage Users
                        </button>
                        <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                          View Reports
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Storefront Slide */}
            <div className="min-w-full p-8">
              <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-100 p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full landing-gradient-bg mr-3" />
                    <div className="font-bold text-gray-900">YourBrand Store</div>
                  </div>
                  <div className="flex space-x-4 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[49.99, 79.99, 29.99].map((price, i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition">
                        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4" />
                        <h4 className="font-bold mb-2 text-gray-900">Product Name</h4>
                        <p className="text-gray-600 mb-3">${price}</p>
                        <button className="landing-gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile View Slide */}
            <div className="min-w-full p-8">
              <div className="flex justify-center">
                <div className="w-80 border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="bg-gray-800 h-8 flex items-center justify-center">
                    <div className="w-16 h-5 bg-gray-900 rounded-b-2xl" />
                  </div>
                  <div className="bg-white p-4 h-96">
                    <div className="flex justify-between items-center mb-6">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <div className="font-bold text-gray-900">YourBrand Store</div>
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                    </div>
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6" />
                    <h3 className="font-bold text-xl mb-2 text-gray-900">Premium Product</h3>
                    <p className="text-gray-600 mb-4">$99.99</p>
                    <button className="w-full landing-gradient-bg text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
