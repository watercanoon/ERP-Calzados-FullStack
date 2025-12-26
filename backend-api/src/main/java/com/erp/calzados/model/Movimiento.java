package com.erp.calzados.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos")
public class Movimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha;
    private String tipo; // "VENTA", "INGRESO", "AJUSTE", "ELIMINACION"
    private String producto;
    private int cantidad;
    private String usuario; // Quién lo hizo

    public Movimiento() {}

    public Movimiento(String tipo, String producto, int cantidad, String usuario) {
        this.fecha = LocalDateTime.now();
        this.tipo = tipo;
        this.producto = producto;
        this.cantidad = cantidad;
        this.usuario = usuario;
    }

    // Getters y Setters (O usa Lombok si lo tienes)
    public Long getId() { return id; }
    public LocalDateTime getFecha() { return fecha; }
    public String getTipo() { return tipo; }
    public String getProducto() { return producto; }
    public int getCantidad() { return cantidad; }
    public String getUsuario() { return usuario; }
}