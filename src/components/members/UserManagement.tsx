'use client'

import { useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const members = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@tennisclub.com',
    role: 'Committee',
    permissions: ['expense_approval', 'budget_management', 'reports_view'],
    joinDate: '2022-03-15',
    lastLogin: '2024-01-14',
    status: 'active',
    phone: '+61 400 123 456'
  },
  {
    id: 2,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@tennisclub.com',
    role: 'Treasurer',
    permissions: ['expense_approval', 'budget_management', 'reports_view', 'financial_export'],
    joinDate: '2021-08-20',
    lastLogin: '2024-01-15',
    status: 'active',
    phone: '+61 400 789 012'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@tennisclub.com',
    role: 'Secretary',
    permissions: ['expense_create', 'reports_view'],
    joinDate: '2023-01-10',
    lastLogin: '2024-01-12',
    status: 'active',
    phone: '+61 400 345 678'
  },
  {
    id: 4,
    name: 'Emma Davis',
    email: 'emma.davis@tennisclub.com',
    role: 'Coach',
    permissions: ['expense_create', 'equipment_request'],
    joinDate: '2022-09-05',
    lastLogin: '2024-01-13',
    status: 'active',
    phone: '+61 400 901 234'
  },
  {
    id: 5,
    name: 'Tom Brown',
    email: 'tom.brown@tennisclub.com',
    role: 'Member',
    permissions: ['expense_create'],
    joinDate: '2023-06-12',
    lastLogin: '2024-01-10',
    status: 'inactive',
    phone: '+61 400 567 890'
  },
]

const roles = [
  {
    name: 'President',
    permissions: ['expense_approval', 'budget_management', 'reports_view', 'financial_export', 'user_management']
  },
  {
    name: 'Treasurer',
    permissions: ['expense_approval', 'budget_management', 'reports_view', 'financial_export']
  },
  {
    name: 'Committee',
    permissions: ['expense_approval', 'budget_management', 'reports_view']
  },
  {
    name: 'Secretary',
    permissions: ['expense_create', 'reports_view']
  },
  {
    name: 'Coach',
    permissions: ['expense_create', 'equipment_request']
  },
  {
    name: 'Member',
    permissions: ['expense_create']
  }
]

export function UserManagement() {
  const [selectedMember, setSelectedMember] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState('all')

  const filteredMembers = members.filter(member => {
    if (filter === 'all') return true
    if (filter === 'active') return member.status === 'active'
    if (filter === 'inactive') return member.status === 'inactive'
    return member.role.toLowerCase().includes(filter.toLowerCase())
  })

  const handleDeleteMember = (memberId: number) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      // In a real app, this would call an API
      console.log('Deleting member:', memberId)
      alert('Member removed successfully')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Members</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="committee">Committee</option>
            <option value="coach">Coaches</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Member
        </button>
      </div>

      {/* Members List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-tennis-green-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-tennis-green-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedMember(member.id)}
                        className="text-tennis-green-600 hover:text-tennis-green-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Member</h3>
              
              {(() => {
                const member = members.find(m => m.id === selectedMember)
                if (!member) return null
                
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        defaultValue={member.name}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        defaultValue={member.email}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select defaultValue={member.role} className="input-field">
                        {roles.map(role => (
                          <option key={role.name} value={role.name}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        defaultValue={member.phone}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                      <div className="space-y-2">
                        {member.permissions.map(permission => (
                          <div key={permission} className="flex items-center">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                              {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Member updated successfully')
                    setSelectedMember(null)
                  }}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Permissions Reference */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.name} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{role.name}</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {role.permissions.map((permission) => (
                  <li key={permission} className="flex items-center">
                    <span className="w-2 h-2 bg-tennis-green-400 rounded-full mr-2"></span>
                    {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}