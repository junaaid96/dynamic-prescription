# Dynamic Prescription Layout Setup

A modern, responsive Angular application for creating and exporting dynamic medical prescriptions with live preview and browser-based print/PDF export capabilities.

## 🚀 Features

### Core Features
- **Live Preview**: Real-time preview of prescription layout as you design
- **Print/PDF Export**: Browser-based print functionality with dynamic page sizing (users can save as PDF from print dialog)
- **Print Preview**: Modal-based print preview with exact layout matching
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Rich Text Editing**: TinyMCE integration for formatted content editing
- **Multiple Page Sizes**: Support for A4, A5, Letter, Legal, and Custom sizes with dynamic CSS @page sizing
- **Save/Load Settings**: Save and reuse prescription templates with localStorage persistence (up to 20 saved configurations)
- **Drag & Drop**: Intuitive drag-and-drop interface for positioning sections using interact.js
- **Dynamic Content Sizing**: Automatic height calculation based on content length

### Advanced Features
- **Interact.js Integration**: Smooth drag and resize operations with grid snapping and collision detection
- **Comprehensive Validation**: Real-time validation of layout configurations and content with error/warning notifications
- **Responsive Service**: Adaptive layout based on screen size with automatic scaling and breakpoint detection
- **Diagnosis Fields Component**: Structured diagnosis input with drag-and-drop reordering, nested fields, and HTML formatting
- **HTML Content Processing**: Advanced HTML parsing and sanitization via SafeHtmlPipe
- **Notification System**: Visual feedback for all actions with success/error/warning/info states
- **Keyboard Shortcuts**: 
  - `Ctrl+P` / `Cmd+P`: Open print preview
  - `Delete` / `Backspace`: Delete selected section
  - `Esc`: Deselect section
- **Auto-validation**: Automatic validation of layout configurations with visual warnings and errors
- **Settings Management**: Search functionality, version control, and settings history (20 entry limit)
- **Dynamic Print Styles**: CSS @page rules dynamically generated based on selected paper size

## 📋 Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Angular CLI (v13.x)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dynamic-prescription.git
cd dynamic-prescription
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:4200
```

## 📖 Usage Guide

### Creating a Prescription

1. **Configure Page Layout**
   - Select page type (A4, A5, Letter, Legal, or Custom)
   - Adjust margins and padding using the configuration panel
   - Set header and footer heights
   - Configure column layouts for header/footer sections (up to 3 columns)

2. **Add Content Sections**
   - Click "Add Patient Info" to add patient information section (full width by default)
   - Click "Add Diagnostic" for diagnosis details (uses diagnosis fields component)
   - Click "Add Prescription" for medication details
   - Click "Add Custom" for any additional content
   - Sections are positioned automatically to avoid overlaps

3. **Edit Content**
   - Click on any section to select it
   - Use the TinyMCE rich text editor to format content
   - Drag sections to reposition them (with grid snapping)
   - Resize sections by dragging corners/edges or using input fields
   - Adjust font size, weight, alignment, and color in the configuration panel
   - Content height automatically adjusts based on content length (unless manually resized)

4. **Configure Header/Footer**
   - Use the column layout controls to set column widths (must total 100%)
   - Header and footer columns are populated with default clinic information (editable)
   - Configure up to 3 columns with percentage-based widths

5. **Diagnosis Fields**
   - When editing a diagnostic section, use the structured diagnosis fields component
   - Add/remove diagnosis titles (e.g., "Chief Complaints", "Vitals", "Investigations")
   - Add bullet points under each title
   - Drag and drop to reorder diagnosis groups
   - Content automatically converts to formatted HTML

6. **Export Options**
   - **Print Preview**: Opens modal with preview of print layout (Ctrl+P)
   - **Print**: Opens browser print dialog where users can save as PDF
   - **Save Settings**: Save current configuration for reuse (name and description required)
   - **Load Settings**: Load previously saved configurations with search functionality
   - **Reset to Defaults**: Clear all configuration and start fresh

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+P / Cmd+P | Open print preview |
| Delete / Backspace | Delete selected section |
| Esc | Deselect section |

### Tips for Best Results

1. **For Print/PDF Export**:
   - Use print preview (Ctrl+P) to verify layout before printing
   - Select "Save as PDF" in browser print dialog for PDF export
   - Ensure all content fits within the visible area
   - Use standard fonts for better compatibility
   - The application dynamically sets CSS @page size to match selected paper size

2. **For Responsive Design**:
   - The layout automatically adjusts for different screen sizes
   - On mobile devices, the configuration panel stacks vertically
   - Preview scale adjusts based on screen size
   - Responsive service provides optimal configurations for each device type

3. **For Content Formatting**:
   - Use the TinyMCE toolbar for consistent formatting
   - Use diagnosis fields component for structured diagnostic information
   - HTML content is automatically sanitized and styled
   - Lists and bullet points are properly formatted

4. **For Section Management**:
   - Drag sections to reposition (snaps to 5% grid)
   - Resize sections by dragging corners/edges
   - Sections automatically avoid collisions during drag
   - Manual resizing disables automatic height calculation

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── comprehensive-layout.component.ts    # Main layout component
│   │   ├── comprehensive-layout.component.html   # Main layout template
│   │   ├── comprehensive-layout.component.css    # Main layout styles
│   │   ├── tinymce-editor.component.ts           # TinyMCE wrapper component
│   │   └── diagnosis-fields.component.ts        # Structured diagnosis input
│   ├── services/
│   │   ├── settings.service.ts                  # LocalStorage settings management
│   │   ├── settings.service.spec.ts             # Settings service tests
│   │   ├── validation.service.ts                # Layout and content validation
│   │   └── responsive.service.ts                # Screen size detection and responsive configs
│   ├── models/
│   │   └── section.model.ts                     # TypeScript interfaces and types
│   ├── pipes/
│   │   └── safe-html.pipe.ts                    # HTML sanitization pipe
│   ├── app.component.ts                         # Root component
│   ├── app.component.html                       # Root template
│   ├── app.component.css                        # Root styles
│   ├── app.component.spec.ts                    # Root component tests
│   └── app.module.ts                            # Angular module configuration
├── assets/                                      # Static assets
├── environments/
│   ├── environment.ts                           # Development environment config
│   └── environment.prod.ts                      # Production environment config
├── favicon.ico
├── index.html                                   # Main HTML file
├── main.ts                                      # Application bootstrap
├── polyfills.ts                                 # Polyfills for browser compatibility
├── styles.css                                   # Global styles
└── test.ts                                      # Test configuration
```

## 🛠️ Technologies & Libraries Used

### Core Framework
- **Angular 13.3.0**: Core framework with TypeScript 4.6.2
- **RxJS 7.5.0**: Reactive programming for observables and streams
- **TypeScript 4.6.2**: Type-safe JavaScript superset

### UI Libraries
- **@tinymce/tinymce-angular 6.0.1**: Rich text editor integration for TinyMCE
- **TinyMCE 6.0.1**: Feature-rich WYSIWYG editor (loaded via CDN)
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **PostCSS 8.5.6**: CSS processing and transformation
- **Autoprefixer 10.4.21**: Automatic CSS vendor prefixing

### Interaction Libraries
- **interactjs 1.10.27**: Drag and drop, resizing with snapping and collision detection
- **@angular/cdk 13.3.9**: Angular Component Dev Kit for drag-drop module
  - DragDropModule for list reordering in diagnosis fields

### Development Tools
- **@angular/cli 13**: Angular command-line interface
- **Karma 6.3.0**: Test runner
- **Jasmine 4.0.0**: Testing framework
- **@angular-devkit/build-angular 13.3.11**: Angular build tools

### Browser APIs Used
- **Window.print()**: Browser print functionality for PDF export
- **LocalStorage API**: Settings persistence
- **CSS @page Rule**: Dynamic print page sizing

## 🔍 Key Services & Components

### ComprehensiveLayoutComponent
- Main application component managing all layout logic
- Handles section creation, deletion, duplication
- Manages drag and drop via interact.js
- Dynamic content sizing calculations
- Print preview modal management
- Settings save/load operations
- Real-time validation integration

### SettingsService
- LocalStorage-based settings persistence
- Settings history management (max 20 entries)
- Search and filtering capabilities
- Version control for settings
- Settings statistics and metadata

### ValidationService
- Real-time layout configuration validation
- Section overlap detection and warnings
- Content validation (empty content, size constraints)
- Auto-fix capabilities for common layout issues
- Comprehensive error and warning reporting
- Batch validation for all sections

### ResponsiveService
- Screen size detection and monitoring (mobile/tablet/desktop)
- RxJS-based resize event handling with debouncing
- Adaptive layout configurations per device type
- Optimal config calculation based on screen size

### TinyMCEEditorComponent
- TinyMCE editor wrapper with ControlValueAccessor
- Custom toolbar configuration
- HTML content sanitization
- Real-time content change detection
- Auto-resize based on content
- Font size in pixels (11px default)

### DiagnosisFieldsComponent
- Structured diagnosis input with nested fields
- Drag and drop reordering using Angular CDK
- HTML output generation from structured data
- Parsing of existing HTML content back to fields
- Add/remove titles and bullet points

### SafeHtmlPipe
- HTML sanitization using Angular DomSanitizer
- Enhanced HTML processing for TinyMCE content
- List styling preservation
- Paragraph and formatting style injection

## 🔍 Troubleshooting

### Common Issues

1. **Print/PDF Export Not Working**
   - Ensure browser print dialog is not blocked
   - Check browser console for errors
   - Verify CSS @page rules are being applied (check computed styles)
   - Try different browsers (Chrome, Firefox, Safari, Edge)
   - Ensure content fits within page boundaries

2. **TinyMCE Not Loading**
   - Check internet connection (TinyMCE loads from CDN)
   - Verify API key in `tinymce-editor.component.ts` (line 9)
   - Check browser console for CDN loading errors
   - Ensure `@tinymce/tinymce-angular` package is installed

3. **Drag and Drop Not Working**
   - Check browser console for interact.js errors
   - Ensure sections are properly initialized (check ngAfterViewInit)
   - Verify bodyArea ViewChild reference is available
   - Check that sections have `data-section-id` attributes

4. **Layout Issues**
   - Clear browser cache and reload
   - Check for CSS conflicts in browser DevTools
   - Ensure screen resolution is at least 1024x768
   - Verify Tailwind CSS is properly configured and compiled
   - Check that PostCSS and Autoprefixer are working

5. **Settings Not Saving**
   - Check browser localStorage support (most modern browsers support it)
   - Verify browser permissions for localStorage
   - Check browser console for quota exceeded errors
   - Clear browser data if localStorage is corrupted
   - Ensure settings name is provided (required field)

6. **Content Sizing Issues**
   - Check that sections aren't marked as manually resized
   - Verify content is being parsed correctly
   - Check browser console for sizing calculation logs
   - Manually reset section sizing if needed

### Debug Mode

To enable debug logging, check the browser console. The application logs:
- Section initialization and updates
- Content height calculations
- Interact.js setup and drag operations
- Settings save/load operations
- Validation results

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The project uses:
- **Karma 6.3.0**: Test runner
- **Jasmine 4.0.0**: Testing framework
- **Angular Testing Utilities**: Component testing

## 📦 Build

Build for production:
```bash
npm run build
```

Build with watch mode:
```bash
npm run watch
```

Production build output is in `dist/dynamic-prescription/`.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow Angular style guide
- Use TypeScript strict mode (enabled in tsconfig.json)
- Write unit tests for new features
- Ensure responsive design compatibility
- Test print/PDF export functionality in multiple browsers
- Document any new services or components

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **TinyMCE** for the excellent rich text editor
- **Interact.js** for smooth drag and drop functionality
- **Angular** team for the amazing framework
- **Tailwind CSS** for the utility-first styling approach
- **Angular CDK** for drag-drop list functionality

## 🔄 Version History

- **v0.0.0**: Initial release with comprehensive prescription generation features
  - Angular 13.3.0 with TypeScript 4.6.2
  - TinyMCE 6.0.1 integration for rich text editing
  - Browser-based print/PDF export with dynamic @page sizing
  - Interact.js for drag and drop functionality
  - Responsive design with Tailwind CSS
  - Settings management with localStorage (20 entry limit)
  - Diagnosis fields component with structured input
  - Dynamic content sizing based on content length
  - Comprehensive validation service
  - Responsive service for adaptive layouts

---

**Note**: This application is designed for medical prescription generation. Please ensure compliance with local medical regulations and standards when using in a professional setting. The application provides a comprehensive tool for creating professional medical prescriptions with advanced formatting and browser-based export capabilities.
