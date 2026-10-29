export interface TinyMcePreferences {
  height: number;
  placeholder: string;
  menubar: boolean;
  statusbar: boolean;
  resize: boolean;
  toolbar: string;
}

export interface TinyMceEditorLike {
  on(event: string, handler: () => void): void;
}

export interface TinyMceInit {
  height: number;
  menubar: boolean;
  statusbar: boolean;
  resize: boolean;
  plugins: string;
  toolbar: string;
  placeholder: string;
  branding: boolean;
  elementpath: boolean;
  font_size_formats: string;
  font_family_formats: string;
  autoresize_bottom_margin: number;
  autoresize_min_height: number;
  autoresize_max_height: number;
  toolbar_mode: 'sliding' | 'floating' | 'scrolling' | 'wrap';
  browser_spellcheck: boolean;
  contextmenu: false;
  paste_data_images: boolean;
  content_style: string;
  setup: (editor: TinyMceEditorLike) => void;
}

const FONT_SIZE_FORMATS = '11px 12px 13px 14px 16px 18px 20px 22px 24px 28px 32px 36px 48px 72px';
const FONT_FAMILY_FORMATS = [
  'Arial=arial,helvetica,sans-serif',
  'Courier New=courier new,courier,monospace',
  'Georgia=georgia,palatino,serif',
  'Helvetica=helvetica,arial,sans-serif',
  'Times New Roman=times new roman,times,serif',
  'Verdana=verdana,geneva,sans-serif',
].join('; ');

const CONTENT_STYLE = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    margin: 0;
    padding: 5px;
    color: #1e293b;
  }
  p { margin: 0 0 4px 0; font-size: inherit; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 4px 0; padding-left: 20px; list-style-position: outside; }
  ul { list-style-type: disc; }
  ol { list-style-type: decimal; }
  li { margin: 2px 0; line-height: 1.4; font-size: inherit; }
  strong, b { font-weight: 700 !important; }
  em, i { font-style: italic !important; }
  u { text-decoration: underline !important; }
  * { box-sizing: border-box; }
`;

export function createTinyMceInit(
  preferences: TinyMcePreferences,
  hooks: { onBlur: () => void },
): TinyMceInit {
  return {
    height: preferences.height,
    menubar: preferences.menubar,
    statusbar: preferences.statusbar,
    resize: preferences.resize,
    plugins: 'advlist autolink lists link charmap searchreplace visualblocks code autoresize table help wordcount',
    toolbar: preferences.toolbar,
    placeholder: preferences.placeholder,
    branding: false,
    elementpath: false,
    font_size_formats: FONT_SIZE_FORMATS,
    font_family_formats: FONT_FAMILY_FORMATS,
    autoresize_bottom_margin: 10,
    autoresize_min_height: preferences.height,
    autoresize_max_height: 800,
    toolbar_mode: 'sliding',
    browser_spellcheck: true,
    contextmenu: false,
    paste_data_images: true,
    content_style: CONTENT_STYLE,
    setup: (editor) => {
      editor.on('blur', hooks.onBlur);
    },
  };
}
