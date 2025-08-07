import { Injectable } from '@angular/core';

export interface SavedSetting {
  id: string;
  name: string;
  description?: string;
  config: any;
  timestamp: Date;
  version: string;
}

export interface SettingsHistory {
  settings: SavedSetting[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_KEY = 'doctor_prescription_settings';
  private readonly HISTORY_KEY = 'doctor_settings_history';
  private readonly MAX_HISTORY_SIZE = 20;

  constructor() { }

  /**
   * Save a new setting to localStorage
   */
  saveSetting(name: string, config: any, description?: string): SavedSetting {
    const setting: SavedSetting = {
      id: this.generateId(),
      name: name.trim(),
      description: description?.trim(),
      config: JSON.parse(JSON.stringify(config)), // Deep copy
      timestamp: new Date(),
      version: '1.0'
    };

    // Get existing history
    const history = this.getSettingsHistory();
    
    // Add new setting to the beginning
    history.settings.unshift(setting);
    
    // Limit history size
    if (history.settings.length > this.MAX_HISTORY_SIZE) {
      history.settings = history.settings.slice(0, this.MAX_HISTORY_SIZE);
    }
    
    history.lastUpdated = new Date();
    
    // Save to localStorage
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    
    return setting;
  }

  /**
   * Get all saved settings
   */
  getSettingsHistory(): SettingsHistory {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        history.settings = history.settings.map((setting: any) => ({
          ...setting,
          timestamp: new Date(setting.timestamp)
        }));
        history.lastUpdated = new Date(history.lastUpdated);
        return history;
      }
    } catch (error) {
      console.error('Error loading settings history:', error);
    }
    
    return {
      settings: [],
      lastUpdated: new Date()
    };
  }

  /**
   * Load a specific setting by ID
   */
  loadSetting(settingId: string): SavedSetting | null {
    const history = this.getSettingsHistory();
    const setting = history.settings.find(s => s.id === settingId);
    return setting || null;
  }

  /**
   * Delete a setting
   */
  deleteSetting(settingId: string): boolean {
    const history = this.getSettingsHistory();
    const initialLength = history.settings.length;
    
    history.settings = history.settings.filter(s => s.id !== settingId);
    history.lastUpdated = new Date();
    
    if (history.settings.length !== initialLength) {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
      return true;
    }
    
    return false;
  }

  /**
   * Update an existing setting
   */
  updateSetting(settingId: string, updates: Partial<SavedSetting>): SavedSetting | null {
    const history = this.getSettingsHistory();
    const settingIndex = history.settings.findIndex(s => s.id === settingId);
    
    if (settingIndex !== -1) {
      const updatedSetting = {
        ...history.settings[settingIndex],
        ...updates,
        timestamp: new Date() // Update timestamp
      };
      
      history.settings[settingIndex] = updatedSetting;
      history.lastUpdated = new Date();
      
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
      return updatedSetting;
    }
    
    return null;
  }

  /**
   * Clear all settings
   */
  clearAllSettings(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  /**
   * Export settings to JSON file
   */
  exportSettings(): void {
    const history = this.getSettingsHistory();
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import settings from JSON file
   */
  importSettings(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const importedHistory: SettingsHistory = JSON.parse(e.target.result);
          
          // Validate the imported data
          if (!importedHistory.settings || !Array.isArray(importedHistory.settings)) {
            throw new Error('Invalid settings file format');
          }
          
          // Convert timestamps and validate each setting
          importedHistory.settings = importedHistory.settings.map((setting: any) => ({
            ...setting,
            timestamp: new Date(setting.timestamp),
            id: setting.id || this.generateId() // Generate new ID if missing
          }));
          
          importedHistory.lastUpdated = new Date();
          
          // Merge with existing settings (avoid duplicates by ID)
          const existingHistory = this.getSettingsHistory();
          const existingIds = new Set(existingHistory.settings.map(s => s.id));
          
          const newSettings = importedHistory.settings.filter(s => !existingIds.has(s.id));
          const mergedSettings = [...existingHistory.settings, ...newSettings];
          
          // Limit to max size
          if (mergedSettings.length > this.MAX_HISTORY_SIZE) {
            mergedSettings.splice(this.MAX_HISTORY_SIZE);
          }
          
          const finalHistory: SettingsHistory = {
            settings: mergedSettings,
            lastUpdated: new Date()
          };
          
          localStorage.setItem(this.HISTORY_KEY, JSON.stringify(finalHistory));
          resolve(true);
          
        } catch (error) {
          console.error('Error importing settings:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get settings statistics
   */
  getSettingsStats(): { total: number; oldest: Date | null; newest: Date | null } {
    const history = this.getSettingsHistory();
    const settings = history.settings;
    
    if (settings.length === 0) {
      return { total: 0, oldest: null, newest: null };
    }
    
    const timestamps = settings.map(s => s.timestamp.getTime());
    return {
      total: settings.length,
      oldest: new Date(Math.min(...timestamps)),
      newest: new Date(Math.max(...timestamps))
    };
  }

  /**
   * Search settings by name or description
   */
  searchSettings(query: string): SavedSetting[] {
    const history = this.getSettingsHistory();
    const searchTerm = query.toLowerCase();
    
    return history.settings.filter(setting => 
      setting.name.toLowerCase().includes(searchTerm) ||
      (setting.description && setting.description.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Generate unique ID for settings
   */
  private generateId(): string {
    return 'setting_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
} 