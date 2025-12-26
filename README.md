# 👞 ERP Calzados - Sistema de Gestión Full Stack

Sistema integral de gestión (ERP) desarrollado para zapaterías y negocios de retail. Integra Punto de Venta (POS), Control de Inventario, Facturación Electrónica (PDF), Reportes en Excel y Seguridad Avanzada.

![Estado](https://img.shields.io/badge/Estado-Terminado-green)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green)
![React](https://img.shields.io/badge/React-18-blue)
![MySQL](https://img.shields.io/badge/MySQL-Docker-blue)

## 🚀 Características Principales

* **Punto de Venta (POS):** Interfaz rápida para ventas con cálculo automático de totales y vuelto.
* **Facturación:** Generación de Boletas/Facturas/Tickets en PDF con código QR y desglose de IGV.
* **Gestión de Inventario:** Control de stock en tiempo real con alertas de bajo stock.
* **Seguridad:** Autenticación JWT con Roles (ADMIN y VENDEDOR) y protección de rutas.
* **Auditoría:** Registro inmutable de movimientos (Kardex) exportable a Excel.
* **Responsivo:** Diseño adaptable para PC, Tablets y Celulares.
* **Proveedores:** Módulo de gestión de logística y abastecimiento.

## 🛠️ Tecnologías Usadas

### Backend (Monolito)
* **Java 17/21** & **Spring Boot**: Núcleo del sistema.
* **Spring Security & JWT**: Manejo de sesiones y encriptación.
* **Spring Data JPA**: Conexión robusta a base de datos.
* **Lombok**: Reducción de código repetitivo.

### Frontend (SPA)
* **React (Vite)**: Interfaz de usuario de alto rendimiento.
* **Recharts**: Gráficos estadísticos para el dashboard.
* **Lucide React**: Iconografía moderna.
* **jsPDF & XLSX**: Motores de generación de documentos en el cliente.

### Base de Datos & Despliegue
* **MySQL 8**: Base de datos relacional (corriendo en Docker).
* **Maven**: Gestión de dependencias y construcción.

## 📦 Instalación y Despliegue

### Requisitos previos
* Java JDK 17+
* Node.js & NPM
* MySQL (Local o Docker)

### 1. Clonar el repositorio
git clone https://github.com/watercanoon/ERP-Calzados-FullStack.git
cd ERP-Calzados-FullStack
