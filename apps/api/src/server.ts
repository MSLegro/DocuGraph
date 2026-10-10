import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import {
  DiagramService,
  FileSystemExplorer,
  getStorageRoot
} from '@docugraph/core';

export async function buildServer() {
  const server = Fastify({
    logger: true
  });

  const storageRoot = path.resolve(getStorageRoot());
  const diagramService = new DiagramService(storageRoot);
  const fsExplorer = new FileSystemExplorer(storageRoot);

  await fsExplorer.ensureStorageRoot();

  // Register CORS to allow requests from frontend (e.g. Vite on localhost:5173)
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Serve storage directory statically for direct asset access if needed
  await server.register(fastifyStatic, {
    root: storageRoot,
    prefix: '/storage-static/',
    decorateReply: false
  });

  // Health check
  server.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // GET /api/tree?folder=<path>
  server.get('/api/tree', async (request, reply) => {
    const query = request.query as { folder?: string };
    const folder = query.folder || '';
    try {
      const tree = await fsExplorer.listFilesAndFolders(folder);
      return tree;
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        error: `Failed to list files and folders: ${err.message}`
      });
    }
  });

  // POST /api/diagrams
  server.post('/api/diagrams', async (request, reply) => {
    const body = request.body as {
      title?: string;
      code?: string;
      folderPath?: string;
      theme?: import('@docugraph/core').MermaidTheme;
    };

    if (!body || !body.title || !body.code) {
      return reply.status(400).send({
        error: 'Both "title" and "code" are required fields.'
      });
    }

    try {
      const result = await diagramService.compileAndSave({
        title: body.title,
        code: body.code,
        folderPath: body.folderPath || '',
        theme: body.theme
      });

      if (!result.success) {
        // Syntax or compilation error -> 422 Unprocessable Entity
        return reply.status(422).send({
          success: false,
          error: result.error || 'Diagram compilation failed.'
        });
      }

      return reply.status(201).send({
        success: true,
        meta: result.meta,
        svgContent: result.svgContent
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        success: false,
        error: `Internal server error: ${err.message}`
      });
    }
  });

  // POST /api/folders
  server.post('/api/folders', async (request, reply) => {
    const body = request.body as {
      parentFolder?: string;
      folderName?: string;
    };

    if (!body || !body.folderName) {
      return reply.status(400).send({
        error: '"folderName" is required.'
      });
    }

    try {
      const createdPath = await fsExplorer.createFolder(
        body.parentFolder || '',
        body.folderName
      );
      return reply.status(201).send({
        success: true,
        folderPath: createdPath
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(400).send({
        error: err.message || 'Failed to create folder.'
      });
    }
  });

  // PUT /api/folders/rename
  server.put('/api/folders/rename', async (request, reply) => {
    const body = request.body as {
      folderPath?: string;
      newName?: string;
    };

    if (!body || !body.folderPath || !body.newName) {
      return reply.status(400).send({
        error: 'Both "folderPath" and "newName" are required.'
      });
    }

    try {
      const newPath = await fsExplorer.renameFolder(body.folderPath, body.newName);
      return reply.status(200).send({
        success: true,
        folderPath: newPath
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(400).send({
        error: err.message || 'Failed to rename folder.'
      });
    }
  });

  // DELETE /api/folders
  server.delete('/api/folders', async (request, reply) => {
    const query = request.query as { folder?: string };
    if (!query || !query.folder) {
      return reply.status(400).send({
        error: '"folder" query parameter is required.'
      });
    }

    try {
      const deleted = await fsExplorer.deleteFolder(query.folder);
      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: `Folder "${query.folder}" not found.`
        });
      }
      return reply.status(200).send({
        success: true,
        message: 'Folder deleted successfully.'
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(400).send({
        error: err.message || 'Failed to delete folder.'
      });
    }
  });

  // GET /api/diagrams/:id/content?folder=<path>
  server.get('/api/diagrams/:id/content', async (request, reply) => {
    const params = request.params as { id: string };
    const query = request.query as { folder?: string };

    try {
      const diagram = await diagramService.getDiagram(
        query.folder || '',
        params.id
      );

      if (!diagram) {
        return reply.status(404).send({
          error: `Diagram "${params.id}" not found in folder "${query.folder || 'root'}".`
        });
      }

      return diagram;
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        error: `Failed to retrieve diagram: ${err.message}`
      });
    }
  });

  // PUT /api/diagrams/:id
  server.put('/api/diagrams/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as {
      title?: string;
      code?: string;
      folderPath?: string;
      theme?: import('@docugraph/core').MermaidTheme;
    };

    if (!body || !body.title || !body.code) {
      return reply.status(400).send({
        error: 'Both "title" and "code" are required fields.'
      });
    }

    try {
      const result = await diagramService.updateDiagram(
        body.folderPath || '',
        params.id,
        {
          title: body.title,
          code: body.code,
          theme: body.theme
        }
      );

      if (!result.success) {
        return reply.status(422).send({
          success: false,
          error: result.error || 'Diagram compilation failed.'
        });
      }

      return reply.status(200).send({
        success: true,
        meta: result.meta,
        svgContent: result.svgContent
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        success: false,
        error: `Internal server error: ${err.message}`
      });
    }
  });

  // DELETE /api/diagrams/:id?folder=<path>
  server.delete('/api/diagrams/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const query = request.query as { folder?: string };

    try {
      const deleted = await diagramService.deleteDiagram(
        query.folder || '',
        params.id
      );

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: `Diagram "${params.id}" not found.`
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Diagram deleted successfully.'
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        success: false,
        error: `Failed to delete diagram: ${err.message}`
      });
    }
  });

  // POST /api/diagrams/:id/favorite
  server.post('/api/diagrams/:id/favorite', async (request, reply) => {
    const params = request.params as { id: string };
    const body = (request.body || {}) as { folderPath?: string };

    try {
      const result = await diagramService.toggleFavorite(body.folderPath || '', params.id);
      return reply.status(200).send(result);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(400).send({
        success: false,
        error: err.message || 'Failed to toggle diagram favorite.'
      });
    }
  });

  // POST /api/folders/favorite
  server.post('/api/folders/favorite', async (request, reply) => {
    const body = request.body as { folderPath?: string };
    if (!body || !body.folderPath) {
      return reply.status(400).send({
        error: 'The "folderPath" field is required.'
      });
    }

    try {
      const result = await fsExplorer.toggleFolderFavorite(body.folderPath);
      return reply.status(200).send(result);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(400).send({
        success: false,
        error: err.message || 'Failed to toggle folder favorite.'
      });
    }
  });

  // GET /api/favorites
  server.get('/api/favorites', async (_request, reply) => {
    try {
      const favorites = await fsExplorer.getAllFavorites();
      return reply.status(200).send(favorites);
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        error: 'Failed to retrieve favorites.'
      });
    }
  });

  return server;
}
