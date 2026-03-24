import { Settings } from '@/components/settings/Settings'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure system settings and integrations
          </p>
        </div>
      </div>
      
      <Settings />
    </div>
  )
}