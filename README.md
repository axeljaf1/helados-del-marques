# Helados del Marqués 🍦

Aplicación web para gestionar una heladería: ventas, inventario, flujo de caja y reportes.

## Incluye

- Dashboard con ventas del día, inventario, stock bajo y saldo.
- Punto de venta (POS) con carrito.
- Métodos de pago: efectivo, tarjeta y transferencia.
- Descuento automático del inventario al cobrar.
- Productos iniciales de $30, $35 y $80 MXN.
- Alta y edición de productos.
- Alertas de stock bajo.
- Entradas y salidas de caja.
- Reportes por producto y método de pago.
- Persistencia con `localStorage`, por lo que funciona sin servidor.

## Ejecutarlo

No necesita Node.js ni base de datos para esta versión.

1. Sube los archivos a un repositorio de GitHub.
2. Activa **Settings → Pages → Deploy from a branch**.
3. Selecciona `main` y la carpeta `/root`.
4. Guarda y GitHub Pages publicará `index.html`.

También puedes abrir `index.html` directamente en el navegador.

## Importante

Esta primera versión guarda los datos en el navegador del dispositivo. Si quieres que varias computadoras/celulares compartan las mismas ventas, inventario y caja, la siguiente versión debería agregar un backend y una base de datos (por ejemplo PostgreSQL).
