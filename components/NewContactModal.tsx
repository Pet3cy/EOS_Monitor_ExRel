
import React, { useState } from 'react';
import { Contact } from '../types';
import { UserPlus, X, Save } from 'lucide-react';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    organization: '',
    notes: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newContact: Contact = {
      id: `c${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role || 'Member',
      organization: formData.organization || 'External',
      notes: formData.notes
    };

    onSave(newContact);

    // Reset form
    setFormData({
      name: '',
      email: '',
      role: '',
      organization: '',
      notes: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-blue-600" size={20} />
                Add New Contact
            </h3>
            <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name *</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full p-2.5 bg-slate-50 border rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
                        placeholder="e.g. Jane Doe"
                    />
                    {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address *</label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full p-2.5 bg-slate-50 border rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
                        placeholder="e.g. jane@example.com"
                    />
                     {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role / Title</label>
                    <input
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="e.g. Project Manager"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</label>
                    <input
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="e.g. Partner Org"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none"
                    placeholder="Additional context about this contact..."
                />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                >
                    <Save size={16} />
                    Save Contact
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
