# 🚀 MikeApp - Backend API

Servicio backend de **MikeApp**, una aplicación de seguimiento de salud metabólica (glucosa y composición corporal) y finanzas personales (metas de ahorro y aportaciones). Desarrollado con Node.js, Express y MongoDB.

---

## 🛠️ Stack Tecnológico

- **Core**: Node.js v20 (Alpine) & Express.js
- **Base de Datos**: MongoDB & Mongoose ODM
- **Seguridad y Autenticación**: JSON Web Tokens (JWT) & bcryptjs (encriptación de contraseñas)
- **Documentación de API**: Swagger UI (disponible en `/api-docs`)
- **Entorno de Desarrollo**: Nodemon & Docker

---

## 📁 Estructura del Directorio

El backend está estructurado siguiendo un patrón **Service-Controller-Route (SCR)** con persistencia en Mongoose:

```text
backend/
├── src/
│   ├── server.js              # Punto de entrada (inicializa el servidor http)
│   ├── app.js                 # Configuración de Express, middlewares globales y enrutador
│   ├── config/
│   │   └── db.js              # Conexión a MongoDB usando Mongoose
│   ├── controllers/           # Manejadores de solicitudes HTTP (valida entrada y llama a servicios)
│   │   ├── auth.controller.js
│   │   ├── bodyComposition.controller.js
│   │   ├── glucose.controller.js
│   │   └── savings.controller.js
│   ├── middlewares/           # Funciones intermediarias de Express
│   │   ├── auth.middleware.js # Validador de firma de JWT
│   │   └── error.middleware.js# Manejador centralizado de excepciones y errores
│   ├── models/                # Esquemas y modelos de datos de Mongoose
│   │   ├── User.js
│   │   ├── Glucose.js
│   │   ├── BodyComposition.js
│   │   ├── SavingsObjective.js
│   │   └── SavingsTransaction.js
│   ├── routes/                # Definición de rutas y endpoints
│   │   ├── auth.routes.js
│   │   ├── bodyComposition.routes.js
│   │   ├── glucose.routes.js
│   │   └── savings.routes.js
│   ├── services/              # Lógica de negocio y consultas de base de datos
│   │   ├── auth.service.js
│   │   ├── bodyComposition.service.js
│   │   ├── glucose.service.js
│   │   └── savings.service.js
│   └── utils/                 # Clases de ayuda y utilitarios
│       ├── appError.js        # Clase de error operacional personalizada
│       └── bodyComposition.helper.js # Fórmulas para calcular IMC, grasa Navy, BMR, TDEE
├── Dockerfile                 # Configuración para contenerizar el backend
├── .env.example               # Plantilla de variables de entorno
└── package.json               # Configuración de dependencias y scripts de Node
```

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz de la carpeta `backend/` basándote en `.env.example`:

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `PORT` | Puerto en el que corre el servidor Express | `5000` |
| `NODE_ENV` | Modo de entorno (`development` o `production`) | `development` |
| `MONGODB_URI` | URI de conexión a la base de datos MongoDB | `mongodb://localhost:27017/mikeapp` |
| `JWT_SECRET` | Llave secreta para firmar y validar los tokens JWT | `debe_ser_una_llave_larga_y_segura` |
| `JWT_EXPIRES_IN` | Tiempo de expiración de los tokens de sesión | `30d` |

---

## 🚀 Instrucciones de Ejecución

### 1. Ejecución Local (Node.js)

Asegúrate de tener instalado **Node.js v20** o superior y una base de datos **MongoDB** activa.

```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Copiar configuración de variables
cp .env.example .env

# Correr en modo desarrollo (recarga automática con nodemon)
npm run dev

# Correr en modo producción
npm start
```

### 2. Ejecución con Docker

Si utilizas Docker en la raíz del proyecto global, puedes levantar el contenedor del backend automáticamente junto con la base de datos y el cliente web:

```bash
# Levantar contenedores y compilar cambios
docker compose up --build
```

El backend estará disponible en `http://localhost:5000`.

---

## 📡 Referencia de Endpoints (API REST)

Todos los endpoints (a excepción de registro y login) requieren enviar el header `Authorization: Bearer <JWT_TOKEN>`.

### 🔑 Autenticación (`/api/auth`)
- `POST /register`: Registra un nuevo usuario en la plataforma.
- `POST /login`: Valida credenciales y devuelve un token JWT.
- `GET /profile`: Obtiene la información del usuario autenticado (Protegido).

### 🩸 Control de Glucosa (`/api/glucose`)
- `GET /`: Devuelve los registros de glucosa del usuario ordenados por fecha y hora descentemente.
- `POST /`: Crea una medición de glucosa diaria.
- `PUT /:id`: Actualiza los detalles de una medición específica.
- `DELETE /:id`: Elimina un registro de glucosa.

### 🏋️ Composición Corporal y Metabolismo (`/api/body-composition`)
- `GET /`: Devuelve el historial de registros corporales (Semanal/Nutrióloga). **Calcula automáticamente en tiempo de ejecución: IMC, Grasa Navy, Tasa Metabólica Basal (BMR), Gasto Energético (TDEE), Déficits sugeridos e índices WHtR.**
- `GET /dashboard`: Retorna un resumen unificado (último peso, peso objetivo, progreso general, evolución respecto a la consulta anterior de nutrióloga).
- `POST /`: Registra una nueva composición (semana ordinaria o consulta clínica de nutrición).
- `PUT /:id`: Edita un registro corporal existente.
- `DELETE /:id`: Elimina un registro corporal del historial.

### 🐷 Módulo de Ahorros Colectivos (`/api/savings`)
- `GET /dashboard`: Devuelve el saldo total acumulado y estadísticas de cumplimiento globales de las metas de ahorro.
- `GET /objectives`: Obtiene los objetivos de ahorro individuales (ej: PC Gamer, Viaje).
- `POST /objectives`: Crea un nuevo objetivo con monto meta y fecha límite opcional.
- `PUT /objectives/:id`: Modifica la meta, descripción o estado del objetivo.
- `DELETE /objectives/:id`: Elimina un objetivo de ahorro.
- `GET /transactions`: Obtiene el desglose histórico de aportaciones al fondo de ahorro.
- `POST /transactions`: Registra una nueva aportación monetaria. **Distribuye el monto automáticamente en porcentajes/cantidades asignadas a los objetivos que estén activos.**
- `PUT /transactions/:id`: Edita una aportación y recalcula las distribuciones.
- `DELETE /transactions/:id`: Remueve una transacción del fondo de ahorros.
