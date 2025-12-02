# FieldForge - PDF Field Mapper for Adobe Sign

![PDF Field Mapper Interface](./src/assets/pdf-field-mapper-hero-image.svg)

A professional-grade visual PDF field mapping tool that allows you to configure Adobe Sign form fields without leaving your application. This Angular-based solution demonstrates how to embed document preparation capabilities directly into your own applications, eliminating the need to switch to Adobe Sign's interface.

🚀 **[Live Demo](https://pdfmapper.misu-varga.com/)** | 📖 **[Read the Article](https://misu-varga.com/blog/article/15)**

## Overview

While Adobe Sign provides its own interface for adding form fields to documents, requiring users to leave your application disrupts workflows and creates training overhead. FieldForge proves that field mapping can be seamlessly integrated into your existing applications using Adobe Sign's API.

### Key Features

#### Core Functionality
- 📄 **Visual PDF rendering** with PDF.js
- ✏️ **Intuitive field creation** - Click to select, click empty space to draw
- 🎯 **Precise positioning** with coordinate grid overlay and snap-to-grid
- 📝 **Complete Adobe Sign field support** (text, signature, date, checkbox, radio, etc.)
- 🔄 **Drag & resize** fields with visual handles
- ⚡ **Undo/Redo** with full history management

#### Professional UX/UI
- 🎨 **Modern three-panel layout** - Field types, canvas, and properties
- 🔍 **Smart context-aware interaction** - No mode switching needed
- 📋 **Collapsible sidebars** for maximum workspace
- 🎭 **Real-time visual feedback** with selection handles and hover states
- 📱 **Responsive design** that adapts to different screen sizes

#### Data Management
- 💾 **Import/Export** field configurations as JSON
- 📊 **JSON viewer** with copy-to-clipboard functionality
- 🔄 **Adobe Sign API-compatible** export format
- 💼 **Configuration persistence** for workflow automation

#### Enterprise Features
- 🏗️ **Service-based architecture** with separation of concerns
- 🎯 **Coordinate conversion service** for TRANSIENT/LIBRARY modes
- 🖱️ **Field interaction service** for drag/resize operations
- 🎨 **Canvas renderer service** for optimized drawing
- 📐 **Type-safe field definitions** with comprehensive validation

## How It Works

FieldForge uses an intuitive context-aware interaction model:

1. **Select a field type** from the left sidebar
2. **Click on the PDF canvas**:
   - Click on **empty space** → Creates a new field of the selected type
   - Click on **existing field** → Selects it for editing/moving
3. **Resize or move** selected fields with visual handles
4. **Configure properties** in the right sidebar
5. **Export** your field configuration to JSON for Adobe Sign API

No mode switching, no complex interactions - just natural, intuitive field creation!

## Use Cases

- **Enterprise Applications**: Embed document configuration directly in your business applications
- **Document Management Systems**: Add field mapping as a native feature
- **CRM Integration**: Configure contracts without leaving your CRM
- **Workflow Automation**: Programmatically generate field configurations
- **Template Management**: Create reusable document templates

## Technical Stack

- **Angular 20**: Modern component-based architecture
- **PDF.js 5.3.31**: Client-side PDF rendering
- **Ant Design (ng-zorro) v20**: Professional UI component library
- **TypeScript 5.7**: Type-safe development with strict mode
- **RxJS**: Reactive state management
- **Enterprise Architecture**: Service-based separation of concerns

## Architecture Highlights

### Service Layer
- **CoordinateConversionService**: Handles PDF coordinate transformations
- **FieldInteractionService**: Manages drag, resize, and selection logic
- **CanvasRendererService**: Optimized canvas drawing operations
- **FieldTypeService**: Centralized field type definitions and metadata
- **HistoryService**: Undo/redo functionality with command pattern
- **PdfFieldService**: Core field management and state

### Component Structure
- **Standalone components**: Modern Angular architecture
- **Clean separation**: UI, business logic, and services
- **Type safety**: Comprehensive interfaces and models
- **Reactive patterns**: Observable-based state management

## Getting Started

### Prerequisites

- Node.js (v20.19 or higher recommended)
- npm or yarn
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/vmisu86/pdf-field-mapper.git
cd pdf-field-mapper
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
ng serve
```

4. Open your browser and navigate to http://localhost:4200/

## Usage

### Creating Fields

1. Upload a PDF document
2. Select a field type from the left sidebar (e.g., "Text Field", "Signature")
3. Click and drag on the PDF to create the field
4. Adjust properties in the right sidebar

### Managing Fields

- **Select**: Click on any field
- **Move**: Drag a selected field
- **Resize**: Drag the handles on a selected field
- **Delete**: Select a field and click "Delete Field" in the properties panel
- **Edit**: Modify field properties in the right sidebar

### Import/Export

- **Export**: Click "Export" to download your field configuration as JSON
- **Import**: Click "Import" to load a previously saved configuration
- **View JSON**: Click "View JSON" to see and copy the raw configuration

### Keyboard Shortcuts

- `Ctrl+Z`: Undo
- `Ctrl+Shift+Z`: Redo

## Configuration

### Coordinate Systems

FieldForge supports both Adobe Sign coordinate systems:

- **TRANSIENT**: Top-left origin (default)
- **LIBRARY**: Bottom-left origin

Switch between modes using the "Coordinate System" dropdown in the header.

### Field Types

Supported field types include:
- Text fields (single and multiline)
- Signature fields
- Initial fields
- Date fields (with custom formats)
- Checkbox fields
- Radio button fields
- Signer name and email fields

## Integration with Adobe Sign

The exported JSON format is directly compatible with Adobe Sign's `formFields` API parameter. Use the exported configuration when creating transient documents or library templates:

```javascript
const response = await adobeSignApi.createTransientDocument({
  fileInfo: { /* your file */ },
  formFields: exportedFieldConfig.fields
});
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is provided as-is for educational and demonstration purposes.

## Acknowledgments

- Built with [Angular](https://angular.dev/)
- UI components from [NG-ZORRO](https://ng.ant.design/)
- PDF rendering by [PDF.js](https://mozilla.github.io/pdf.js/)
- Inspired by Adobe Sign's document preparation workflow

## Author

**Misu Varga**
- Website: [misu-varga.com](https://misu-varga.com)
- Article: [Read the full article about this project](https://misu-varga.com/blog/article/15)

---

Built with ❤️ for the Adobe Sign developer community
