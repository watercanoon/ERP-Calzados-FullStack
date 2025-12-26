package com.erp.calzados;

import com.erp.calzados.model.Usuario;
import com.erp.calzados.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void run(String... args) throws Exception {
        // Verificamos si ya existe algún usuario
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setPassword("admin123"); // Contraseña temporal sin encriptar
            admin.setNombreCompleto("Administrador del Sistema");
            admin.setRol("ADMIN");

            usuarioRepository.save(admin);
            System.out.println("------------------------------------------------");
            System.out.println(" USUARIO ADMIN CREADO: admin / admin123 ");
            System.out.println("------------------------------------------------");
        }
    }
}