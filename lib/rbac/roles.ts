export type Role = 'viewer' | 'editor' | 'publisher'

export interface UserRecord {
  password: string
  role: Role
}

export const USERS: Record<string, UserRecord> = {
  'viewer@example.com': { password: 'viewer123', role: 'viewer' },
  'editor@example.com': { password: 'editor123', role: 'editor' },
  'publisher@example.com': { password: 'publisher123', role: 'publisher' },
}

export function canEdit(role: Role): boolean {
  return role === 'editor' || role === 'publisher'
}

export function canPublish(role: Role): boolean {
  return role === 'publisher'
}
