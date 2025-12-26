package com.erp.calzados.repository;

import com.erp.calzados.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Método mágico de JPA: Buscar por username
    Optional<Usuario> findByUsername(String username);
}