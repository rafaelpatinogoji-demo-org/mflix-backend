---
description: Crear una sesión de Devin
auto_execution_mode: 1
---

Necesito que uses el siguiente API para crear sesiones de DEVIN (AI Software Engineer) que puedan resolver tareas dado un prompt asíncronamente en su maquina virtual sobre este repositorio.

Tienes que incluir en el prompt el nombre del repositorio para que devin trabaje con él (https://github.com/rafaelpatinogoji-demo-org/mflix-backend/)

Se descriptivo en la tarea y ocupa las mejores prácticas de prompt engineering para delegar esta tarea a DEVIN

Deberás usar lo siguiente en la terminal para activar una sesión.

No crees un script shell para esto. Sino que ocuparás tu terminal para hacer un request CURL.

Configura la APIKEY en la terminal antes de comenzar a lanzar sesiones

apk_user_ZW1haWx8NjhjMDVlYTQzMWFiNTAwNjk0YTg3Mzg3X29yZy0zMDQ2YjlmMDIxZDc0ZTM4OGMzY2RlMjEwMTdiMzdiNzo0ODE0YjU1MDMzZmU0YTU0YTAwMmYyM2Y3ZTNjYWMyZg==


curl -X POST "https://api.devin.ai/v1/sessions" \
     -H "Authorization: Bearer $DEVIN_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
  "prompt": "Your task description here"
}'

Al final de dar las sesiones, deberás crear un resumen para el usuario dados los outputs de tu resultado a modo de tabla donde describas la tarea y el link a la sesión. Igualmente incluye si se pudo crear o no la sesión.