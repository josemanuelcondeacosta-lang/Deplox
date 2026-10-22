# Deplox

Sitio corporativo estatico. Servir dist/ en cualquier hosting estatico.

Marca B, índigo. Proyectos: Adelanta'o al Tiempo, Zipotaso y Jose Store, con vistas interactivas bajo demanda y enlaces externos. Contacto por WhatsApp y correo electrónico.

Los inventarios incluyen demos interactivas en `dist/demos/index.html?app=zapateria` y `?app=inventario`. Se basan en los diseños y flujos de los repositorios Laravel de Bitbucket. Son versiones de demostración para navegador; no ejecutan PHP ni se conectan a bases de datos o registros reales.

Funciones de la demo: productos y variantes, búsqueda, filtros de stock, compras, ventas con abonos, anulaciones, reportes, exportación CSV y restablecimiento. Cada demo guarda sus datos ficticios por separado en localStorage; si el almacenamiento no está disponible, funciona durante la sesión.

Validación: `npm test` y `node --check dist/demos/demo.js`.

Vista local: python -m http.server 8080 --directory dist

## Despliegue en Vercel

Importar el repositorio de GitHub y seleccionar la rama `main`. Mantener la raíz del proyecto en `./`. El archivo `vercel.json` configura el proyecto como sitio estático, sin instalación ni compilación y con `dist` como directorio de salida. No requiere variables de entorno.

Documentación: https://vercel.com/docs/project-configuration/vercel-json
