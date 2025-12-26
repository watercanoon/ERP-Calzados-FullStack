package com.erp.calzados.repository;

import com.erp.calzados.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    // Aquí podríamos añadir métodos como: findByFechaBetween... para reportes futuros
}