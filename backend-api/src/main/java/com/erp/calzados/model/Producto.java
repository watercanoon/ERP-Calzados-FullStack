package com.erp.calzados.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data // Lombok genera getters, setters y toString automáticamente
@Entity // Esto le dice a Spring: "Convierte esta clase en una tabla SQL"
@Table(name = "productos") // Nombre real de la tabla en la BD
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-incremental
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(nullable = false)
    private BigDecimal precio;

    @Column(nullable = false)
    private Integer stock;

    // Más adelante agregaremos relaciones (Categoría, Proveedor)
}