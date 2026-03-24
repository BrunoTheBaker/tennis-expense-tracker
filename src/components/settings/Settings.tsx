'use client'

import { useState } from 'react'
import { ReckonIntegration } from './ReckonIntegration'
import { CogIcon, KeyIcon, BanknotesIcon, BellIcon } from '@heroicons/react/24/outline'

const tabs = [
  { id: 'general', name: 'General', icon: CogIcon },
  { id: 'integrations', name: 'Integrations', icon: KeyIcon },
  { id: 'financial', name: 'Financial', icon: BanknotesIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
]

export function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    clubName: 'Safety Bay Tennis Club',
    currency: 'AUD',
    fiscalYear: '01-01',
    approvalLimit: 1000,
    autoApprove: false,
    emailNotifications: true,
    slackWebhook: '',
    backupFrequency: 'weekly'
  })

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    alert('Settings saved successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="card">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-tennis-green-500 text-tennis-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  value={settings.clubName}
                  onChange={(e) => setSettings({...settings, clubName: e.target.value})}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="input-field"
                >
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiscal Year Start
                </label>
                <select
                  value={settings.fiscalYear}
                  onChange={(e) => setSettings({...settings, fiscalYear: e.target.value})}
                  className="input-field"
                >
                  <option value="01-01">January 1st</option>
                  <option value="04-01">April 1st</option>
                  <option value="07-01">July 1st</option>
                  <option value="10-01">October 1st</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Approval Limit (${settings.currency})
                </label>
                <input
                  type="number"
                  value={settings.approvalLimit}
                  onChange={(e) => setSettings({...settings, approvalLimit: parseInt(e.target.value)})}
                  className="input-field"
                  min="0"
                  step="50"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Expenses below this amount will be auto-approved
                </p>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoApprove}
                  onChange={(e) => setSettings({...settings, autoApprove: e.target.checked})}
                  className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable auto-approval for small expenses
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && <ReckonIntegration />}

      {activeTab === 'financial' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Financial Settings</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Budget Categories</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Court Maintenance',
                  'Equipment & Supplies',
                  'Utilities',
                  'Events & Tournaments',
                  'Staff & Professional Services',
                  'Insurance & Legal',
                  'Marketing & Promotion',
                  'Office & Administration'
                ].map((category) => (
                  <div key={category} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <button className="text-tennis-green-600 hover:text-tennis-green-700 text-sm">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-4 btn-secondary text-sm">
                Add Category
              </button>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Approval Workflow</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Under $100</span>
                    <p className="text-xs text-gray-500">Auto-approved</p>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700">$100 - $1,000</span>
                    <p className="text-xs text-gray-500">Committee approval required</p>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Over $1,000</span>
                    <p className="text-xs text-gray-500">Treasurer + President approval</p>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Settings</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Email Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Send email notifications for new expenses
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Weekly budget summary reports
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Budget threshold alerts (80% spent)
                  </span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Integration Alerts</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slack Webhook URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={settings.slackWebhook}
                    onChange={(e) => setSettings({...settings, slackWebhook: e.target.value})}
                    className="input-field"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Receive expense notifications in Slack
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Data Backup</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Frequency
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                  className="input-field w-auto"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Automatic backup to cloud storage
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="btn-primary"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}