import 'package:flutter/material.dart';

// ─── URL de la API ───────────────────────────────────────────────────────────
// Cambia según tu entorno:
//   Emulador Android  → http://10.0.2.2:8080/api
//   Simulador iOS     → http://127.0.0.1:8080/api
//   Dispositivo real  → http://<IP_DE_TU_PC>:8080/api
//   Producción        → https://tu-backend.railway.app/api
// Emulador Android  → http://10.0.2.2:8080/api
// Dispositivo real  → http://<IP_DE_TU_PC>:8080/api
// Web / Windows     → http://localhost:8080/api
// Producción        → https://tu-backend.railway.app/api
const String kBaseUrl = 'http://127.0.0.1:8080/api';

// ─── Tema de colores ──────────────────────────────────────────────────────────
const kBgColor = Color(0xFF030010);
const kCardColor = Color(0xFF080A14);
const kBorderColor = Color(0xFF1A1F2E);
const kPrimary = Color(0xFF7C3AED);
const kPrimaryLight = Color(0xFF8B5CF6);
const kSecondary = Color(0xFFEC4899);
const kSuccess = Color(0xFF22C55E);
const kWarning = Color(0xFFF59E0B);
const kError = Color(0xFFEF4444);
const kTextMuted = Color(0xFF64748B);
const kTextSub = Color(0xFF94A3B8);
