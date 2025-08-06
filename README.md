# Dynamic Prescription Generator

A modern, responsive Angular application for creating and exporting dynamic medical prescriptions with live preview and PDF export capabilities.

## 🚀 Features

### Core Features
- **Live Preview**: Real-time preview of prescription layout as you design
- **PDF Export**: High-quality PDF generation with exact layout preservation
- **Print Preview**: Browser-based print preview functionality
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Drag & Drop**: Intuitive drag-and-drop interface for positioning sections
- **Rich Text Editing**: TinyMCE integration for formatted content
- **Multiple Page Sizes**: Support for A4, A5, Letter, Legal, and Custom sizes
- **Save/Load Settings**: Save and reuse prescription templates

### Enhanced Features (Recent Improvements)
- **HTML2Canvas Integration**: Accurate PDF rendering that matches live preview exactly
- **Improved Error Handling**: Comprehensive validation and user-friendly error messages
- **Better Typography**: Enhanced font rendering in both preview and PDF
- **Print Styles**: Optimized CSS for perfect printing
- **Notification System**: Visual feedback for all actions
- **Keyboard Shortcuts**: 
  - `Ctrl+P`: Export to PDF
  - `Ctrl+S`: Save configuration
  - `Delete`: Delete selected section
  - `Esc`: Deselect section
- **Auto-validation**: Automatic validation of layout configurations
- **Responsive Service**: Adaptive layout based on screen size

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

2. **Add Content Sections**
   - Click "Add Patient Info" to add patient information section
   - Click "Add Diagnostic" for diagnosis details
   - Click "Add Prescription" for medication details
   - Click "Add Custom" for any additional content

3. **Edit Content**
   - Click on any section to select it
   - Use the rich text editor to format content
   - Drag sections to reposition them
   - Resize sections using the configuration controls

4. **Configure Header/Footer**
   - Use the column layout controls to set column widths
   - Edit header/footer content using the TinyMCE editors
   - Add clinic information, logos, and contact details

5. **Export Options**
   - **Export to PDF**: Generates a downloadable PDF file
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

2. **For Responsive Design**:
   - The layout automatically adjusts for different screen sizes
   - On mobile devices, the configuration panel stacks vertically
   - Preview scale adjusts based on screen size

3. **For Content Formatting**:
   - Use the TinyMCE toolbar for consistent formatting
   - Paste content as plain text for cleaner results
   - Use bullet points and numbering for better organization

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── comprehensive-layout.component.ts/html/css
│   │   └── tinymce-editor.component.ts
│   ├── services/
│   │   ├── pdf-export.service.ts
│   │   ├── html-content.service.ts
│   │   ├── settings.service.ts
│   │   ├── validation.service.ts
│   │   └── responsive.service.ts
│   ├── models/
│   │   └── section.model.ts
│   └── app.module.ts
├── assets/
├── environments/
└── styles.css
```

## 🛠️ Technologies Used

- **Angular 13**: Core framework
- **TypeScript**: Primary programming language
- **TinyMCE**: Rich text editor
- **jsPDF**: PDF generation library
- **html2canvas**: HTML to canvas conversion
- **Tailwind CSS**: Utility-first CSS framework
- **RxJS**: Reactive programming

## 🔍 Troubleshooting

### Common Issues

1. **PDF Export Not Working**
   - Ensure all dependencies are installed: `npm install`
   - Check browser console for errors
   - Try using Print Preview as an alternative

2. **TinyMCE Not Loading**
   - Check internet connection (requires CDN access)
   - Verify API key in tinymce-editor.component.ts

3. **Layout Issues**
   - Clear browser cache
   - Check for CSS conflicts
   - Ensure screen resolution is at least 1024x768

### Debug Mode

To enable debug logging:
```typescript
// In comprehensive-layout.component.ts
console.log('Debug mode enabled');
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- TinyMCE for the excellent rich text editor
- jsPDF team for the PDF generation library
- html2canvas for accurate HTML rendering
- Angular team for the amazing framework

## 📞 Support

For support, email support@example.com or create an issue in the GitHub repository.

---

**Note**: This application is designed for medical prescription generation. Please ensure compliance with local medical regulations and standards when using in a professional setting.