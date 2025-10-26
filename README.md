# Dynamic Prescription Generator

A modern, responsive Angular application for creating and exporting dynamic medical prescriptions with live preview and PDF export capabilities.

## 🚀 Features

### Core Features
- **Live Preview**: Real-time preview of prescription layout as you design
- **PDF Export**: High-quality PDF generation with exact layout preservation using jsPDF and html2canvas
- **Print Preview**: Browser-based print preview functionality
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Rich Text Editing**: TinyMCE integration for formatted content
- **Multiple Page Sizes**: Support for A4, A5, Letter, Legal, and Custom sizes
- **Save/Load Settings**: Save and reuse prescription templates with localStorage persistence
- **Drag & Drop**: Intuitive drag-and-drop interface for positioning sections

### Advanced Features
- **HTML2Canvas Integration**: Accurate PDF rendering that matches live preview exactly
- **Comprehensive Validation**: Real-time validation of layout configurations and content
- **Responsive Service**: Adaptive layout based on screen size with automatic scaling
- **HTML Content Processing**: Advanced HTML parsing and text extraction services
- **Notification System**: Visual feedback for all actions with success/error states
- **Keyboard Shortcuts**: 
  - `Ctrl+P`: Export to PDF
  - `Ctrl+S`: Save configuration
  - `Delete`: Delete selected section
  - `Esc`: Deselect section
- **Auto-validation**: Automatic validation of layout configurations with warnings and errors
- **Settings Management**: Import/export settings, search functionality, and version control

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
   - Configure column layouts for header/footer sections

2. **Add Content Sections**
   - Click "Add Patient Info" to add patient information section
   - Click "Add Diagnostic" for diagnosis details
   - Click "Add Prescription" for medication details
   - Click "Add Custom" for any additional content

3. **Edit Content**
   - Click on any section to select it
   - Use the TinyMCE rich text editor to format content
   - Drag sections to reposition them
   - Resize sections using the configuration controls
   - Adjust font size, weight, alignment, and color

4. **Configure Header/Footer**
   - Use the column layout controls to set column widths
   - Edit header/footer content using the TinyMCE editors
   - Add clinic information, logos, and contact details

5. **Export Options**
   - **Export to PDF**: Generates a downloadable PDF file with exact layout preservation
   - **Print Preview**: Opens browser print dialog with optimized layout
   - **Save Settings**: Save current configuration for reuse
   - **Load Settings**: Load previously saved configurations

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+P | Export to PDF |
| Ctrl+S | Save configuration |
| Delete | Delete selected section |
| Esc | Deselect section |

### Tips for Best Results

1. **For PDF Export**:
   - Ensure all content fits within the visible area
   - Use standard fonts for better compatibility
   - Test print preview before final export
   - The application uses html2canvas for pixel-perfect PDF generation

2. **For Responsive Design**:
   - The layout automatically adjusts for different screen sizes
   - On mobile devices, the configuration panel stacks vertically
   - Preview scale adjusts based on screen size
   - Responsive service provides optimal configurations for each device type

3. **For Content Formatting**:
   - Use the TinyMCE toolbar for consistent formatting
   - Paste content as plain text for cleaner results
   - Use bullet points and numbering for better organization
   - HTML content is automatically processed and cleaned

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── comprehensive-layout.component.ts
│   │   ├── comprehensive-layout.component.html
│   │   ├── comprehensive-layout.component.css
│   │   └── tinymce-editor.component.ts
│   ├── services/
│   │   ├── html-content.service.ts
│   │   ├── settings.service.ts
│   │   ├── settings.service.spec.ts
│   │   ├── validation.service.ts
│   │   ├── responsive.service.ts
│   │   └── html-parsing.service.ts
│   ├── models/
│   │   └── section.model.ts
│   ├── pipes/
│   │   └── safe-html.pipe.ts
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.css
│   ├── app.component.spec.ts
│   └── app.module.ts
├── assets/
│   └── .gitkeep
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── favicon.ico
├── index.html
├── main.ts
├── polyfills.ts
├── styles.css
└── test.ts
```

## 🛠️ Technologies Used

- **Angular 13.3.0**: Core framework with TypeScript
- **TinyMCE 6.0.1**: Rich text editor for content formatting
- **jsPDF 2.5.1**: PDF generation library
- **html2canvas 1.4.1**: HTML to canvas conversion for accurate PDF rendering
- **html2pdf.js 0.10.3**: Additional PDF generation capabilities
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **RxJS 7.5.0**: Reactive programming
- **Angular CDK 13.3.9**: Component development kit
- **PostCSS 8.5.6**: CSS processing
- **Autoprefixer 10.4.21**: CSS vendor prefixing

## 🔍 Key Services

### PDF Export Service
- Dual export methods: Traditional jsPDF and html2canvas-based
- Support for multiple paper sizes (A4, A5, Letter, Legal, Custom)
- Clean PDF generation without visual borders
- Metadata addition and watermark support

### Settings Service
- LocalStorage-based settings persistence
- Import/export functionality for settings
- Search and filtering capabilities
- Version control for settings
- Maximum history size management (20 entries)

### Validation Service
- Real-time layout configuration validation
- Section overlap detection
- Content validation and warnings
- Auto-fix capabilities for common issues
- Comprehensive error reporting

### Responsive Service
- Screen size detection and monitoring
- Adaptive layout configurations
- Mobile, tablet, and desktop optimizations
- Debounced resize event handling

### HTML Content Service
- HTML to text conversion
- Formatted text extraction
- HTML entity decoding
- Alignment preservation
- Content cleaning and normalization

## 🔍 Troubleshooting

### Common Issues

1. **PDF Export Not Working**
   - Ensure all dependencies are installed: `npm install`
   - Check browser console for errors
   - Try using Print Preview as an alternative
   - Verify html2canvas and jsPDF are properly loaded

2. **TinyMCE Not Loading**
   - Check internet connection (requires CDN access)
   - Verify API key in tinymce-editor.component.ts
   - Ensure @tinymce/tinymce-angular is installed

3. **Layout Issues**
   - Clear browser cache
   - Check for CSS conflicts
   - Ensure screen resolution is at least 1024x768
   - Verify Tailwind CSS is properly configured

4. **Settings Not Saving**
   - Check browser localStorage support
   - Verify browser permissions
   - Clear browser data if needed

### Debug Mode

To enable debug logging:
```typescript
// In comprehensive-layout.component.ts
console.log('Debug mode enabled');
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The project uses:
- **Karma**: Test runner
- **Jasmine**: Testing framework
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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow Angular style guide
- Use TypeScript strict mode
- Write unit tests for new features
- Ensure responsive design compatibility
- Test PDF export functionality thoroughly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- TinyMCE for the excellent rich text editor
- jsPDF team for the PDF generation library
- html2canvas for accurate HTML rendering
- Angular team for the amazing framework
- Tailwind CSS for the utility-first styling approach


## 🔄 Version History

- **v0.0.0**: Initial release with comprehensive prescription generation features
- Angular 13.3.0 with TypeScript 4.6.2
- TinyMCE 6.0.1 integration
- PDF export with html2canvas and jsPDF
- Responsive design with Tailwind CSS
- Settings management with localStorage

---

**Note**: This application is designed for medical prescription generation. Please ensure compliance with local medical regulations and standards when using in a professional setting. The application provides a comprehensive tool for creating professional medical prescriptions with advanced formatting and export capabilities.