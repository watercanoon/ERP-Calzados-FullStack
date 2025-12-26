package com.erp.calzados.controller;

import com.erp.calzados.model.Producto;
import com.erp.calzados.repository.ProductoRepository;
import com.erp.calzados.model.Venta;
import com.erp.calzados.repository.VentaRepository;
import com.erp.calzados.model.Movimiento;
import com.erp.calzados.repository.MovimientoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*") // Permite peticiones desde cualquier origen (Frontend)
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private MovimientoRepository movimientoRepository;

    // 1. LISTAR PRODUCTOS (GET)
    @GetMapping
    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    // 2. VER AUDITORÍA / KARDEX (SOLO ADMIN)
    @GetMapping("/auditoria")
    public List<Movimiento> verHistorial() {
        // Devuelve los movimientos ordenados por fecha descendente (lo más nuevo primero)
        return movimientoRepository.findAllByOrderByFechaDesc();
    }

    // 3. GUARDAR NUEVO PRODUCTO (POST) + REGISTRO KARDEX
    @PostMapping
    public Producto guardarProducto(@RequestBody Producto producto) {
        // A. Guardamos el producto en BD
        Producto nuevoProducto = productoRepository.save(producto);

        // B. KARDEX: Registramos el Ingreso de mercadería
        try {
            String usuarioActual = SecurityContextHolder.getContext().getAuthentication().getName();
            Movimiento mov = new Movimiento(
                    "INGRESO (NUEVO)",
                    nuevoProducto.getNombre(),
                    nuevoProducto.getStock(),
                    usuarioActual
            );
            movimientoRepository.save(mov);
        } catch (Exception e) {
            System.out.println("Error al registrar movimiento: " + e.getMessage());
        }

        return nuevoProducto;
    }

    // 4. ELIMINAR PRODUCTO (DELETE)
    @DeleteMapping("/{id}")
    public void eliminarProducto(@PathVariable Long id) {
        // Opcional: Podrías registrar un movimiento de "ELIMINACIÓN" antes de borrarlo
        productoRepository.deleteById(id);
    }

    // 5. ACTUALIZAR PRODUCTO (PUT)
    @PutMapping("/{id}")
    public Producto actualizarProducto(@PathVariable Long id, @RequestBody Producto detalles) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        producto.setNombre(detalles.getNombre());
        producto.setDescripcion(detalles.getDescripcion());
        producto.setPrecio(detalles.getPrecio());

        // Si quisieras auditar cambios de stock manuales, aquí iría la lógica
        producto.setStock(detalles.getStock());

        return productoRepository.save(producto);
    }

    // 6. REGISTRAR VENTA (SOPORTA CANTIDAD)
    @PostMapping("/{id}/venta")
    public ResponseEntity<?> registrarVenta(@PathVariable Long id, @RequestParam(defaultValue = "1") int cantidad) {
        return productoRepository.findById(id).map(prod -> {
            if (prod.getStock() >= cantidad) {
                // A. Restar Stock (La cantidad que viene del carrito)
                prod.setStock(prod.getStock() - cantidad);
                Producto guardado = productoRepository.save(prod);

                // B. Registrar en Historial Financiero
                Venta venta = new Venta();
                venta.setProducto(prod);
                venta.setFecha(LocalDateTime.now());
                // Calculamos el total: Precio * Cantidad
                venta.setTotalVenta(prod.getPrecio().multiply(java.math.BigDecimal.valueOf(cantidad)));
                ventaRepository.save(venta);

                // C. KARDEX: Registrar la Salida con la cantidad correcta
                try {
                    String usuarioActual = SecurityContextHolder.getContext().getAuthentication().getName();
                    Movimiento mov = new Movimiento(
                            "SALIDA (VENTA)",
                            prod.getNombre(),
                            cantidad, // <--- AQUÍ GUARDAMOS LA CANTIDAD REAL (Ej: 2)
                            usuarioActual
                    );
                    movimientoRepository.save(mov);
                } catch (Exception e) {
                    System.out.println("Error auditable: " + e.getMessage());
                }

                return ResponseEntity.ok(guardado);
            }
            return ResponseEntity.badRequest().body("Sin stock suficiente");
        }).orElse(ResponseEntity.notFound().build());
    }

    // 7. LISTAR HISTORIAL DE VENTAS (Reporte Financiero)
    @GetMapping("/historial")
    public List<Venta> listarVentas() {
        return ventaRepository.findAll();
    }
}