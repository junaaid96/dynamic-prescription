import { TestBed } from '@angular/core/testing';
import { SavedSettingConfig } from '../models/section.model';
import { SettingsService } from './settings.service';

function savedConfig(): SavedSettingConfig {
  return {
    layout: {
      pageType: 'A4',
      totalWidth: 8.27,
      totalHeight: 11.69,
      leftMargin: 0.1,
      rightMargin: 0.1,
      topMargin: 0.1,
      bottomMargin: 0.1,
      leftPadding: 0.1,
      rightPadding: 0.1,
      topPadding: 0.1,
      bottomPadding: 0.1,
      headerHeight: 1.5,
      footerHeight: 1.5,
      columnLayout: { column1: 50, column2: 0, column3: 50 },
      bodySection: {
        leftMargin: 0,
        rightMargin: 0,
        topMargin: 0,
        bottomMargin: 0,
        separatorLine: false,
        bottomLine: false,
      },
    },
    bodySections: [],
    headerColumns: [],
    footerColumns: [],
  };
}

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and retrieve settings', () => {
    const testConfig = savedConfig();
    const savedSetting = service.saveSetting('  Test Setting  ', testConfig, '  Test description  ');

    expect(savedSetting.name).toBe('Test Setting');
    expect(savedSetting.description).toBe('Test description');
    expect(savedSetting.config).toEqual(testConfig);
    expect(savedSetting.config).not.toBe(testConfig);
    expect(savedSetting.id).toBeTruthy();
    expect(savedSetting.timestamp).toBeInstanceOf(Date);
    expect(savedSetting.version).toBe('1.0');

    const history = service.getSettingsHistory();
    expect(history.settings.length).toBe(1);
    expect(history.settings[0]).toEqual(savedSetting);
  });

  it('should load a specific setting by ID', () => {
    const savedSetting = service.saveSetting('Test Setting', savedConfig(), 'Test description');
    expect(service.loadSetting(savedSetting.id)).toEqual(savedSetting);
    expect(service.loadSetting('missing')).toBeNull();
  });

  it('should delete a setting and reject unknown ids', () => {
    const savedSetting = service.saveSetting('Test Setting', savedConfig());
    expect(service.deleteSetting('missing')).toBe(false);
    expect(service.deleteSetting(savedSetting.id)).toBe(true);
    expect(service.getSettingsHistory().settings.length).toBe(0);
  });

  it('should update an existing setting without changing its id', () => {
    const savedSetting = service.saveSetting('Original', savedConfig());
    const updated = service.updateSetting(savedSetting.id, { name: 'Renamed' });
    expect(updated?.id).toBe(savedSetting.id);
    expect(updated?.name).toBe('Renamed');
    expect(service.loadSetting(savedSetting.id)?.name).toBe('Renamed');
    expect(service.updateSetting('missing', { name: 'Nope' })).toBeNull();
  });

  it('should search settings by name or description', () => {
    service.saveSetting('Cardiology Template', savedConfig(), 'For cardiology patients');
    service.saveSetting('Pediatric Template', savedConfig(), 'For pediatric patients');

    const results = service.searchSettings('CARDIOLOGY');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Cardiology Template');
    expect(service.searchSettings('pediatric').length).toBe(1);
  });

  it('should limit history size to the newest 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      service.saveSetting(`Setting ${i}`, savedConfig());
    }

    const history = service.getSettingsHistory();
    expect(history.settings.length).toBe(20);
    expect(history.settings[0].name).toBe('Setting 24');
  });

  it('should report statistics and clear history', () => {
    service.saveSetting('Only', savedConfig());
    const stats = service.getSettingsStats();
    expect(stats.total).toBe(1);
    expect(stats.oldest).toBeInstanceOf(Date);
    expect(stats.newest).toBeInstanceOf(Date);

    service.clearAllSettings();
    expect(service.getSettingsHistory().settings).toEqual([]);
    expect(service.getSettingsStats()).toEqual({ total: 0, oldest: null, newest: null });
  });

  it('should ignore corrupt history payloads', () => {
    localStorage.setItem('doctor_settings_history', '{not json');
    expect(service.getSettingsHistory().settings).toEqual([]);

    localStorage.setItem('doctor_settings_history', JSON.stringify({ settings: 'nope' }));
    expect(service.getSettingsHistory().settings).toEqual([]);

    localStorage.setItem('doctor_settings_history', JSON.stringify({
      settings: [{ id: 'a', name: 'Broken', timestamp: 'not-a-date', config: { layout: {} } }],
    }));
    expect(service.getSettingsHistory().settings).toEqual([]);
  });
});
