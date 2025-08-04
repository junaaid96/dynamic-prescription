import { TestBed } from '@angular/core/testing';
import { SettingsService, SavedSetting } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and retrieve settings', () => {
    const testConfig = { test: 'data' };
    const savedSetting = service.saveSetting('Test Setting', testConfig, 'Test description');
    
    expect(savedSetting.name).toBe('Test Setting');
    expect(savedSetting.description).toBe('Test description');
    expect(savedSetting.config).toEqual(testConfig);
    expect(savedSetting.id).toBeTruthy();
    expect(savedSetting.timestamp).toBeInstanceOf(Date);
    expect(savedSetting.version).toBe('1.0');

    const history = service.getSettingsHistory();
    expect(history.settings.length).toBe(1);
    expect(history.settings[0]).toEqual(savedSetting);
  });

  it('should load a specific setting by ID', () => {
    const testConfig = { test: 'data' };
    const savedSetting = service.saveSetting('Test Setting', testConfig);
    
    const loadedSetting = service.loadSetting(savedSetting.id);
    expect(loadedSetting).toEqual(savedSetting);
  });

  it('should delete a setting', () => {
    const savedSetting = service.saveSetting('Test Setting', { test: 'data' });
    expect(service.getSettingsHistory().settings.length).toBe(1);
    
    const success = service.deleteSetting(savedSetting.id);
    expect(success).toBe(true);
    expect(service.getSettingsHistory().settings.length).toBe(0);
  });

  it('should search settings', () => {
    service.saveSetting('Cardiology Template', { test: 'data' }, 'For cardiology patients');
    service.saveSetting('Pediatric Template', { test: 'data' }, 'For pediatric patients');
    
    const results = service.searchSettings('cardiology');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Cardiology Template');
  });

  it('should limit history size', () => {
    // Save more than the max limit
    for (let i = 0; i < 25; i++) {
      service.saveSetting(`Setting ${i}`, { test: 'data' });
    }
    
    const history = service.getSettingsHistory();
    expect(history.settings.length).toBeLessThanOrEqual(20);
  });
}); 