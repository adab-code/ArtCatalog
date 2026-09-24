# Configuración de la Base de Datos (MongoDB Atlas)

> ⚠️ Seguridad: este archivo contiene las credenciales reales del clúster
> `Cluster0` (proyecto `ByuClass341`). No lo compartas públicamente; el
> archivo `.env` sí está ignorado por git.

## Cadena de conexión (referencia)

La API se conecta con el paquete oficial `mongodb` (ver `data/database.js`)
leyendo la variable **`MONGODB_URI`** (no `MONGODB_URL`) de tu `.env`:

```env
MONGODB_URI=mongodb+srv://mongo:<password>@<cluster>.mongodb.net/ArtCatalog
```

> Los valores reales de `<password>` y `<cluster>` están en tu `.env` local
> (git-ignored), no en este archivo.

| Dato | Valor |
|---|---|
| Proyecto / Clúster | `ByuClass341` / `Cluster0` (free tier) |
| Región / Versión | AWS / Oregon (us-west-2) · MongoDB 8.0.32 · Replica Set 3 nodos |
| Usuario de la base | `mongo` (SCRAM, `atlasAdmin@admin`); la contraseña va en `.env` |
| Base de datos | `ArtCatalog` (sensible a mayúsculas) |

## 1. Crear el clúster en MongoDB Atlas

1. Crea una cuenta en <https://www.mongodb.com/cloud/atlas> (gratis).
2. Crea el proyecto **ByuClass341** y dentro el clúster **Cluster0** (free
   tier). Espera a que termine de crearse.

## 2. Crear el usuario de la base de datos

En **Database Access** → **Add New Database User**, crea el database user
`mongo` con contraseña `mongo` (método **SCRAM**, rol `atlasAdmin@admin`).
Existe también `alfaroaarondev_db_user`, pero la API usa `mongo`.

> ⚠️ La contraseña real va solo en tu `.env`, nunca en este archivo ni en
> código que se suba al repo. 

## 3. Permitir acceso a la red

En **Network Access** → **IP Access List** debe estar `0.0.0.0/0` (**Allow
access from anywhere**) para poder conectar desde local y desde Render.

## 4. Obtener la cadena de conexión

1. En tu clúster: **Connect** → **Drivers** → **Node.js**.
2. Copia la cadena, sustituye `<password>` por la contraseña real y agrega el
   nombre de la base al final. Debe quedar exactamente como la de la sección
   "Cadena de conexión". Si cambias la contraseña del usuario, ajusta solo esa
   parte de la URI.

## 5. El nombre de la base `ArtCatalog`

> Importante: `data/database.js` llama a `_client.db()` **sin argumentos**, así
> que el nombre de la base sale **solo del connection string**. Si la URI no
> termina en `/ArtCatalog`, el driver usaría la base `test`.

- El nombre debe coincidir (con las mismas mayúsculas) en la URI, en mongosh
  (`use ArtCatalog`) y en Compass (**Create Database** → `ArtCatalog`).
- La base no existe hasta que guardas el primer documento. Por eso el asistente
  web de Atlas (**Browse Collections** → **Create Database**) **siempre pide
  una collection name**: usa database name `ArtCatalog` y collection name
  `artists` (una de las 5 de la sección 6). Si lo haces así:
  - puedes omitir `db.createCollection("artists")` en la sección 6, y
  - la base no aparecerá en **Browse Collections** hasta que tenga datos; en
    mongosh verifícala con `db.getName()`.

## 6. Colecciones e índices

El API usa estas 5 colecciones (nombres tal cual, respetando mayúsculas):

| # | Nombre de la colección | Para qué sirve |
|---|---|---|
| 1 | `artists` | Artistas: `firstName`, `lastName`, `birthDate`, `country`, ... |
| 2 | `artworks` | Obras: `title`, `year`, `period`, `type`, `artistId`, ... |
| 3 | `keywords` | Etiquetas de tema: `keyword` (en minúsculas, única) |
| 4 | `artwork_keywords` | Relación obra–keyword: `artworkId`, `keywordId` |
| 5 | `users` | Usuarios que entran con GitHub: `oauthProvider`, `oauthId`, `role`, ... |

> **Automatizado**: `data/database.js` las crea **solas al arrancar** (más los
> índices únicos de `keywords.keyword` y `artwork_keywords.{artworkId,keywordId}`),
> así que no necesitas hacer nada manualmente. En la consola verás:
>
> ```
> Connected to MongoDB
> Database schema ready (collections and unique indexes)
> ```
>
> Si prefieres crearlas a mano (opcional, por si el arranque no las crea
> porque la base nunca se conectó), abre **mongosh** (o Compass → "New
> Connection" → pestaña _mongosh_) y ejecuta:

```js
use ArtCatalog

db.createCollection("artists")
db.createCollection("artworks")
db.createCollection("keywords")
db.createCollection("artwork_keywords")
db.createCollection("users")

db.keywords.createIndex({ keyword: 1 }, { unique: true })
db.artwork_keywords.createIndex({ artworkId: 1, keywordId: 1 }, { unique: true })
show collections
```

> Nota: el API también valida estos casos con código (devuelve `409`); el
> índice único es una segunda capa de protección.

## 7. Datos de ejemplo (opcional)

```js
db.artists.insertOne({
  firstName: "Frida",
  middleName: "",
  lastName: "Kahlo",
  birthDate: new Date("1907-07-06"),
  deathDate: new Date("1954-07-13"),
  country: "Mexico",
  locality: "Coyoacan",
  createdAt: new Date()
})
```

Anota el `_id` devuelto: lo usarás como `artistId` al crear obras y links desde
`routes.rest` o Swagger.

## 8. Variables de entorno relacionadas con la base

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión con el nombre de la base (`.../ArtCatalog`) |
| `ADMIN_GITHUB_IDS` | Ids de GitHub (separados por coma) que reciben rol `admin` al iniciar sesión |

## Validación

Arranca el servidor con `npm start` (o `npm run dev`). En la consola debe
aparecer:

```
Connected to MongoDB
Database schema ready (collections and unique indexes)
ArtCatalog API running on http://localhost:3000
```

Si falla, revisa: la contraseña en `MONGODB_URI`, el acceso de red
(Network Access) y que el clúster esté activo.