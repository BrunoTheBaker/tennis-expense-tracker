'use client'

import { useState } from 'react'
import { CalendarIcon, PaperClipIcon } from '@heroicons/react/24/outline'

const categories = [
  'Maintenance',
  'Equipment', 
  'Utilities',
  'Events',
  'Staff',
  'Insurance',
  'Marketing',
  'Professional Services',
  'Other'
]

export function ExpenseForm() {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    date: '',
    vendor: '',
    reference: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
    alert('Expense submitted for approval!')
    
    // Reset form
    setFormData({
      description: '',
      category: '',
      amount: '',
      date: '',
      vendor: '',
      reference: '',
      notes: '',
    })
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="grid grid-cols-1 gap-6">
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <input
            type="text"
            name="description"
            id="description"
            required
            value={formData.description}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Brief description of the expense"
          />
        </div>

        {/* Category and Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              name="category"
              id="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                className="input-field pl-8"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Date and Vendor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="date"
                id="date"
                required
                value={formData.date}
                onChange={handleInputChange}
                className="input-field"
              />
              <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
              Vendor/Supplier
            </label>
            <input
              type="text"
              name="vendor"
              id="vendor"
              value={formData.vendor}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Company or person name"
            />
          </div>
        </div>

        {/* Reference */}
        <div>
          <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
            Reference Number
          </label>
          <input
            type="text"
            name="reference"
            id="reference"
            value={formData.reference}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Invoice number, receipt number, etc."
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            name="notes"
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={handleInputChange}
            className="input-field resize-none"
            placeholder="Additional details or context..."
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Attachments
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-tennis-green-600 hover:text-tennis-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-tennis-green-500"
                >
                  <span>Upload receipts or invoices</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept=".pdf,.jpg,.jpeg,.png" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, PNG, JPG up to 10MB each
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
        <button
          type="button"
          className="btn-secondary"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          Submit for Approval
        </button>
      </div>
    </form>
  )
}