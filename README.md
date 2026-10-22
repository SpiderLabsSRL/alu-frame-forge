# Alu Frame Forge

# Demo web: Diseñador y calculadora de ventanas ALUVI

Crea una aplicación web para diseñar ventanas de aluminio y calcular sus medidas, materiales y peso estimado.

**IMPORTANTE:** Esta es una demo visual y funcional, no un sistema industrial completo. Prioriza las funcionalidades esenciales, evita complejidad innecesaria y no implementes backend, base de datos, autenticación ni integraciones externas. Utiliza datos de ejemplo mock 

## 1. Diseño de la interfaz

Crea una interfaz profesional, moderna y limpia, con estilo de software técnico industrial.

La pantalla principal debe estar dividida en tres zonas:

- **Izquierda:** formulario para configurar la ventana.
- **Centro:** dibujo de la ventana en vista frontal.
- **Derecha:** resumen de medidas, materiales y peso.

Utiliza React, TypeScript, Tailwind CSS y SVG para dibujar la ventana. Prioriza el uso en computadora y evita agregar páginas que no sean necesarias para la demo.

## 2. Configuración de la ventana

Permitir seleccionar inicialmente estos modelos:

- Ventana corrediza de dos hojas.
- Ventana corrediza de tres hojas.
- Ventana fija.

Permitir introducir:

- Ancho total en milímetros.
- Alto total en milímetros.
- Cantidad de hojas.
- Distribución básica de las hojas.
- Tipo de vidrio.
- Espesor del vidrio.

Preseleccionar una ventana corrediza de dos hojas de 1500 × 1200 mm.

## 3. Dibujo dinámico

Esta es una de las funciones más importantes.

Dibujar la ventana mediante SVG, no utilizar una imagen estática.

El dibujo debe representar:

- Marco exterior.
- Hojas.
- Perfiles interiores.
- Vidrios.
- Divisiones principales.
- Cotas de ancho y alto.

Cuando el usuario cambie las dimensiones o el modelo, el dibujo debe actualizarse automáticamente, manteniendo proporciones coherentes.

Incluir botones para mostrar u ocultar las cotas y restablecer el diseño.

No implementar edición CAD, modelado 3D ni herramientas gráficas avanzadas.

## 4. Cálculo de materiales y peso

Implementar un cálculo básico que se actualice automáticamente al modificar las dimensiones.

Mostrar una tabla con:

- Componente.
- Cantidad.
- Longitud de corte.
- Peso por metro.
- Peso total.

Para la demo, utilizar componentes de ejemplo correspondientes a una ventana corrediza de dos hojas: marco horizontal, marco vertical, perfiles horizontales y verticales de las hojas.

Utilizar parámetros de ejemplo claramente identificados y centralizados para que puedan sustituirse posteriormente por las reglas técnicas reales de ALUVI.

Aplicar la fórmula:

Peso total = cantidad × longitud en metros × peso del perfil en kg/m.

Calcular también la superficie del vidrio en m² y su peso estimado a partir del peso nominal por metro cuadrado configurado.

**Importante:** las fórmulas de corte deben ser demostrativas y configurables, no presentarse como reglas reales de fabricación. Indicar claramente que los pesos y las medidas son estimaciones de demostración hasta introducir las fichas técnicas oficiales.

Si faltan parámetros, mostrar una advertencia y no inventar resultados definitivos.

## 5. Resumen de resultados

En el panel derecho mostrar:

- Ancho y alto total.
- Cantidad de piezas.
- Metros lineales de aluminio.
- Peso estimado del aluminio.
- Superficie total del vidrio.
- Peso estimado del vidrio.
- Peso total estimado de la ventana.

Distinguir visualmente los resultados calculados de los valores que todavía sean estimaciones.

## 6. Tabla de despiece

Debajo del dibujo, o en una pestaña sencilla, mostrar una tabla con el detalle de cada pieza:

- Código.
- Nombre.
- Cantidad.
- Longitud de corte.
- Peso unitario.
- Peso total.

Actualizarla automáticamente cuando cambien las dimensiones.

## 7. Acciones

Incluir únicamente estas acciones:

- **Nueva ventana:** restablecer el formulario.
- **Recalcular:** actualizar los resultados.
- **Restablecer:** volver a los valores iniciales.
- **Imprimir ficha:** abrir una vista de impresión con el dibujo, las dimensiones y la tabla de resultados.

No implementar exportación avanzada, gestión de clientes, historial de proyectos, presupuestos ni optimización de barras.

## 8. Criterios de aceptación

La demo debe funcionar de verdad en el navegador:

1. El usuario modifica el ancho y alto.
2. El dibujo cambia automáticamente.
3. Las medidas de corte se recalculan.
4. Los pesos se actualizan.
5. La tabla de despiece muestra los nuevos resultados.
6. La superficie y el peso del vidrio se actualizan.
7. La ficha de impresión muestra la configuración actual.
8. Los valores de ejemplo están identificados como demostrativos.

Evita botones decorativos sin funcionalidad, datos ficticios presentados como reales y pantallas innecesarias.

**Prioridad absoluta:** conseguir que una ventana corrediza de dos hojas pueda configurarse, visualizarse y calcularse de forma coherente en una única pantalla. El resultado debe ser una demo presentable a ALUVI, sencilla de entender y preparada para incorporar posteriormente las reglas técnicas reales.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1f3a2b72-b9b7-487e-8cd8-29353933cd90).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
