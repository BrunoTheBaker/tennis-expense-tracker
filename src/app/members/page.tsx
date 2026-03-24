import { UserManagement } from '@/components/members/UserManagement'

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600 mt-2">
            Manage club members, roles, and permissions
          </p>
        </div>
      </div>
      
      <UserManagement />
    </div>
  )
}