package com.erp.calzados.controller;

import com.erp.calzados.model.Arqueo;
import com.erp.calzados.repository.ArqueoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/arqueos")
@CrossOrigin(origins = "*")
public class ArqueoController {

    @Autowired
    private ArqueoRepository arqueoRepository;

    @GetMapping
    public List<Arqueo> listar() {
        return arqueoRepository.findAllByOrderByFechaDesc();
    }

    @PostMapping
    public Arqueo guardar(@RequestBody Arqueo arqueo) {
        // Recalculamos la diferencia en el backend por seguridad
        return arqueoRepository.save(new Arqueo(
                arqueo.getMontoSistema(),
                arqueo.getMontoReal(),
                arqueo.getUsuario()
        ));
    }
}