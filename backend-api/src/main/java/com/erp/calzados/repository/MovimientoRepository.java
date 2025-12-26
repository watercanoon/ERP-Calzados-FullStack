package com.erp.calzados.repository;

import com.erp.calzados.model.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    // Para obtener los últimos movimientos primero
    List<Movimiento> findAllByOrderByFechaDesc();
}