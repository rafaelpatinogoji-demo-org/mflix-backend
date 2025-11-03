# Plan de Pruebas Unitarias - Módulos Complementarios

**Repositorio**: mflix-backend  
**Contexto**: Route-Controller-Service Pattern  

## Alcance
Módulos restantes con funcionalidad específica: Users, Comments, Theaters.

## Componentes a Probar
- **userController.js**: CRUD de usuarios, validaciones
- **commentController.js**: Gestión de comentarios, relaciones con películas
- **theaterController.js**: Gestión de teatros, capacidad y ubicación
- **userRoutes.js**: Endpoints de usuario
- **commentRoutes.js**: Endpoints de comentarios
- **theaterRoutes.js**: Endpoints de teatros

## Entregables
- `userController.test.js`: Pruebas unitarias de lógica de usuario
- `commentController.test.js`: Pruebas de comentarios y relaciones
- `theaterController.test.js`: Pruebas de gestión de teatros
- Pruebas de integración para endpoints REST

## Criterios de Aceptación
- Pruebas unitarias Jest para toda lógica de negocio
- Mocks para modelos User, Comment, Theater
- Cobertura de validaciones y casos edge
- Pruebas de integración Express + fetch nativo
- Convenciones consistentes del repositorio
