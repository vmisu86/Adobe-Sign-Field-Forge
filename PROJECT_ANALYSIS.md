# PDF Field Mapper - Project Analysis & Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Core Functionality](#core-functionality)
5. [Key Features](#key-features)
6. [Architecture & Code Organization](#architecture--code-organization)
7. [Components](#components)
8. [Services & State Management](#services--state-management)
9. [Data Models](#data-models)
10. [Configuration](#configuration)
11. [Dependencies](#dependencies)
12. [Build & Development](#build--development)
13. [Coordinate Systems](#coordinate-systems)
14. [Adobe Sign Integration](#adobe-sign-integration)
15. [Future Enhancements](#future-enhancements)

---

## Project Overview

**PDF Field Mapper (FieldForge)** is a professional-grade visual PDF field mapping tool built with Angular 20. It enables users to interactively place and configure form fields on PDF documents, then export the configurations in Adobe Sign-compatible format.

### Purpose

The application allows users to:
- Upload PDF documents and render them visually
- Draw form fields directly on the PDF canvas using an intuitive click-to-draw interface
- Configure comprehensive field properties (type, name, validation, recipients)
- Drag and resize fields with visual handles
- Use undo/redo for all field operations
- Export field configurations as JSON for Adobe Sign integration
- Import previously saved configurations

### Primary Use Case

Embed document preparation capabilities in enterprise applications, eliminating the need for users to leave their application to configure Adobe Sign forms. This provides seamless integration for CRM systems, document management platforms, and workflow automation tools.

---

## Project Structure

```
pdf-field-mapper/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── pdf-viewer/                  # Main unified component
│   │   │       ├── pdf-viewer.component.ts
│   │   │       ├── pdf-viewer.component.html
│   │   │       ├── pdf-viewer.component.less
│   │   │       └── pdf-viewer.component.spec.ts
│   │   ├── models/
│   │   │   └── field.model.ts               # Type definitions and interfaces
│   │   ├── services/
│   │   │   ├── pdf-field.service.ts         # Core field state management
│   │   │   ├── history.service.ts           # Undo/redo with command pattern
│   │   │   ├── coordinate-conversion.service.ts  # Coordinate transformations
│   │   │   ├── field-interaction.service.ts      # Drag/resize operations
│   │   │   ├── canvas-renderer.service.ts        # Canvas drawing operations
│   │   │   └── field-type.service.ts             # Field type definitions
│   │   ├── app.component.ts                 # Root component
│   │   ├── app.component.html               # Root template
│   │   ├── app.component.less               # Root styles
│   │   ├── app.component.spec.ts            # Root tests
│   │   ├── app.routes.ts                    # Routing configuration
│   │   └── app.config.ts                    # Application configuration
│   ├── index.html                       # HTML entry point
│   ├── main.ts                          # Bootstrap file
│   └── styles.less                      # Global styles
├── public/
│   └── favicon.ico                      # Application icon
├── .vscode/                             # VS Code configuration
│   ├── extensions.json
│   ├── launch.json
│   └── tasks.json
├── angular.json                         # Angular CLI configuration
├── tsconfig.json                        # TypeScript configuration
├── tsconfig.app.json                    # App-specific TS config
├── tsconfig.spec.json                   # Test TS config
├── package.json                         # Dependencies and scripts
├── package-lock.json                    # Dependency lock file
├── .editorconfig                        # Editor settings
├── .gitignore                           # Git ignore rules
├── README.md                            # User documentation
└── PROJECT_ANALYSIS.md                  # This file
```

---

## Technology Stack

### Frontend Framework
- **Angular 20.3.14** - Latest component-based framework with standalone components
- **TypeScript 5.8** - Type-safe development with strict mode

### PDF Processing
- **PDF.js (pdfjs-dist) 5.3.31** - Client-side PDF rendering
- Worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.mjs`

### UI Components
- **ng-zorro-antd 20.4.2** - Ant Design components for Angular
- **@ant-design/icons-angular** - Comprehensive icon library

### State Management
- **RxJS 7.8.x** - Reactive programming with Observables and BehaviorSubject

### Build Tools
- **Angular CLI 20.3.12** - Command-line interface
- **Angular DevKit Build Angular 20.3.12** - Build system

### Testing
- **Jasmine 5.6.0** - Testing framework
- **Karma 6.4.0** - Test runner
- **Karma Chrome Launcher** - Browser automation

### Styling
- **LESS** - CSS preprocessor

---

## Core Functionality

### 1. PDF Upload & Rendering
- Upload PDF files via file input
- Client-side rendering using PDF.js
- Multi-page document support
- Page navigation controls
- Dynamic scaling (1.5x default)

### 2. Context-Aware Field Creation
- **Intuitive interaction model**: No mode switching required
- Select a field type from the left sidebar
- Click on empty space to draw a new field
- Click on existing field to select it
- Real-time coordinate display during drawing
- Visual feedback with dashed preview

### 3. Field Manipulation
- **Drag to move**: Click and drag selected fields to reposition
- **Resize with handles**: 8 resize handles (corners + sides)
- **Visual feedback**: Selection highlights, hover states
- **Snap to grid**: Optional grid-snapping for precise alignment
- **Undo/Redo**: Full history management for all operations

### 4. Field Configuration
- Comprehensive field properties in right sidebar:
  - Name (with smart auto-generation)
  - Type (input type + content type combinations)
  - Position (left, top, width, height)
  - Page number
  - Required flag
  - Read-only flag
  - Validation rules and patterns
  - Recipient assignment (by index)

### 5. Coordinate Grid Overlay
- Toggleable grid display
- Shows PDF points and coordinates
- Supports both TRANSIENT and LIBRARY coordinate systems
- Displays page dimensions
- Precise positioning aid

### 6. Data Import/Export
- Export to Adobe Sign-compatible JSON format
- Import from JSON files
- View JSON representation in modal
- Copy JSON to clipboard
- Maintain field configurations across sessions

---

## Key Features

### Supported Field Types (11 types)

**Text Fields:**
- Text Field (single-line)
- Multiline Text
- Signer Name (auto-populated)
- Signer Email (auto-populated)

**Signature Fields:**
- Signature
- Initials

**Date Fields:**
- Date Field (with format validation)
- Date-CUSTOM (custom format)
- Signing Date (read-only, auto-populated)

**Other:**
- Checkbox
- Radio Button

### Field Management
- Create, read, update, delete operations
- Edit properties inline in sidebar
- Visual field list with collapsible cards
- Field validation support
- Multi-recipient support
- Smart field naming

### UI Features
- **Three-panel layout**: Field types (left), PDF canvas (center), properties (right)
- **Collapsible sidebars**: Maximize workspace when needed
- **Context-aware interactions**: Click empty space = create, click field = select
- **Professional Ant Design interface**
- **Color-coded field types**: Visual distinction
- **Icon indicators**: Quick field type identification
- **Real-time feedback**: Hover states, selection handles
- **Responsive layout**: Adapts to screen sizes

### Professional UX
- No mode switching required
- Visual selection handles with 8 resize points
- Drag and drop field positioning
- Undo/Redo with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- Snap-to-grid for precise alignment
- Coordinate display in real-time
- Smart field name generation

### Adobe Sign Compatibility
- Exports to Adobe Sign API format
- Supports TRANSIENT and LIBRARY document types
- Multi-recipient configurations
- Read-only field support
- Validation data fields
- Direct API integration ready

---

## Architecture & Code Organization

### Application Bootstrap

**main.ts**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

- Uses standalone bootstrap (no NgModule)
- Loads app configuration
- Entry point for Angular application

### Architectural Patterns

1. **Service-Oriented Architecture**
   - Separation of concerns across specialized services
   - Single Responsibility Principle for each service
   - Dependency injection for loose coupling
   - Testable, maintainable codebase

2. **RxJS-Based State Management**
   - All state flows through BehaviorSubjects
   - Observable streams for reactive updates
   - Centralized state in PdfFieldService
   - History management through command pattern

3. **Standalone Components**
   - Modern Angular architecture
   - No NgModule required
   - Direct component imports
   - Simplified dependency management

4. **Two-Canvas Approach**
   - PDF.js canvas for rendering (pdfCanvas)
   - Overlay canvas for interactions (drawingCanvas)
   - Optimized for performance
   - Clear separation of concerns

5. **Command Pattern for History**
   - Undo/Redo implementation
   - Encapsulated operations
   - History stack management
   - Easy to extend with new commands

6. **Coordinate System Abstraction**
   - Handles browser pixels
   - PDF.js viewport coordinates
   - Adobe Sign point coordinates
   - Supports TRANSIENT and LIBRARY modes

---

## Components

### 1. AppComponent (Root)

**File:** `app.component.ts` (15 lines)

**Responsibility:**
- Minimal root component
- Imports and displays PdfViewerComponent
- Sets application title

**Key Properties:**
```typescript
title = 'FieldForge for Adobe Sign';
```

**Template Structure:**
```html
<app-pdf-viewer></app-pdf-viewer>
```

---

### 2. PdfViewerComponent (Unified Component)

**File:** `pdf-viewer.component.ts` (~600 lines)

**Responsibility:**
- Main and only component - handles entire application UI
- Three-panel layout: field types, PDF canvas, properties
- PDF rendering and display
- Field drawing interface
- Field selection and manipulation (drag/resize)
- Field property editing
- Import/export functionality
- Coordinate grid overlay

**Key Properties:**
```typescript
// Canvas references
@ViewChild('pdfCanvas') pdfCanvas: ElementRef<HTMLCanvasElement>;
@ViewChild('drawingCanvas') drawingCanvas: ElementRef<HTMLCanvasElement>;

// PDF state
pdfDocument: any = null;
currentPage = 1;
totalPages = 0;
scale = 1.5;

// Drawing state
isDrawing = false;
showGrid = false;
drawingStart: { x: number; y: number } | null = null;

// Field state
selectedField: Field | null = null;
hoveredField: Field | null = null;
fields: Field[] = [];

// Interaction settings
snapToGrid = false;
gridSize = 10;

// UI state
canUndo = false;
canRedo = false;
selectedFieldType: any = 'TEXT_FIELD';
recipientIndex = 1;
documentType: AdobeDocumentType = AdobeDocumentType.TRANSIENT;
leftSidebarCollapsed = false;
rightSidebarCollapsed = false;
searchFieldType = '';
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `ngOnInit()` | Initialize subscriptions to services |
| `loadPdf(file)` | Load PDF from file input |
| `renderPage(pageNum)` | Render specific page to canvas |
| `redrawCanvas()` | Redraw all fields on overlay canvas |
| `onMouseDown()` | Handle mouse down (start draw/drag/resize) |
| `onMouseMove()` | Handle mouse move (preview/drag/resize) |
| `onMouseUp()` | Handle mouse up (complete operation) |
| `selectField(field)` | Set selected field |
| `deleteSelectedField()` | Delete currently selected field |
| `toggleGrid()` | Show/hide coordinate grid |
| `undo()` | Undo last operation |
| `redo()` | Redo last undone operation |
| `exportFields()` | Export configuration as JSON |
| `importFields(event)` | Import configuration from JSON |
| `showJsonModal()` | Display JSON in modal |

**UI Sections:**
- **Left Sidebar**: Field type selection with grouped categories
- **Center Canvas**: PDF rendering with overlay for field interaction
- **Right Sidebar**: Selected field properties and field list


---

## Services & State Management

### 1. PdfFieldService

**File:** `pdf-field.service.ts` (~250 lines)

**Responsibility:**
- Core field state management
- Integration with history service
- Field CRUD operations with undo/redo support
- PDF document state
- Viewport management

**State Subjects:**
```typescript
private fieldsSubject = new BehaviorSubject<Field[]>([]);
fields$: Observable<Field[]> = this.fieldsSubject.asObservable();

private pdfDocumentSubject = new BehaviorSubject<any>(null);
pdfDocument$: Observable<any> = this.pdfDocumentSubject.asObservable();

private currentPageSubject = new BehaviorSubject<number>(1);
currentPage$: Observable<number> = this.currentPageSubject.asObservable();

private currentViewportSubject = new BehaviorSubject<any>(null);
currentViewport$: Observable<any> = this.currentViewportSubject.asObservable();
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `addField(field, useHistory)` | Add new field with optional history |
| `updateField(id, updates, useHistory)` | Update existing field |
| `deleteField(id, useHistory)` | Remove field from state |
| `moveField(id, left, top, useHistory)` | Move field to new position |
| `resizeField(id, bounds, useHistory)` | Resize field dimensions |
| `setFields(fields)` | Replace all fields (for import) |
| `setPdfDocument(doc)` | Set loaded PDF document |
| `setCurrentPage(page)` | Set active page number |
| `setCurrentViewport(viewport)` | Set PDF.js viewport |
| `exportToViewModelFormat(docType)` | Convert to Adobe Sign format |
| `importFromViewModelFormat(data, viewport, docType)` | Import from Adobe Sign format |
| `pixelsToPoints(pixels, scale)` | Convert pixels to points |
| `convertYCoordinate(y, height, viewport, docType)` | Handle coordinate systems |

---

### 2. HistoryService

**File:** `history.service.ts` (243 lines)

**Responsibility:**
- Undo/redo functionality using command pattern
- Command execution and management
- History stack maintenance
- Observable state for UI updates

**Command Types:**
- `AddFieldCommand` - Adding fields
- `DeleteFieldCommand` - Deleting fields
- `UpdateFieldCommand` - Updating field properties
- `MoveFieldCommand` - Moving fields
- `ResizeFieldCommand` - Resizing fields

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `executeCommand(command)` | Execute command and add to history |
| `undo()` | Undo last command |
| `redo()` | Redo last undone command |
| `clear()` | Clear all history |
| `getUndoDescription()` | Get description of next undo |
| `getRedoDescription()` | Get description of next redo |
| `getHistorySize()` | Get stack sizes |

**State Observables:**
```typescript
canUndo$: Observable<boolean>;
canRedo$: Observable<boolean>;
```

**Configuration:**
- Max history size: 50 operations
- Undo/redo stacks managed separately
- Redo stack cleared on new operations

---

### 3. CoordinateConversionService

**File:** `coordinate-conversion.service.ts` (79 lines)

**Responsibility:**
- Convert between coordinate systems
- Pixel to point conversions
- Handle TRANSIENT vs LIBRARY coordinate modes
- Snap-to-grid calculations
- Canvas coordinate extraction

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `pixelsToPoints(pixels, scale)` | Convert canvas pixels to PDF points |
| `convertYCoordinate(y, height, viewport, docType)` | Convert Y coordinate based on document type |
| `getCanvasPosition(fieldTop, viewport, docType)` | Calculate canvas position for field |
| `getYMultiplier(documentType)` | Get Y-axis direction multiplier |
| `snapToGrid(value, gridSize, enabled)` | Snap coordinate to grid |
| `getCanvasCoordinates(event, canvas)` | Extract coordinates from mouse event |

---

### 4. FieldInteractionService

**File:** `field-interaction.service.ts` (270 lines)

**Responsibility:**
- Manage field drag operations
- Manage field resize operations
- Handle resize handles
- Calculate cursor styles
- Track interaction state

**Interaction State:**
```typescript
interface InteractionState {
  isDragging: boolean;
  isResizing: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragFieldStartPos: { left: number; top: number } | null;
  resizeHandle: string | null;
  resizeStartBounds: { left: number; top: number; width: number; height: number } | null;
}
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `startDrag(field, x, y)` | Begin drag operation |
| `startResize(field, handle, x, y)` | Begin resize operation |
| `calculateDragPosition(...)` | Calculate new position during drag |
| `calculateResizeBounds(...)` | Calculate new bounds during resize |
| `completeDrag()` | Finish drag, return start position |
| `completeResize()` | Finish resize, return start bounds |
| `cancelOperation()` | Cancel current operation |
| `getResizeHandleAtPoint(...)` | Detect resize handle under cursor |
| `getCursorStyle(...)` | Determine appropriate cursor |

**Resize Handles:**
- 8 handles: tl, t, tr, r, br, b, bl, l
- Corresponding cursors: nwse-resize, ns-resize, nesw-resize, ew-resize

---

### 5. CanvasRendererService

**File:** `canvas-renderer.service.ts` (223 lines)

**Responsibility:**
- Canvas drawing operations
- Render fields on overlay canvas
- Draw coordinate grid
- Draw selection handles
- Draw field previews
- Hit detection for field selection

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `clearCanvas(canvas)` | Clear entire canvas |
| `drawGrid(ctx, viewport, docType)` | Draw coordinate grid overlay |
| `drawField(ctx, field, viewport, ...)` | Draw single field with all decorations |
| `drawSelectionHandles(ctx, left, top, width, height)` | Draw 8 resize handles |
| `drawFieldPreview(ctx, startX, startY, currentX, currentY, ...)` | Draw preview during field creation |
| `isPointInField(x, y, field, viewport, docType)` | Check if point is inside field bounds |

**Drawing Features:**
- Color-coded fields by type
- Selection highlights (blue border)
- Hover highlights (lighter blue)
- Field name display
- Recipient label display
- Coordinate display
- Required indicator (red asterisk)

---

### 6. FieldTypeService

**File:** `field-type.service.ts` (103 lines)

**Responsibility:**
- Define all supported field type combinations
- Group field types by category
- Provide field metadata (icons, colors)
- Generate smart field names
- Centralize field type configuration

**Field Type Groups:**
- Text Fields (4 types)
- Signature Fields (2 types)
- Date Fields (3 types)
- Other Fields (2 types)

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `getFieldTypeCombinations()` | Get all field type combinations |
| `getFieldTypeGroups()` | Get grouped field types |
| `getFieldTypeByKey(key)` | Find field type by key |
| `getFieldColor(field)` | Get color for field type |
| `getFieldIcon(field)` | Get icon for field type |
| `generateSmartFieldName(inputType, contentType, existingFields)` | Generate unique field name |

---

## Data Models

### Field Interface

**File:** `field.model.ts`

```typescript
export interface Field {
  id: string;                           // Unique identifier (UI only)
  name: string;                         // Field name
  inputType: FormFieldInputType;        // Input type (TEXT_FIELD, CHECKBOX, etc.)
  contentType?: FormFieldContentType;   // Content type (DATA, SIGNATURE, etc.)
  required: boolean;                    // Is field required?
  locations: FormFieldLocation;         // Single location object
  recipientIndex: number;               // Recipient assignment (1 = SIGNER, 2 = APPROVER)
  validation: string;                   // Validation type (regex, date format, etc.)
  validationData: string;               // Validation pattern/data
  readOnly?: boolean;                   // Is field read-only?
}
```

### FormFieldLocation Interface

```typescript
export interface FormFieldLocation {
  pageNumber: number;                   // 1-based page index
  left: number;                         // Left coordinate (PDF points)
  top: number;                          // Top coordinate (PDF points)
  width: number;                        // Field width (PDF points)
  height: number;                       // Field height (PDF points)
}
```

### Enums

**FormFieldInputType:**
```typescript
export enum FormFieldInputType {
  TEXT_FIELD = 'TEXT_FIELD',
  MULTILINE = 'MULTILINE',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DROP_DOWN = 'DROP_DOWN',
  SIGNATURE = 'SIGNATURE',
  DATE = 'DATE',
  HYPERLINK = 'HYPERLINK',
  IMAGE = 'IMAGE'
}
```

**FormFieldContentType:**
```typescript
export enum FormFieldContentType {
  DATA = 'DATA',
  SIGNATURE = 'SIGNATURE',
  SIGNER_INITIALS = 'SIGNER_INITIALS',
  SIGNER_NAME = 'SIGNER_NAME',
  SIGNER_EMAIL = 'SIGNER_EMAIL',
  SIGNATURE_DATE = 'SIGNATURE_DATE',
  SIGNER_TITLE = 'SIGNER_TITLE',
  SIGNER_COMPANY = 'SIGNER_COMPANY',
  IMAGE = 'IMAGE',
  QR_CODE = 'QR_CODE',
  HYPERLINK = 'HYPERLINK'
}
```

**AdobeDocumentType:**
```typescript
export enum AdobeDocumentType {
  LIBRARY='LIBRARY',        // Top-origin coordinate system
  TRANSIENT='TRANSIENT'     // Bottom-origin coordinate system
}
```

### FieldTypeCombination

```typescript
export interface FieldTypeCombination {
  label: string;                        // Display label
  inputType: FormFieldInputType;        // Input type
  contentType?: FormFieldContentType;   // Content type
  icon: string;                         // Ant Design icon name
  color: string;                        // Color code for UI
  validation: string;                   // Default validation type
  validationData: string;               // Default validation data
  readOnly?: boolean;                   // Is read-only by default?
}
```

### Adobe Sign ViewModel Format

```typescript
export interface IFormFieldGeneratorViewModel {
  name: string;                         // Field name
  inputType: FormFieldInputType;        // Input type
  contentType?: FormFieldContentType;   // Content type
  required: boolean;                    // Is required?
  validation: string;                   // Validation type
  validationData: string;               // Validation data
  readOnly?: boolean;                   // Is read-only?
  locations: [{                         // Array of locations
    pageNumber: number;
    left: number;
    top: number;
    width: number;
    height: number;
  }];
}
```

---

## Configuration

### Angular Configuration (angular.json)

**Project Settings:**
- Project type: `application`
- Source root: `src`
- Component style: `less`
- Output path: `dist/pdf-field-mapper`

**Assets:**
```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  },
  {
    "glob": "**/*",
    "input": "./node_modules/@ant-design/icons-angular/src/inline-svg/",
    "output": "/assets/"
  },
  {
    "glob": "pdf.worker.min.mjs",
    "input": "node_modules/pdfjs-dist/build/",
    "output": "assets/pdfjs/"
  }
]
```

**Styles:**
```json
"styles": [
  "./node_modules/ng-zorro-antd/ng-zorro-antd.min.css",
  "src/styles.less"
]
```

**Build Budgets:**
- Initial bundle: 2MB warning, 5MB error
- Component styles: 4KB warning, 8KB error

### TypeScript Configuration (tsconfig.json)

**Compiler Options:**
```json
{
  "target": "ES2022",
  "module": "ES2022",
  "strict": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "experimentalDecorators": true,
  "moduleResolution": "bundler",
  "esModuleInterop": true
}
```

---

## Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @angular/animations | ^20.3.14 | Animation support |
| @angular/common | ^20.3.14 | Common directives and pipes |
| @angular/compiler | ^20.3.14 | Template compiler |
| @angular/core | ^20.3.14 | Core framework |
| @angular/forms | ^20.3.14 | Form handling |
| @angular/platform-browser | ^20.3.14 | Browser platform |
| @angular/platform-browser-dynamic | ^20.3.14 | Dynamic browser platform |
| @angular/router | ^20.3.14 | Routing |
| ng-zorro-antd | ^20.4.2 | UI components |
| pdfjs-dist | ^5.3.31 | PDF rendering |
| rxjs | ~7.8.0 | Reactive programming |
| tslib | ^2.3.0 | TypeScript runtime |
| zone.js | ~0.15.0 | Zone management |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @angular-devkit/build-angular | ^20.3.12 | Build system |
| @angular/cli | ^20.3.12 | CLI tools |
| @angular/compiler-cli | ^20.3.14 | Compiler CLI |
| @types/jasmine | ~5.1.0 | Jasmine type definitions |
| jasmine-core | ~5.6.0 | Testing framework |
| karma | ~6.4.0 | Test runner |
| karma-chrome-launcher | ~3.2.0 | Chrome launcher |
| karma-coverage | ~2.2.0 | Code coverage |
| karma-jasmine | ~5.1.0 | Jasmine for Karma |
| karma-jasmine-html-reporter | ~2.1.0 | HTML test reporter |
| typescript | 5.8 | TypeScript compiler |

---

## Build & Development

### NPM Scripts

```json
{
  "ng": "ng",
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test"
}
```

### Development Workflow

**1. Start Development Server:**
```bash
npm start
```
- Runs on `http://localhost:4200`
- Auto-reloads on file changes
- Hot module replacement enabled

**2. Build for Production:**
```bash
npm run build
```
- Output: `dist/pdf-field-mapper/`
- Production optimizations enabled
- Bundle size budgets enforced

**3. Watch Mode:**
```bash
npm run watch
```
- Continuous builds during development
- Source maps enabled
- No optimization

**4. Run Tests:**
```bash
npm test
```
- Karma test runner
- Chrome launcher
- Coverage reporting

### VS Code Configuration

**Tasks (.vscode/tasks.json):**
- `npm: start` - Start dev server
- `npm: test` - Run tests
- Background task monitoring

**Launch (.vscode/launch.json):**
- Chrome debugging configuration
- Source map support

---

## Coordinate Systems

### Three Coordinate Systems

The application handles three different coordinate systems:

#### 1. Browser Pixel Coordinates
- **Origin:** Top-left (0, 0)
- **Units:** Pixels
- **Used for:** Mouse events, canvas drawing

#### 2. PDF.js Viewport Coordinates
- **Origin:** Top-left (0, 0)
- **Units:** Scaled pixels (affected by zoom level)
- **Used for:** PDF rendering, field display

#### 3. Adobe Sign PDF Points
- **Units:** Points (1/72 inch)
- **Two variants:**
  - **TRANSIENT:** Origin at bottom-left (Y increases upward)
  - **LIBRARY:** Origin at top-left (Y increases downward)

### Conversion Functions

**Pixels to Points:**
```typescript
pixelsToPoints(pixels: number, scale: number): number {
  return pixels / scale;
}
```

**Y-Coordinate Conversion:**
```typescript
convertYCoordinate(
  y: number,
  height: number,
  viewport: any,
  documentType: AdobeDocumentType
): number {
  if (documentType === AdobeDocumentType.LIBRARY) {
    // Top-origin: direct conversion
    return y / viewport.scale;
  } else {
    // Bottom-origin: flip Y-axis
    const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
    const yInPoints = y / viewport.scale;
    return pageHeightInPoints - yInPoints;
  }
}
```

**Get Canvas Position:**
```typescript
getCanvasPosition(
  fieldTop: number,
  viewport: any,
  documentType: AdobeDocumentType
): number {
  if (documentType === AdobeDocumentType.LIBRARY) {
    return fieldTop * viewport.scale;
  } else {
    const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
    const topInPoints = pageHeightInPoints - fieldTop;
    return topInPoints * viewport.scale;
  }
}
```

### Coordinate Flow

```
Mouse Event (pixels)
    ↓
Extract canvas coordinates (relative to canvas element)
    ↓
Convert to PDF points (divide by scale)
    ↓
Convert Y-axis based on document type (LIBRARY vs TRANSIENT)
    ↓
Store in Field object
```

---

## Adobe Sign Integration

### Export Format

The application exports fields in Adobe Sign's API format:

```json
{
  "formFields": [
    {
      "name": "text_field_1",
      "inputType": "TEXT_FIELD",
      "contentType": "DATA",
      "required": true,
      "validation": "",
      "validationData": "",
      "readOnly": false,
      "locations": [
        {
          "pageNumber": 1,
          "left": 100.5,
          "top": 200.3,
          "width": 150.0,
          "height": 30.0
        }
      ]
    }
  ]
}
```

### Field Properties Mapping

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Unique field identifier |
| `inputType` | Enum | Field input type (TEXT_FIELD, CHECKBOX, etc.) |
| `contentType` | Enum | Content type (DATA, SIGNATURE, etc.) |
| `required` | Boolean | Is field mandatory? |
| `validation` | String | Validation rule type (REGEX, DATE, etc.) |
| `validationData` | String | Validation pattern/data |
| `readOnly` | Boolean | Is field non-editable? |
| `locations` | Array | Field positions (supports multi-location) |
| `pageNumber` | Number | 1-based page index |
| `left/top` | Number | PDF points from origin |
| `width/height` | Number | Field dimensions in points |

### Recipient Support

Fields can be assigned to different recipients using `recipientIndex`:
- **Index 1:** Primary signer (SIGNER role)
- **Index 2+:** Additional signers or approvers

### Document Types

- **TRANSIENT**: Temporary documents, bottom-left origin
- **LIBRARY**: Template documents, top-left origin

---

## Future Enhancements

### Planned Features

1. **Multi-Select Fields**
   - Select multiple fields with Ctrl+Click or drag selection box
   - Bulk editing of properties
   - Group operations (align, distribute, delete)

2. **Field Alignment Tools**
   - Align multiple fields (left, right, top, bottom, center)
   - Distribute evenly (horizontal/vertical)
   - Smart guides and snapping
   - Equal spacing

3. **Field Templates**
   - Pre-defined field sets (name/address block, signature block)
   - Template library management
   - Custom template creation and saving
   - Import/export templates

4. **Advanced Validation**
   - Visual validation rule builder
   - Common patterns (email, phone, SSN)
   - Custom regex with testing

5. **Field Duplication**
   - Duplicate selected field(s)
   - Copy/paste functionality with keyboard shortcuts
   - Paste with offset to avoid overlap

6. **PDF Annotations**
   - Add comments
   - Highlight areas
   - Sticky notes

7. **Enhanced Keyboard Shortcuts**
   - Delete selected field (Delete key)
   - Select all (Ctrl+A)
   - Deselect (Esc)
   - Arrow keys for precise positioning
   - Zoom controls (+/-)

8. **Export Formats**
   - Multiple export formats (Adobe Sign, DocuSign, HelloSign)
   - PDF with embedded form fields
   - Excel/CSV field list
   - Field summary report

9. **Field Grouping**
   - Group related fields
   - Collapse/expand groups
   - Move groups together
   - Group-level properties

10. **Field Validation Preview**
    - Test validation rules
    - Preview field behavior
    - Mock data entry

### Technical Improvements

1. **Performance Optimization**
   - Virtual scrolling for large field lists
   - Canvas rendering optimization
   - Lazy loading for multi-page PDFs

2. **Testing**
   - Unit tests for services
   - Component tests
   - E2E tests with Cypress

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

4. **Mobile Support**
   - Touch event handling
   - Responsive design improvements
   - Mobile-optimized UI

5. **Error Handling**
   - User-friendly error messages
   - Retry mechanisms
   - Error logging

---

## Development Guidelines

### Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Prefer reactive patterns (RxJS)
- Use standalone components
- Implement OnPush change detection where applicable

### Service Architecture

- Single Responsibility Principle for each service
- Use dependency injection
- Keep services stateless where possible
- Use BehaviorSubject for state management
- Provide services at root level

### Component Organization

- Keep components focused and single-responsibility
- Use services for shared state and business logic
- Prefer composition over inheritance
- Use smart/dumb component pattern where appropriate
- Minimize component coupling

### Testing Strategy

- Unit tests for all services (business logic)
- Component tests for UI behavior
- Integration tests for service interactions
- E2E tests for critical user workflows
- Maintain >80% code coverage

### Git Workflow

- Feature branches from main
- Descriptive commit messages (conventional commits)
- Pull requests for code review
- Semantic versioning
- Keep commits atomic and focused

---

## Troubleshooting

### Common Issues

**PDF not loading:**
- Check PDF.js worker URL configuration
- Verify file is valid PDF format
- Check browser console for errors
- Ensure PDF.js worker file is accessible

**Fields not displaying:**
- Verify canvas overlay is rendering
- Check field coordinates are within page bounds
- Ensure scale is properly applied
- Verify viewport is set correctly

**Export format incorrect:**
- Verify document type matches coordinate system
- Check field validation
- Ensure all required properties are set
- Test with Adobe Sign API

**Performance issues:**
- Reduce scale for large PDFs
- Limit number of grid lines
- Optimize canvas redraw frequency
- Consider implementing virtual scrolling

**Undo/Redo not working:**
- Check history service initialization
- Verify commands are using history correctly
- Check for operations bypassing history
- Clear history if it becomes corrupted

---

## License

[Specify license here]

---

## Contributors

- **Misu Varga** - Initial development and architecture
- [List other contributors here]

---

## Contact

For questions, support, or contributions:
- Website: [misu-varga.com](https://misu-varga.com)
- Live Demo: [pdfmapper.misuvarga.com](https://pdfmapper.misuvarga.com/)
- Article: [Read about this project](https://misu-varga.com/blog/article/15)

---

**Last Updated:** December 2025
**Version:** 2.0.0
**Angular Version:** 20.3.14
**PDF.js Version:** 5.3.31
**ng-zorro-antd Version:** 20.4.2
