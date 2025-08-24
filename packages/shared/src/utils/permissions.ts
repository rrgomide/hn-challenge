import { UserRole } from '../types/user'
import { Snippet } from '../types/snippet'

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: UserRole[] = ['user', 'moderator', 'admin']

/**
 * Checks if a user role has at least the required permission level
 * @param userRole The user's role
 * @param requiredRole The minimum required role
 * @returns true if the user has sufficient permissions
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  
  return userIndex >= requiredIndex
}

/**
 * Checks if a user can read a snippet
 * @param snippet The snippet to check
 * @param userId The user's ID
 * @param userRole The user's role
 * @returns true if the user can read the snippet
 */
export function canReadSnippet(
  snippet: Pick<Snippet, 'ownerId' | 'isPublic'>,
  userId: string,
  userRole: UserRole
): boolean {
  // Owner can always read
  if (snippet.ownerId === userId) return true
  
  // Public snippets can be read by anyone
  if (snippet.isPublic) return true
  
  // Moderators and admins can read all snippets
  return hasPermission(userRole, 'moderator')
}

/**
 * Checks if a user can write (modify/delete) a snippet
 * @param snippet The snippet to check
 * @param userId The user's ID
 * @param userRole The user's role
 * @returns true if the user can write the snippet
 */
export function canWriteSnippet(
  snippet: Pick<Snippet, 'ownerId'>,
  userId: string,
  userRole: UserRole
): boolean {
  // Owner can always write
  if (snippet.ownerId === userId) return true
  
  // Moderators and admins can write all snippets
  return hasPermission(userRole, 'moderator')
}

/**
 * Checks if a user can manage other users (admin only)
 * @param userRole The user's role
 * @returns true if the user can manage users
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin')
}

/**
 * Gets all roles that are equal or lower than the given role
 * @param userRole The user's role
 * @returns Array of roles the user can assign
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  return ROLE_HIERARCHY.slice(0, userIndex + 1)
}