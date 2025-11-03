# Plan de Pruebas Unitarias - Módulo Booking

**Repositorio**: mflix-backend  
**Contexto**: Route-Controller-Service Pattern  

## Alcance
Módulo de reservas con lógica de negocio compleja incluyendo transacciones, validación de disponibilidad y estadísticas.

## Componentes a Probar
- **bookingController.js**: Validaciones, lógica de transacciones, cálculos de disponibilidad
- **bookingRoutes.js**: Configuración de endpoints y middlewares

## Entregables
- Archivo `bookingController.test.js` con pruebas unitarias
- Archivo `bookingRoutes.test.js` con pruebas de integración ligera
- Mocks para modelos Movie, Theater, MovieSession, User, Booking

## Criterios de Aceptación
- Pruebas unitarias con Jest para toda lógica de negocio
- Cobertura de validaciones, casos edge y manejo de errores
- Pruebas de integración usando Express + fetch nativo
- Seguir convenciones existentes en el repositorio
- Sin frameworks adicionales, solo Jest
