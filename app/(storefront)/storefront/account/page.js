'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { ADDRESS_LABEL_ICONS, ADDRESS_LABEL_OPTIONS } from '@/lib/addressConfig';
import { Mail, Phone, Loader2, MapPin, Plus, Pencil, Trash2, Check, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [originalForm, setOriginalForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ label: 'home', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'India' });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressErrors, setAddressErrors] = useState({});
  const [deleteAddressId, setDeleteAddressId] = useState(null);

  const customer = useStorefrontAuthStore((s) => s.customer);
  const setCustomer = useStorefrontAuthStore((s) => s.setCustomer);
  const { href } = useStorefrontPath();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, addressRes] = await Promise.all([
        storefrontAPI.getProfile(),
        storefrontAPI.getAddresses(),
      ]);
      setProfile(profileRes.data);
      setAddresses(addressRes.data?.results || (Array.isArray(addressRes.data) ? addressRes.data : []));
      const formData = {
        first_name: profileRes.data.first_name || '',
        last_name: profileRes.data.last_name || '',
        email: (profileRes.data.email || '').toLowerCase(),
        phone: profileRes.data.phone || '',
      };
      setForm(formData);
      setOriginalForm(formData);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if form has changes from original
  const hasChanges = useMemo(() => {
    return (
      form.first_name !== originalForm.first_name ||
      form.last_name !== originalForm.last_name ||
      form.email !== originalForm.email ||
      form.phone !== originalForm.phone
    );
  }, [form, originalForm]);

  const handleFirstNameChange = (e) => {
    const value = e.target.value.slice(0, 20);
    setForm({ ...form, first_name: value });
    if (value.length >= 20) {
      setFirstNameError('Maximum 20 characters allowed');
    } else {
      setFirstNameError('');
    }
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value.slice(0, 20);
    setForm({ ...form, last_name: value });
    if (value.length >= 20) {
      setLastNameError('Maximum 20 characters allowed');
    } else {
      setLastNameError('');
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
    setForm({ ...form, phone: value });
    if (value && value.length < 10) {
      setPhoneError('Phone number must be at least 10 digits');
    } else if (value && value.length > 15) {
      setPhoneError('Phone number cannot exceed 15 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase();
    setForm({ ...form, email: value });
    if (!value) {
      setEmailError('');
    } else if (!/^[^\s@]+@gmail\.com$/.test(value)) {
      setEmailError('Only @gmail.com email addresses are allowed');
    } else {
      setEmailError('');
    }
  };

  const handleProfileSave = async () => {
    if (!form.email || !form.email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@gmail\.com$/.test(form.email.toLowerCase())) {
      setEmailError('Only @gmail.com email addresses are allowed');
      return;
    }
    if (form.phone && form.phone.length < 10) {
      setPhoneError('Phone number must be at least 10 digits');
      return;
    }
    if (form.phone && form.phone.length > 15) {
      setPhoneError('Phone number cannot exceed 15 digits');
      return;
    }
    setSaving(true);
    try {
      const res = await storefrontAPI.updateProfile(form);
      setProfile(res.data);
      if (setCustomer) setCustomer(res.data);
      // Update originalForm to match current form so hasChanges becomes false
      setOriginalForm({ ...form });
      toast.success('Profile updated');
    } catch (err) {
      const msg = err?.response?.data?.email?.[0] || err?.response?.data?.detail || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openAddressForm = (address = null) => {
    setAddressErrors({});
    if (address) {
      setEditingAddress(address.id);
      const isStandardLabel = ['home', 'work', 'other'].includes(address.label.toLowerCase());
      setAddressForm({
        label: isStandardLabel ? address.label.toLowerCase() : 'other',
        customLabel: isStandardLabel ? '' : address.label,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || '',
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country || 'India',
      });
    } else {
      setEditingAddress('new');
      const usedLabels = addresses.map((a) => a.label.toLowerCase());
      const firstAvailable = ['home', 'work', 'other'].find(l => !usedLabels.includes(l)) || 'other';
      setAddressForm({ label: firstAvailable, customLabel: '', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'India' });
    }
  };

  const handlePostalCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAddressForm({ ...addressForm, postal_code: value });
    if (value && value.length !== 6) {
      setAddressErrors({ ...addressErrors, postal_code: 'Postal code must be exactly 6 digits' });
    } else {
      setAddressErrors({ ...addressErrors, postal_code: '' });
    }
  };

  const handleAddressSave = async () => {
    const errors = {};

    // Validate custom label for "other"
    if (addressForm.label === 'other') {
      if (!addressForm.customLabel?.trim()) {
        errors.label = 'Please enter a label';
      } else {
        const customLower = addressForm.customLabel.trim().toLowerCase();
        const usedLabels = addresses.map((a) => a.label.toLowerCase());
        if (usedLabels.includes(customLower) && editingAddress === 'new') {
          errors.label = 'This label already exists';
        }
      }
    }

    if (!addressForm.address_line_1.trim()) errors.address_line_1 = 'Address line 1 is required';
    if (!addressForm.city.trim()) errors.city = 'City is required';
    if (!addressForm.state.trim()) errors.state = 'State is required';
    if (!addressForm.postal_code) errors.postal_code = 'Postal code is required';
    else if (addressForm.postal_code.length !== 6) errors.postal_code = 'Postal code must be exactly 6 digits';
    if (!addressForm.country.trim()) errors.country = 'Country is required';

    if (Object.keys(errors).some(k => errors[k])) {
      setAddressErrors(errors);
      return;
    }

    // Prepare data for API - use customLabel if "other" is selected
    const dataToSend = {
      ...addressForm,
      label: addressForm.label === 'other' ? addressForm.customLabel.trim() : addressForm.label,
    };
    delete dataToSend.customLabel;

    setAddressSaving(true);
    try {
      if (editingAddress === 'new') {
        await storefrontAPI.createAddress(dataToSend);
        toast.success('Address added');
      } else {
        await storefrontAPI.updateAddress(editingAddress, dataToSend);
        toast.success('Address updated');
      }
      setEditingAddress(null);
      const res = await storefrontAPI.getAddresses();
      setAddresses(res.data?.results || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      const msg = err?.response?.data?.label?.[0] || err?.response?.data?.detail || 'Failed to save address';
      toast.error(msg);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleAddressDelete = async () => {
    if (!deleteAddressId) return;
    try {
      await storefrontAPI.deleteAddress(deleteAddressId);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteAddressId));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    } finally {
      setDeleteAddressId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const data = profile || customer || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header with Back Arrow */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href={href('/')}
            className="p-1 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-9">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Personal Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">First Name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={handleFirstNameChange}
                  maxLength={20}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background text-sm text-foreground transition-all placeholder:text-muted-foreground/60 ${firstNameError ? 'ring-2 ring-red-500/50' : ''}`}
                  placeholder="Enter first name"
                />
                {firstNameError && (
                  <p className="text-xs text-red-500 mt-1.5">{firstNameError}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Last Name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={handleLastNameChange}
                  maxLength={20}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background text-sm text-foreground transition-all placeholder:text-muted-foreground/60 ${lastNameError ? 'ring-2 ring-red-500/50' : ''}`}
                  placeholder="Enter last name"
                />
                {lastNameError && (
                  <p className="text-xs text-red-500 mt-1.5">{lastNameError}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleEmailChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background text-sm text-foreground transition-all placeholder:text-muted-foreground/60 ${emailError ? 'ring-2 ring-red-500/50' : ''}`}
                    placeholder="Enter email"
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-500 mt-1.5">{emailError}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background text-sm text-foreground transition-all placeholder:text-muted-foreground/60 ${phoneError ? 'ring-2 ring-red-500/50' : ''}`}
                    placeholder="Enter phone number"
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleProfileSave}
                disabled={saving || !hasChanges || !!phoneError || !!emailError || !!firstNameError || !!lastNameError}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* Addresses Card */}
        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Saved Addresses</h2>
            {editingAddress === null && (
              <button
                onClick={() => openAddressForm()}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add New
              </button>
            )}
          </div>

          <div className="p-6">
            {/* Address Form */}
            {editingAddress !== null && (() => {
              const usedLabels = addresses.map((a) => a.label.toLowerCase());
              const availableStandardLabels = ['home', 'work'].filter(l => !usedLabels.includes(l) || editingAddress !== 'new');
              const showOnlyCustomInput = availableStandardLabels.length === 0 && editingAddress === 'new';

              return (
              <div className="mb-6 p-4 bg-muted/30 rounded-xl">
                <h3 className="font-medium text-foreground mb-4 text-sm">
                  {editingAddress === 'new' ? 'Add New Address' : 'Edit Address'}
                </h3>

                {!showOnlyCustomInput && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ADDRESS_LABEL_OPTIONS.map((opt) => {
                      const isUsed = usedLabels.includes(opt.value.toLowerCase()) && editingAddress === 'new';
                      if (isUsed && opt.value !== 'other') return null;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setAddressForm({ ...addressForm, label: opt.value, customLabel: '' });
                            if (addressErrors.label) setAddressErrors({ ...addressErrors, label: '' });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            addressForm.label === opt.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(addressForm.label === 'other' || showOnlyCustomInput) && (
                  <div className="mb-4">
                    <input
                      value={addressForm.customLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddressForm({ ...addressForm, customLabel: val, label: 'other' });
                        const trimmed = val.trim().toLowerCase();
                        if (trimmed && usedLabels.includes(trimmed) && editingAddress === 'new') {
                          setAddressErrors({ ...addressErrors, label: 'This label already exists' });
                        } else {
                          setAddressErrors({ ...addressErrors, label: '' });
                        }
                      }}
                      placeholder="Label *"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-background border focus:ring-1 focus:ring-primary/20 text-sm ${addressErrors.label ? 'border-red-500' : 'border-border focus:border-primary'}`}
                    />
                    {addressErrors.label && <p className="text-xs text-red-500 mt-1">{addressErrors.label}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      value={addressForm.address_line_1}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, address_line_1: e.target.value });
                        if (addressErrors.address_line_1) setAddressErrors({ ...addressErrors, address_line_1: '' });
                      }}
                      placeholder="Address Line 1 *"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-background border focus:ring-1 focus:ring-primary/20 text-sm ${addressErrors.address_line_1 ? 'border-red-500' : 'border-border focus:border-primary'}`}
                    />
                    {addressErrors.address_line_1 && <p className="text-xs text-red-500 mt-1">{addressErrors.address_line_1}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      value={addressForm.address_line_2}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                      placeholder="Address Line 2"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      value={addressForm.city}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, city: e.target.value });
                        if (addressErrors.city) setAddressErrors({ ...addressErrors, city: '' });
                      }}
                      placeholder="City *"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-background border focus:ring-1 focus:ring-primary/20 text-sm ${addressErrors.city ? 'border-red-500' : 'border-border focus:border-primary'}`}
                    />
                    {addressErrors.city && <p className="text-xs text-red-500 mt-1">{addressErrors.city}</p>}
                  </div>
                  <div>
                    <input
                      value={addressForm.state}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, state: e.target.value });
                        if (addressErrors.state) setAddressErrors({ ...addressErrors, state: '' });
                      }}
                      placeholder="State *"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-background border focus:ring-1 focus:ring-primary/20 text-sm ${addressErrors.state ? 'border-red-500' : 'border-border focus:border-primary'}`}
                    />
                    {addressErrors.state && <p className="text-xs text-red-500 mt-1">{addressErrors.state}</p>}
                  </div>
                  <div>
                    <input
                      value={addressForm.postal_code}
                      onChange={handlePostalCodeChange}
                      maxLength={6}
                      placeholder="Postal Code *"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-background border focus:ring-1 focus:ring-primary/20 text-sm ${addressErrors.postal_code ? 'border-red-500' : 'border-border focus:border-primary'}`}
                    />
                    {addressErrors.postal_code && <p className="text-xs text-red-500 mt-1">{addressErrors.postal_code}</p>}
                  </div>
                  <div>
                    <input
                      value={addressForm.country}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, country: e.target.value });
                        if (addressErrors.country) setAddressErrors({ ...addressErrors, country: '' });
                      }}
                      placeholder="Country *"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-background border focus:ring-1 focus:ring-primary/20 text-sm ${addressErrors.country ? 'border-red-500' : 'border-border focus:border-primary'}`}
                    />
                    {addressErrors.country && <p className="text-xs text-red-500 mt-1">{addressErrors.country}</p>}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddressSave}
                    disabled={addressSaving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {addressSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditingAddress(null)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              );
            })()}

            {/* Address List */}
            {addresses.length === 0 && editingAddress === null ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No addresses saved yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add an address for faster checkout</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const Icon = ADDRESS_LABEL_ICONS[addr.label] || MapPin;
                  return (
                    <div
                      key={addr.id}
                      className="flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm capitalize">{addr.label}</span>
                            {addr.is_default && (
                              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {addr.address_line_1}
                            {addr.address_line_2 && `, ${addr.address_line_2}`}
                            <br />
                            {addr.city}, {addr.state} {addr.postal_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAddressForm(addr)}
                            className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteAddressId(addr.id)}
                            className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      {deleteAddressId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl max-w-sm w-full p-6 border border-border">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center text-foreground mb-2">Delete Address?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteAddressId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddressDelete}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
