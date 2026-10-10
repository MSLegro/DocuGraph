import React, { createContext, useContext, useState } from 'react';

export type Language = 'es' | 'en';

export interface Translations {
  // Brand
  brandSubtitle: string;
  
  // Navigation & TopBar
  rootFolder: string;
  favorites: string;
  newFolder: string;
  newDiagram: string;
  showAll: string;
  showFavoritesOnly: string;
  switchTheme: string;
  themeTokyo: string;
  themeDarkSlate: string;
  themeLightSlate: string;
  
  // Folders
  foldersTitle: string;
  emptyFolder: string;
  diagramCountSingular: string;
  diagramCountPlural: string;
  renameFolder: string;
  deleteFolder: string;
  addToFavorites: string;
  removeFromFavorites: string;

  // Diagrams
  diagramsTitle: string;
  noDiagramsFound: string;
  noDiagramsSubtitle: string;
  createFirstDiagram: string;
  previewTooltip: string;
  editCanvasTooltip: string;
  deleteDiagramTooltip: string;
  lastUpdated: string;

  // Modal: New Folder
  modalNewFolderTitle: string;
  modalNewFolderSubtitle: string;
  folderNameLabel: string;
  folderNamePlaceholder: string;
  insideFolder: string;
  btnCancel: string;
  btnCreateFolder: string;
  btnCreating: string;

  // Modal: Rename Folder
  modalRenameFolderTitle: string;
  modalRenameFolderSubtitle: string;
  newFolderNameLabel: string;
  currentFolderLabel: string;
  btnSaveChanges: string;
  btnRenaming: string;

  // Modal: Delete Folder
  modalDeleteFolderTitle: string;
  modalDeleteFolderSubtitle: string;
  modalDeleteFolderConfirm: string;
  modalDeleteFolderWarningCount: string;
  modalDeleteFolderWarningSingular: string;
  relativeStoragePath: string;
  btnDeleteFolder: string;
  btnDeleting: string;

  // Modal: Delete Diagram
  modalDeleteDiagramTitle: string;
  modalDeleteDiagramSubtitle: string;
  modalDeleteDiagramConfirm: string;
  modalDeleteDiagramUndone: string;
  filesToBeRemoved: string;
  btnDeleteDiagram: string;

  // Modal: New Diagram
  modalNewDiagramTitle: string;
  modalNewDiagramSubtitle: string;
  targetFolder: string;
  diagramTitleLabel: string;
  diagramTitlePlaceholder: string;
  diagramThemeLabel: string;
  quickTemplatesLabel: string;
  diagramSourceCodeLabel: string;
  diagramSourceCodePlaceholder: string;
  btnCreateAndCompile: string;
  btnCompiling: string;
  btnCompileAndSave: string;

  // Modal: Viewer
  tabVectorSvg: string;
  tabDiagramCode: string;
  canvasContrast: string;
  btnOpenInCanvas: string;
  btnCopyCode: string;
  btnCopied: string;
  btnDownload: string;
  btnClose: string;
  noSvgPreview: string;
  loadingDiagram: string;
  noSourceCodeAvailable: string;

  // Canvas Editor
  canvasCodeEditorTitle: string;
  pressCtrlSToCompile: string;
  linesCount: string;
  btnSaveCompile: string;
  syntaxErrorTitle: string;
  panToolTooltip: string;
  zoomOutTooltip: string;
  zoomInTooltip: string;
  resetViewTooltip: string;
  fitToScreenTooltip: string;
  fullScreenTooltip: string;
  exitFullScreenTooltip: string;
  dragToPanHint: string;
  wheelZoomHint: string;
  noSvgAvailableCanvas: string;
  loadingCanvas: string;
  exitCanvasTooltip: string;
  collapseEditorPanel: string;
  expandEditorPanel: string;
  statusSaved: string;
  statusUnsaved: string;
  canvasEditorBtn: string;

  // Snippets
  snippetNode: string;
  snippetDecision: string;
  snippetDatabase: string;
  snippetSubgraph: string;

  // Theme labels
  themeDark: string;
  themeDefault: string;
  themeNeutral: string;
  themeForest: string;

  // Favorites & App View
  favoriteItems: string;
  favoriteItemsSubtitle: string;
  backToFolderBrowser: string;
  loadingFavorites: string;
  noFavoritesYet: string;
  noFavoritesSubtitle: string;
  browseAllFiles: string;
  connectingStorage: string;
  connectionError: string;
  retry: string;
  footerText: string;
}

const translations: Record<Language, Translations> = {
  es: {
    brandSubtitle: 'Motor de Diagramas Local-First',
    rootFolder: 'Inicio',
    favorites: 'Favoritos',
    newFolder: 'Nueva carpeta',
    newDiagram: 'Nuevo diagrama',
    showAll: 'Mostrar todos los diagramas y carpetas',
    showFavoritesOnly: 'Mostrar solo favoritos',
    switchTheme: 'Cambiar a',
    themeTokyo: 'Dark Tokyo',
    themeDarkSlate: 'Pizarra Oscuro',
    themeLightSlate: 'Pizarra Claro',
    foldersTitle: 'Carpetas',
    emptyFolder: 'Carpeta vacía',
    diagramCountSingular: 'diagrama',
    diagramCountPlural: 'diagramas',
    renameFolder: 'Renombrar',
    deleteFolder: 'Eliminar',
    addToFavorites: 'Agregar a favoritos',
    removeFromFavorites: 'Quitar de favoritos',
    diagramsTitle: 'Diagramas',
    noDiagramsFound: 'No se encontraron diagramas',
    noDiagramsSubtitle: 'Aún no hay diagramas en este directorio. Crea tu primer diagrama o explora otras carpetas.',
    createFirstDiagram: 'Crear primer diagrama',
    previewTooltip: 'Vista previa',
    editCanvasTooltip: 'Editar en Lienzo',
    deleteDiagramTooltip: 'Eliminar diagrama',
    lastUpdated: 'Actualizado',
    modalNewFolderTitle: 'Nueva Carpeta',
    modalNewFolderSubtitle: 'Crea un directorio para organizar tus diagramas',
    folderNameLabel: 'Nombre de la Carpeta',
    folderNamePlaceholder: 'ej. microservicios, infraestructura, flujos',
    insideFolder: 'Dentro de:',
    btnCancel: 'Cancelar',
    btnCreateFolder: 'Crear Carpeta',
    btnCreating: 'Creando...',
    modalRenameFolderTitle: 'Renombrar Carpeta',
    modalRenameFolderSubtitle: 'Cambia el nombre de la carpeta y actualiza sus rutas',
    newFolderNameLabel: 'Nuevo Nombre de Carpeta',
    currentFolderLabel: 'Actual:',
    btnSaveChanges: 'Guardar Cambios',
    btnRenaming: 'Renombrando...',
    modalDeleteFolderTitle: 'Eliminar Carpeta',
    modalDeleteFolderSubtitle: 'Esto eliminará la carpeta y todo su contenido.',
    modalDeleteFolderConfirm: '¿Estás seguro de que deseas eliminar la carpeta',
    modalDeleteFolderWarningCount: '⚠️ Advertencia: Esta carpeta contiene {count} diagramas que también serán eliminados de forma permanente.',
    modalDeleteFolderWarningSingular: '⚠️ Advertencia: Esta carpeta contiene 1 diagrama que también será eliminado de forma permanente.',
    relativeStoragePath: 'Ruta relativa de almacenamiento:',
    btnDeleteFolder: 'Eliminar Carpeta',
    btnDeleting: 'Eliminando...',
    modalDeleteDiagramTitle: 'Eliminar Diagrama',
    modalDeleteDiagramSubtitle: 'Esta acción no se puede deshacer.',
    modalDeleteDiagramConfirm: '¿Estás seguro de que deseas eliminar permanentemente',
    modalDeleteDiagramUndone: 'Esta acción no se puede deshacer y eliminará el código fuente y el SVG.',
    filesToBeRemoved: 'Archivos que se eliminarán permanentemente:',
    btnDeleteDiagram: 'Eliminar Diagrama',
    modalNewDiagramTitle: 'Nuevo Diagrama',
    modalNewDiagramSubtitle: 'Crea y compila un nuevo diagrama vectorial',
    targetFolder: 'Carpeta destino:',
    diagramTitleLabel: 'Título del Diagrama',
    diagramTitlePlaceholder: 'ej. Arquitectura de Autenticación',
    diagramThemeLabel: 'Tema del Diagrama',
    quickTemplatesLabel: 'Plantillas Rápidas',
    diagramSourceCodeLabel: 'Código Fuente del Diagrama (.mmd)',
    diagramSourceCodePlaceholder: 'Escribe la sintaxis de tu diagrama aquí...',
    btnCreateAndCompile: 'Crear y Compilar',
    btnCompiling: 'Compilando...',
    btnCompileAndSave: 'Compilar y Guardar',
    tabVectorSvg: 'Vector SVG',
    tabDiagramCode: 'Código del Diagrama',
    canvasContrast: 'Contraste del Lienzo',
    btnOpenInCanvas: 'Abrir en Lienzo',
    btnCopyCode: 'Copiar .mmd',
    btnCopied: '¡Copiado!',
    btnDownload: 'Descargar',
    btnClose: 'Cerrar',
    noSvgPreview: 'No se encontró vista previa SVG.',
    loadingDiagram: 'Cargando detalles del diagrama...',
    noSourceCodeAvailable: 'No hay código fuente disponible.',
    canvasCodeEditorTitle: 'Editor de Código',
    pressCtrlSToCompile: 'Presiona Ctrl+S para compilar',
    linesCount: 'líneas',
    btnSaveCompile: 'Guardar (Ctrl+S)',
    syntaxErrorTitle: 'Error de Sintaxis (422)',
    panToolTooltip: 'Herramienta Mano',
    zoomOutTooltip: 'Alejar Zoom',
    zoomInTooltip: 'Acercar Zoom',
    resetViewTooltip: 'Restablecer Vista (1:1)',
    fitToScreenTooltip: 'Ajustar a Pantalla',
    fullScreenTooltip: 'Pantalla Completa',
    exitFullScreenTooltip: 'Salir de Pantalla Completa',
    dragToPanHint: 'Arrastra para mover',
    wheelZoomHint: 'Rueda del ratón acerca al cursor',
    noSvgAvailableCanvas: 'No hay salida SVG disponible. Escribe código y presiona Guardar.',
    loadingCanvas: 'Cargando lienzo...',
    exitCanvasTooltip: 'Salir del Lienzo (Esc)',
    collapseEditorPanel: 'Ocultar panel de editor',
    expandEditorPanel: 'Mostrar panel de editor',
    statusSaved: 'Guardado',
    statusUnsaved: 'Sin guardar',
    canvasEditorBtn: 'Editor en Lienzo',
    snippetNode: '+ Nodo',
    snippetDecision: '+ Decisión',
    snippetDatabase: '+ Base de Datos',
    snippetSubgraph: '+ Subgrafo',
    themeDark: 'Oscuro',
    themeDefault: 'Por defecto',
    themeNeutral: 'Neutro',
    themeForest: 'Bosque',
    favoriteItems: 'Elementos Favoritos',
    favoriteItemsSubtitle: 'Acceso rápido a todos tus diagramas y carpetas destacados en el proyecto.',
    backToFolderBrowser: '← Volver al explorador de carpetas',
    loadingFavorites: 'Cargando favoritos...',
    noFavoritesYet: 'Aún no hay favoritos',
    noFavoritesSubtitle: 'Haz clic en la estrella de cualquier diagrama o carpeta para agregarlo a favoritos y acceder rápidamente.',
    browseAllFiles: 'Explorar todos los archivos',
    connectingStorage: 'Conectando con el motor de almacenamiento local...',
    connectionError: 'Error de Conexión',
    retry: 'Reintentar',
    footerText: 'DocuGraph • Motor de Diagramas Local-First • Código Abierto (MIT/Apache 2.0)'
  },
  en: {
    brandSubtitle: 'Local-First Diagram Engine',
    rootFolder: 'Root',
    favorites: 'Favorites',
    newFolder: 'New folder',
    newDiagram: 'New diagram',
    showAll: 'Show all diagrams and folders',
    showFavoritesOnly: 'Show favorites only',
    switchTheme: 'Switch to',
    themeTokyo: 'Dark Tokyo',
    themeDarkSlate: 'Dark Slate',
    themeLightSlate: 'Light Slate',
    foldersTitle: 'Folders',
    emptyFolder: 'Empty folder',
    diagramCountSingular: 'diagram',
    diagramCountPlural: 'diagrams',
    renameFolder: 'Rename',
    deleteFolder: 'Delete',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    diagramsTitle: 'Diagrams',
    noDiagramsFound: 'No diagrams found',
    noDiagramsSubtitle: 'There are no diagrams in this directory yet. Create your first diagram or explore other folders.',
    createFirstDiagram: 'Create first diagram',
    previewTooltip: 'Preview',
    editCanvasTooltip: 'Edit in Canvas',
    deleteDiagramTooltip: 'Delete diagram',
    lastUpdated: 'Updated',
    modalNewFolderTitle: 'New Folder',
    modalNewFolderSubtitle: 'Create a directory to organize your diagrams',
    folderNameLabel: 'Folder Name',
    folderNamePlaceholder: 'e.g. architecture, flows, microservices',
    insideFolder: 'Inside:',
    btnCancel: 'Cancel',
    btnCreateFolder: 'Create Folder',
    btnCreating: 'Creating...',
    modalRenameFolderTitle: 'Rename Folder',
    modalRenameFolderSubtitle: 'Change folder name and update its paths',
    newFolderNameLabel: 'New Folder Name',
    currentFolderLabel: 'Current:',
    btnSaveChanges: 'Save Changes',
    btnRenaming: 'Renaming...',
    modalDeleteFolderTitle: 'Delete Folder',
    modalDeleteFolderSubtitle: 'This will delete the folder and its contents.',
    modalDeleteFolderConfirm: 'Are you sure you want to delete folder',
    modalDeleteFolderWarningCount: '⚠️ Warning: This folder contains {count} diagrams that will also be permanently deleted.',
    modalDeleteFolderWarningSingular: '⚠️ Warning: This folder contains 1 diagram that will also be permanently deleted.',
    relativeStoragePath: 'Relative storage path:',
    btnDeleteFolder: 'Delete Folder',
    btnDeleting: 'Deleting...',
    modalDeleteDiagramTitle: 'Delete Diagram',
    modalDeleteDiagramSubtitle: 'This action cannot be undone.',
    modalDeleteDiagramConfirm: 'Are you sure you want to permanently delete',
    modalDeleteDiagramUndone: 'This action cannot be undone and will delete source code and SVG.',
    filesToBeRemoved: 'Files to be permanently removed:',
    btnDeleteDiagram: 'Delete Diagram',
    modalNewDiagramTitle: 'New Diagram',
    modalNewDiagramSubtitle: 'Create and compile a new vector diagram',
    targetFolder: 'Target folder:',
    diagramTitleLabel: 'Diagram Title',
    diagramTitlePlaceholder: 'e.g. Authentication Flow Architecture',
    diagramThemeLabel: 'Diagram Theme',
    quickTemplatesLabel: 'Quick Templates',
    diagramSourceCodeLabel: 'Diagram Source Code (.mmd)',
    diagramSourceCodePlaceholder: 'Type your diagram syntax here...',
    btnCreateAndCompile: 'Create & Compile',
    btnCompiling: 'Compiling...',
    btnCompileAndSave: 'Compile & Save',
    tabVectorSvg: 'Vector SVG',
    tabDiagramCode: 'Diagram Code',
    canvasContrast: 'Canvas Contrast',
    btnOpenInCanvas: 'Open in Canvas',
    btnCopyCode: 'Copy .mmd',
    btnCopied: 'Copied!',
    btnDownload: 'Download',
    btnClose: 'Close',
    noSvgPreview: 'No SVG preview found.',
    loadingDiagram: 'Loading diagram details...',
    noSourceCodeAvailable: 'No source code available.',
    canvasCodeEditorTitle: 'Diagram Code Editor',
    pressCtrlSToCompile: 'Press Ctrl+S to compile',
    linesCount: 'lines',
    btnSaveCompile: 'Save (Ctrl+S)',
    syntaxErrorTitle: 'Syntax Error (422)',
    panToolTooltip: 'Pan Tool',
    zoomOutTooltip: 'Zoom Out',
    zoomInTooltip: 'Zoom In',
    resetViewTooltip: 'Reset View (1:1)',
    fitToScreenTooltip: 'Fit to Screen',
    fullScreenTooltip: 'Full Screen',
    exitFullScreenTooltip: 'Exit Full Screen',
    dragToPanHint: 'Drag to Pan',
    wheelZoomHint: 'Scroll wheel zooms towards cursor',
    noSvgAvailableCanvas: 'No SVG output available. Write code and press Save.',
    loadingCanvas: 'Loading canvas...',
    exitCanvasTooltip: 'Exit Canvas (Esc)',
    collapseEditorPanel: 'Collapse Editor Panel',
    expandEditorPanel: 'Expand Editor Panel',
    statusSaved: 'Saved',
    statusUnsaved: 'Unsaved',
    canvasEditorBtn: 'Canvas Editor',
    snippetNode: '+ Node',
    snippetDecision: '+ Decision',
    snippetDatabase: '+ Database',
    snippetSubgraph: '+ Subgraph',
    themeDark: 'Dark',
    themeDefault: 'Default',
    themeNeutral: 'Neutral',
    themeForest: 'Forest',
    favoriteItems: 'Favorite Items',
    favoriteItemsSubtitle: 'Quick access to all your starred diagrams and folders across the project.',
    backToFolderBrowser: 'Back to folder browser →',
    loadingFavorites: 'Loading favorites...',
    noFavoritesYet: 'No favorites yet',
    noFavoritesSubtitle: 'Click the star icon on any diagram or folder to add them to your favorites for instant 1-click access.',
    browseAllFiles: 'Browse all files',
    connectingStorage: 'Connecting to local storage engine...',
    connectionError: 'Connection Error',
    retry: 'Retry',
    footerText: 'DocuGraph • Local-First Diagram Manager • Open Source (MIT/Apache 2.0)'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('docugraph_language') as Language;
    return saved === 'en' ? 'en' : 'es'; // default to Spanish
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('docugraph_language', lang);
  };

  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.es;
    let text = dict[key] || translations.es[key] || String(key);
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
