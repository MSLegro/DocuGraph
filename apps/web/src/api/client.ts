import type {
  TreeResponse,
  CompileResult,
  DiagramContentResponse
} from '../types';

const API_BASE = '/api';

export class ApiClient {
  public static async getTree(folderPath: string = ''): Promise<TreeResponse> {
    const params = new URLSearchParams();
    if (folderPath) {
      params.set('folder', folderPath);
    }
    const res = await fetch(`${API_BASE}/tree?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to load directory tree (${res.status})`);
    }
    return res.json();
  }

  public static async createDiagram(
    title: string,
    code: string,
    folderPath: string = '',
    theme?: import('../types').MermaidTheme
  ): Promise<CompileResult> {
    const res = await fetch(`${API_BASE}/diagrams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, code, folderPath, theme })
    });

    const data = await res.json();

    if (!res.ok) {
      // 422 Unprocessable Entity or 400
      return {
        success: false,
        error: data.error || `Server responded with status ${res.status}`
      };
    }

    return data;
  }

  public static async createFolder(
    parentFolder: string = '',
    folderName: string
  ): Promise<{ success: boolean; folderPath: string }> {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parentFolder, folderName })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create folder');
    }

    return data;
  }

  public static async renameFolder(
    folderPath: string,
    newName: string
  ): Promise<{ success: boolean; folderPath: string }> {
    const res = await fetch(`${API_BASE}/folders/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderPath, newName })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to rename folder');
    }

    return data;
  }

  public static async deleteFolder(
    folderPath: string
  ): Promise<{ success: boolean; message?: string }> {
    const params = new URLSearchParams({ folder: folderPath });
    const res = await fetch(`${API_BASE}/folders?${params.toString()}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete folder');
    }

    return data;
  }

  public static async getDiagramContent(
    id: string,
    folderPath: string = ''
  ): Promise<DiagramContentResponse> {
    const params = new URLSearchParams();
    if (folderPath) {
      params.set('folder', folderPath);
    }
    const res = await fetch(`${API_BASE}/diagrams/${id}/content?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to load diagram content (${res.status})`);
    }
    return res.json();
  }

  public static async updateDiagram(
    id: string,
    title: string,
    code: string,
    folderPath: string = '',
    theme?: import('../types').MermaidTheme
  ): Promise<CompileResult> {
    const res = await fetch(`${API_BASE}/diagrams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, code, folderPath, theme })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Server responded with status ${res.status}`
      };
    }
    return data;
  }

  public static async deleteDiagram(
    id: string,
    folderPath: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    const params = new URLSearchParams();
    if (folderPath) {
      params.set('folder', folderPath);
    }
    const res = await fetch(`${API_BASE}/diagrams/${id}?${params.toString()}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Failed to delete diagram (${res.status})`
      };
    }
    return data;
  }
}

