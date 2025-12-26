package com.erp.calzados.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "arqueos")
public class Arqueo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha;
    private Double montoSistema; // Lo que el software dice que se vendió
    private Double montoReal;    // Lo que el Admin contó en billetes
    private Double diferencia;   // Sobrante o Faltante
    private String usuario;      // Quién hizo el cierre

    public Arqueo() {}

    public Arqueo(Double montoSistema, Double montoReal, String usuario) {
        this.fecha = LocalDateTime.now();
        this.montoSistema = montoSistema;
        this.montoReal = montoReal;
        this.diferencia = montoReal - montoSistema;
        this.usuario = usuario;
    }

    // Getters necesarios
    public Long getId() { return id; }
    public LocalDateTime getFecha() { return fecha; }
    public Double getMontoSistema() { return montoSistema; }
    public Double getMontoReal() { return montoReal; }
    public Double getDiferencia() { return diferencia; }
    public String getUsuario() { return usuario; }
}