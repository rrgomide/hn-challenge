export class LocalStorageManager {
  static setItem(key: string, value: any): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Failed to set localStorage item '${key}':`, error)
      return false
    }
  }

  static getItem<T = string>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      // If JSON parse fails, return as string
      try {
        return localStorage.getItem(key) as T
      } catch {
        console.warn(`Failed to get localStorage item '${key}':`, error)
        return null
      }
    }
  }

  static removeItem(key: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove localStorage item '${key}':`, error)
      return false
    }
  }

  static clear(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
      return false
    }
  }

  static removeItems(keys: string[]): void {
    keys.forEach(key => this.removeItem(key))
  }
}