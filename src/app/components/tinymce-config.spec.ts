import { createTinyMceInit } from './tinymce-config';

describe('createTinyMceInit', () => {
  it('builds a TinyMCE 8 configuration from the editor preferences', () => {
    let blurred = false;
    const init = createTinyMceInit({
      height: 150,
      placeholder: 'Notes',
      menubar: false,
      statusbar: false,
      resize: true,
      toolbar: 'bold italic',
    }, {
      onBlur: () => {
        blurred = true;
      },
    });

    expect(init.height).toBe(150);
    expect(init.toolbar).toBe('bold italic');
    expect(init.font_size_formats).toContain('11px');
    expect(init.plugins).not.toContain('fontselect');
    expect(init.resize).toBe(true);

    const handlers = new Map<string, () => void>();
    init.setup({
      on: (event, handler) => handlers.set(event, handler),
    });
    handlers.get('blur')?.();
    expect(blurred).toBe(true);
  });
});
