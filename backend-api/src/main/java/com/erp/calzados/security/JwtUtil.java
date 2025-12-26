package com.erp.calzados.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtil {

    // 🔴 CLAVE FIJA: Así el servidor no la olvida al reiniciar
    // Debe ser larga (mínimo 32 caracteres) para ser segura
    private static final String SECRET_STRING = "esta_es_una_clave_muy_secreta_y_larga_para_erp_calzados_2025";

    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    private static final long TIEMPO_EXPIRACION = 1000 * 60 * 60 * 10; // 10 Horas

    // 1. GENERAR TOKEN
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + TIEMPO_EXPIRACION))
                .signWith(SECRET_KEY)
                .compact();
    }

    // 2. VALIDAR TOKEN
    public boolean validateToken(String token, String username) {
        final String usernameToken = extractUsername(token);
        return (usernameToken.equals(username) && !isTokenExpired(token));
    }

    // 3. EXTRAER DATOS
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(SECRET_KEY).build().parseClaimsJws(token).getBody();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}