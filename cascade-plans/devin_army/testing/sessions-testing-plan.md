# Plan de Pruebas Unitarias - Módulo Sessions

**Repositorio**: mflix-backend  
**Contexto**: Route-Controller-Service Pattern  

## Alcance
Módulos de sesiones combinados: Sessions, MovieSessions y TheaterSessions por superposición funcional.

## Componentes a Probar
- **sessionController.js**: Gestión de sesiones de usuario
- **movieSessionController.js**: Sesiones de películas con horarios
- **theaterSessionController.js**: Sesiones específicas de teatros
- **sessionRoutes.js**: Endpoints de sesión
- **movieSessionRoutes.js**: Endpoints de sesiones de películas
- **theaterSessionRoutes.js**: Endpoints de sesiones de teatros

## Entregables
- `sessionController.test.js`: Pruebas unitarias de gestión de sesiones
- `movieSessionController.test.js`: Pruebas de lógica de horarios y disponibilidad
- `theaterSessionController.test.js`: Pruebas de relación teatro-sesión
- Pruebas de integración para todos los endpoints

## Criterios de Aceptación
- Pruebas unitarias Jest para controladores
- Mocks para modelos Session, MovieSession, TheaterSession
- Cobertura de validaciones de tiempo y disponibilidad
- Pruebas de integración Express + fetch nativo
- Estructura consistente con otros tests
