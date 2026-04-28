'use client';

import { useState, useEffect, useCallback } from 'react';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { useRouter } from 'next/navigation';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { User, Mail, Phone, Calendar, Loader2, MapPin, Home, Briefcase, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const LABEL_ICONS = { home: Home, work: Briefcase, other: MapPin };
const LABEL_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
];

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [editingAddress, setEditingAddress] = useState(null); // null | 'new' | address id
  const [addressForm, setAddressForm] = useState({ label: 'home', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'India' });
  const [addressSaving, setAddressSaving] = useState(false);

  const customer = useStorefrontAuthStore((s) => s.customer);
  const accessToken = useStorefrontAuthStore((s) => s.accessToken);
  const setCustomer = useStorefrontAuthStore((s) => s.setCustomer);
  const isLoggedIn = !!(customer && accessToken);
  const router = useRouter();
  const { href } = useStorefrontPath();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, addressRes] = await Promise.all([
        storefrontAPI.getProfile(),
        storefrontAPI.getAddresses(),
      ]);
      setProfile(profileRes.data);
      setAddresses(addressRes.data || []);
      setForm({
        first_name: profileRes.data.first_name || '',
        last_name: profileRes.data.last_name || '',
        phone: profileRes.data.phone || '',
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isLoggedIn) { router.push(href('/')); return; }
    fetchData();
  }, [isMounted, isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const res = await storefrontAPI.updateProfile(form);
      setProfile(res.data);
      if (setCustomer) setCustomer(res.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const openAddressForm = (address = null) => {
    if (address) {
      setEditingAddress(address.id);
      setAddressForm({
        label: address.label,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || '',
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country || 'India',
      });
    } else {
      setEditingAddress('new');
      setAddressForm({ label: 'home', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'India' });
    }
  };

  const handleAddressSave = async () => {
    if (!addressForm.address_line_1 || !addressForm.city || !addressForm.state || !addressForm.postal_code) {
      toast.error('Please fill all required address fields');
      return;
    }
    setAddressSaving(true);
    try {
      if (editingAddress === 'new') {
        await storefrontAPI.createAddress(addressForm);
        toast.success('Address added');
      } else {
        await storefrontAPI.updateAddress(editingAddress, addressForm);
        toast.success('Address updated');
      }
      setEditingAddress(null);
      const res = await storefrontAPI.getAddresses();
      setAddresses(res.data || []);
    } catch (err) {
      const msg = err?.response?.data?.label?.[0] || err?.response?.data?.detail || 'Failed to save address';
      toast.error(msg);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleAddressDelete = async (id) => {
    try {
      await storefrontAPI.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const data = profile || customer || {};
  const joinDate = data.date_joined ? new Date(data.date_joined).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-10 space-y-2">
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
          <User className="w-4 h-4" /> My Account
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account information and addresses</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black shrink-0">
            {(data.first_name || data.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">{data.first_name || ''} {data.last_name || ''}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {data.email}</span>
              {joinDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {joinDate}</span>}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">First Name</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Last Name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground transition-all"
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        <button
          onClick={handleProfileSave}
          disabled={saving}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Profile
        </button>
      </div>

      {/* Addresses Section */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Saved Addresses
          </h2>
          {editingAddress === null && (
            <button onClick={() => openAddressForm()} className="flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-80 transition-opacity">
              <Plus className="w-4 h-4" /> Add Address
            </button>
          )}
        </div>

        {/* Address Form */}
        {editingAddress !== null && (
          <div className="mb-6 p-5 bg-background border border-border rounded-2xl">
            <h3 className="font-bold text-foreground mb-4">{editingAddress === 'new' ? 'New Address' : 'Edit Address'}</h3>

            <div className="flex gap-2 mb-4">
              {LABEL_OPTIONS.map((opt) => {
                const usedLabels = addresses.map((a) => a.label);
                const isUsed = usedLabels.includes(opt.value) && editingAddress === 'new';
                return (
                  <button
                    key={opt.value}
                    disabled={isUsed}
                    onClick={() => setAddressForm({ ...addressForm, label: opt.value })}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                      addressForm.label === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isUsed
                          ? 'opacity-40 cursor-not-allowed border-border text-muted-foreground'
                          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <input value={addressForm.address_line_1} onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })} placeholder="Address Line 1 *" className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground" />
              </div>
              <div className="sm:col-span-2">
                <input value={addressForm.address_line_2} onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })} placeholder="Address Line 2" className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground" />
              </div>
              <input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City *" className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground" />
              <input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State *" className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground" />
              <input value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} placeholder="Postal Code *" className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground" />
              <input value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} placeholder="Country" className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium text-foreground" />
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleAddressSave} disabled={addressSaving} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {addressSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
              <button onClick={() => setEditingAddress(null)} className="px-5 py-2.5 border border-border rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Address Cards */}
        {addresses.length === 0 && editingAddress === null ? (
          <p className="text-muted-foreground text-sm text-center py-8">No saved addresses yet. Add one to speed up checkout.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => {
              const Icon = LABEL_ICONS[addr.label] || MapPin;
              return (
                <div key={addr.id} className="p-4 bg-background border border-border rounded-2xl relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground text-sm capitalize">{addr.label}</span>
                    {addr.is_default && <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {addr.address_line_1}
                    {addr.address_line_2 && <>, {addr.address_line_2}</>}<br />
                    {addr.city}, {addr.state} {addr.postal_code}<br />
                    {addr.country}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openAddressForm(addr)} className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleAddressDelete(addr.id)} className="text-xs font-bold text-red-500 hover:opacity-80 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
