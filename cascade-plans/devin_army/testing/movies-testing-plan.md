# Plan de Pruebas Unitarias - Módulo Movies (Combinado)

**Repositorio**: mflix-backend  
**Contexto**: Route-Controller-Service Pattern  

## Alcance
Módulos de películas combinados para evitar duplicación: Movies y EmbeddedMovies con vector search.

## Componentes a Probar
- **movieController.js**: CRUD, paginación, relaciones con comments
- **embeddedMovieController.js**: CRUD embebido, integración con vectorSearchService
- **movieRoutes.js**: Endpoints REST
- **embeddedMovieRoutes.js**: Endpoints REST
- **vectorSearchService.js**: Lógica de embeddings y búsqueda vectorial

## Entregables
- `movieController.test.js`: Pruebas unitarias de lógica CRUD
- `embeddedMovieController.test.js`: Pruebas con mocks de vectorSearchService
- `vectorSearchService.test.js`: Pruebas unitarias de servicio Voyage AI
- Pruebas de integración para rutas combinadas

## Criterios de Aceptación
- Pruebas unitarias con Jest para controladores y servicio
- Mocks para Voyage AI y modelos Mongoose
- Cobertura de búsqueda vectorial híbrida
- Pruebas de integración Express + fetch nativo
- Convenciones consistentes del repositorio
