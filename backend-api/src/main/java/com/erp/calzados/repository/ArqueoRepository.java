package com.erp.calzados.repository;
import com.erp.calzados.model.Arqueo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArqueoRepository extends JpaRepository<Arqueo, Long> {
    List<Arqueo> findAllByOrderByFechaDesc();
}