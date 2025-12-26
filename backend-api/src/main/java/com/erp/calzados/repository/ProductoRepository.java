package com.erp.calzados.repository;

import com.erp.calzados.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // ¡Listo! Al extender JpaRepository, ya tienes automáticamente:
    // .save() -> Guardar
    // .findAll() -> Listar todos
    // .findById() -> Buscar por ID
    // .delete() -> Eliminar
    // No hace falta escribir nada más por ahora.
}