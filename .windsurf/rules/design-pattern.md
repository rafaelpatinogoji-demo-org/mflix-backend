---
trigger: model_decision
description: Cuando crees nuevos endpoints
---

Patrón de Diseño Route-Controller: Implementar separación de responsabilidades donde las Routes definen endpoints HTTP y delegan a Controllers que contienen la lógica de negocio. Este patrón desacopla la configuración de rutas de la implementación de la lógica, permitiendo mayor modularidad y mantenibilidad."

Principios:

Routes: Solo configuración de endpoints y enrutamiento
Controllers: Toda la lógica de negocio, validación y acceso a datos
Sin lógica en rutas: Las rutas nunca deben contener implementación
Este patrón de diseño asegura código modular, testable y fácil de mantener.