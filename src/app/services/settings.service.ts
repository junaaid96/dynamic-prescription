import { Injectable } from '@angular/core';
import { SavedSetting, SavedSettingConfig, SettingsHistory } from '../models/section.model';

interface ExtendedSettingsHistory extends Omit<SettingsHistory, 'maxSettings'> {
  lastUpdated: Date;
}

interface StoredSetting {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  config?: unknown;
  timestamp?: unknown;
  version?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly historyKey = 'doctor_settings_history';
  private readonly maxHistorySize = 20;

  saveSetting(name: string, config: SavedSettingConfig, description?: string): SavedSetting {
    const setting: SavedSetting = {
      id: this.generateId(),
      name: name.trim(),
      description: description?.trim() || undefined,
      config: structuredClone(config),
      timestamp: new Date(),
      version: '1.0',
    };

    const history = this.getSettingsHistory();
    history.settings.unshift(setting);
    if (history.settings.length > this.maxHistorySize) {
      history.settings = history.settings.slice(0, this.maxHistorySize);
    }
    history.lastUpdated = new Date();
    this.persist(history);
    return setting;
  }

  getSettingsHistory(): ExtendedSettingsHistory {
    try {
      const stored = localStorage.getItem(this.historyKey);
      if (!stored) {
        return this.emptyHistory();
      }
      const parsed: unknown = JSON.parse(stored);
      if (!this.isRecord(parsed) || !Array.isArray(parsed['settings'])) {
        return this.emptyHistory();
      }

      const settings = parsed['settings']
        .map((entry) => this.parseSetting(entry))
        .filter((entry): entry is SavedSetting => entry !== null);
      const lastUpdated = this.parseDate(parsed['lastUpdated']) ?? new Date();
      return { settings, lastUpdated };
    } catch (error) {
      console.error('Error loading settings history:', error);
      return this.emptyHistory();
    }
  }

  loadSetting(settingId: string): SavedSetting | null {
    return this.getSettingsHistory().settings.find((setting) => setting.id === settingId) ?? null;
  }

  deleteSetting(settingId: string): boolean {
    const history = this.getSettingsHistory();
    const initialLength = history.settings.length;
    history.settings = history.settings.filter((setting) => setting.id !== settingId);
    if (history.settings.length === initialLength) {
      return false;
    }
    history.lastUpdated = new Date();
    this.persist(history);
    return true;
  }

  updateSetting(settingId: string, updates: Partial<SavedSetting>): SavedSetting | null {
    const history = this.getSettingsHistory();
    const settingIndex = history.settings.findIndex((setting) => setting.id === settingId);
    if (settingIndex === -1) {
      return null;
    }

    const current = history.settings[settingIndex];
    const updatedSetting: SavedSetting = {
      ...current,
      ...updates,
      id: current.id,
      timestamp: new Date(),
    };
    history.settings[settingIndex] = updatedSetting;
    history.lastUpdated = new Date();
    this.persist(history);
    return updatedSetting;
  }

  clearAllSettings(): void {
    localStorage.removeItem(this.historyKey);
  }

  getSettingsStats(): { total: number; oldest: Date | null; newest: Date | null } {
    const settings = this.getSettingsHistory().settings.filter((setting) => !Number.isNaN(setting.timestamp.getTime()));
    if (settings.length === 0) {
      return { total: 0, oldest: null, newest: null };
    }
    const timestamps = settings.map((setting) => setting.timestamp.getTime());
    return {
      total: settings.length,
      oldest: new Date(Math.min(...timestamps)),
      newest: new Date(Math.max(...timestamps)),
    };
  }

  searchSettings(query: string): SavedSetting[] {
    const searchTerm = query.toLowerCase();
    return this.getSettingsHistory().settings.filter((setting) =>
      setting.name.toLowerCase().includes(searchTerm) ||
      (setting.description?.toLowerCase().includes(searchTerm) ?? false),
    );
  }

  private persist(history: ExtendedSettingsHistory): void {
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  private emptyHistory(): ExtendedSettingsHistory {
    return { settings: [], lastUpdated: new Date() };
  }

  private parseSetting(entry: unknown): SavedSetting | null {
    if (!this.isRecord(entry)) {
      return null;
    }
    const stored = entry as StoredSetting;
    if (typeof stored.id !== 'string' || typeof stored.name !== 'string' || !this.isRecord(stored.config)) {
      return null;
    }
    const timestamp = this.parseDate(stored.timestamp);
    if (!timestamp) {
      return null;
    }
    return {
      id: stored.id,
      name: stored.name,
      description: typeof stored.description === 'string' ? stored.description : undefined,
      config: stored.config as unknown as SavedSettingConfig,
      timestamp,
      version: typeof stored.version === 'string' ? stored.version : '1.0',
    };
  }

  private parseDate(value: unknown): Date | null {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private generateId(): string {
    return `setting_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
