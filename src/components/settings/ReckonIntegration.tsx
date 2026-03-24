'use client'

import { useState } from 'react'
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export function ReckonIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected')
  const [credentials, setCredentials] = useState({
    apiKey: '',
    organisationId: '',
    environment: 'sandbox' as 'sandbox' | 'production'
  })
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncFrequency: 'daily',
    syncExpenses: true,
    syncBudgets: true,
    syncReports: false
  })

  const testConnection = async () => {
    setConnectionStatus('testing')
    
    // Simulate API test
    setTimeout(() => {
      if (credentials.apiKey && credentials.organisationId) {
        setConnectionStatus('connected')
        alert('Connection successful! Reckon integration is now active.')
      } else {
        setConnectionStatus('disconnected')
        alert('Connection failed. Please check your credentials.')
      }
    }, 2000)
  }

  const handleSync = async () => {
    if (connectionStatus !== 'connected') {
      alert('Please connect to Reckon first.')
      return
    }
    
    // In a real app, this would trigger the sync process
    alert('Manual sync initiated. This may take a few minutes...')
  }

  const exportToReckon = async () => {
    if (connectionStatus !== 'connected') {
      alert('Please connect to Reckon first.')
      return
    }
    
    // In a real app, this would export data to Reckon
    alert('Exporting expenses to Reckon...')
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Reckon Integration</h3>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' && (
              <>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <XCircleIcon className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Not Connected</span>
              </>
            )}
            {connectionStatus === 'testing' && (
              <>
                <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />
                <span className="text-sm text-yellow-600 font-medium">Testing...</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={credentials.apiKey}
                onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                className="input-field"
                placeholder="Enter your Reckon API key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in Reckon settings under API Management
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organisation ID *
              </label>
              <input
                type="text"
                value={credentials.organisationId}
                onChange={(e) => setCredentials({...credentials, organisationId: e.target.value})}
                className="input-field"
                placeholder="Your organisation identifier"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <select
              value={credentials.environment}
              onChange={(e) => setCredentials({...credentials, environment: e.target.value as 'sandbox' | 'production'})}
              className="input-field w-auto"
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production (Live)</option>
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              className="btn-secondary"
            >
              {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
            
            {connectionStatus === 'connected' && (
              <button
                onClick={() => setConnectionStatus('disconnected')}
                className="btn-secondary text-red-600 hover:text-red-700"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Synchronization Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={syncSettings.autoSync}
                onChange={(e) => setSyncSettings({...syncSettings, autoSync: e.target.checked})}
                className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                disabled={connectionStatus !== 'connected'}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Enable automatic synchronization
              </span>
            </label>
            
            {syncSettings.autoSync && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Frequency
                </label>
                <select
                  value={syncSettings.syncFrequency}
                  onChange={(e) => setSyncSettings({...syncSettings, syncFrequency: e.target.value})}
                  className="input-field w-auto"
                  disabled={connectionStatus !== 'connected'}
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Data to Synchronize</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.syncExpenses}
                  onChange={(e) => setSyncSettings({...syncSettings, syncExpenses: e.target.checked})}
                  className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                  disabled={connectionStatus !== 'connected'}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Expenses and Receipts
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.syncBudgets}
                  onChange={(e) => setSyncSettings({...syncSettings, syncBudgets: e.target.checked})}
                  className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                  disabled={connectionStatus !== 'connected'}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Budget Categories and Limits
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.syncReports}
                  onChange={(e) => setSyncSettings({...syncSettings, syncReports: e.target.checked})}
                  className="h-4 w-4 text-tennis-green-600 focus:ring-tennis-green-500 border-gray-300 rounded"
                  disabled={connectionStatus !== 'connected'}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Financial Reports (Read Only)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Manual Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Sync Now</h4>
            <p className="text-sm text-gray-600 mb-4">
              Manually sync all enabled data with Reckon
            </p>
            <button
              onClick={handleSync}
              disabled={connectionStatus !== 'connected'}
              className="btn-primary w-full text-sm"
            >
              Start Sync
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Export to Reckon</h4>
            <p className="text-sm text-gray-600 mb-4">
              Export current month expenses to Reckon
            </p>
            <button
              onClick={exportToReckon}
              disabled={connectionStatus !== 'connected'}
              className="btn-secondary w-full text-sm"
            >
              Export
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Import from Reckon</h4>
            <p className="text-sm text-gray-600 mb-4">
              Import chart of accounts and budgets
            </p>
            <button
              onClick={() => alert('Import feature coming soon...')}
              disabled={connectionStatus !== 'connected'}
              className="btn-secondary w-full text-sm"
            >
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Sync History */}
      {connectionStatus === 'connected' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Sync Activity</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Records
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    Manual Export
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    23 expenses
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Success
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(Date.now() - 86400000).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    Auto Sync
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    15 expenses, 5 budgets
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Success
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}