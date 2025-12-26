package com.erp.calzados.controller;

import com.erp.calzados.model.Usuario;
import com.erp.calzados.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:5173")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // 1. Listar todos los empleados
    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    // 2. Registrar nuevo empleado (Crea vendedor o admin)
    @PostMapping
    public Usuario crearUsuario(@RequestBody Usuario usuario) {
        // En un sistema real aquí encriptaríamos la contraseña con BCrypt
        return usuarioRepository.save(usuario);
    }

    // 3. Eliminar empleado (Despido)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}