package com.erp.calzados.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username; // Ej: "admin"

    @Column(nullable = false)
    private String password; // Aquí guardaremos la contraseña (más adelante la encriptaremos)

    private String nombreCompleto; // Ej: "Josue Ingeniero"

    private String rol; // Ej: "ADMIN", "VENDEDOR"
}