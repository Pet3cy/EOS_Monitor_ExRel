import React, { useState } from 'react';
import { X, UserPlus, Save, Briefcase, Building2, Mail, User } from 'lucide-react';
import { Contact } from '../types';

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        role: '',
        organization: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const newContact: Contact = {
      id: `c${crypto.randomUUID()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role || 'Member',
      organization: formData.organization || 'External',
      notes: formData.notes
    };

    onSave(newContact);
    onClose();
    // Reset form
    setFormData({
      name: '',
      email: '',
      role: '',
      organization: '',
      notes: ''
    });
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
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
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

        <div className="p-6 space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} /> Full Name <span className="text-red-500">*</span>
                </label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-3 bg-white border ${errors.name ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                    placeholder="e.g. Jane Doe"
                />
                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={14} /> Email Address <span className="text-red-500">*</span>
                </label>
                <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full p-3 bg-white border ${errors.email ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                    placeholder="e.g. jane@example.com"
                />
                {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase size={14} /> Role
                    </label>
                    <input
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="e.g. Project Manager"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 size={14} /> Organization
                    </label>
                    <input
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="e.g. ACME Corp"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none transition-all"
                    placeholder="Additional context about this contact..."
                />
            </div>
        </div>

        <div className="bg-slate-50 p-4 px-6 flex justify-end gap-3 border-t border-slate-100">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
            >
                Cancel
            </button>
            <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
                <Save size={18} /> Save Contact
            </button>
        </div>
      </div>
    </div>
  );
};
