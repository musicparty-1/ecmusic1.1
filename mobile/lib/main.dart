import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config.dart';
import 'screens/splash_screen.dart';
import 'screens/vote_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(const ProviderScope(child: EcMusicApp()));
}

/// Parsea el event ID desde la URL (funciona en Flutter Web).
/// Soporta /event/42 y ?event=42
int? _parseEventIdFromUrl() {
  try {
    final uri = Uri.base;
    final segments = uri.pathSegments;
    final idx = segments.indexWhere((s) => s == 'event' || s == 'mirror');
    if (idx != -1 && idx + 1 < segments.length) {
      return int.tryParse(segments[idx + 1]);
    }
    final q = uri.queryParameters['event'];
    if (q != null) return int.tryParse(q);
  } catch (_) {}
  return null;
}

class EcMusicApp extends StatelessWidget {
  const EcMusicApp({super.key});

  @override
  Widget build(BuildContext context) {
    final eventId = _parseEventIdFromUrl();

    return MaterialApp(
      title: 'EC Music',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: kBgColor,
        primaryColor: kPrimary,
        colorScheme: const ColorScheme.dark(
          primary: kPrimary,
          secondary: kSecondary,
          surface: kCardColor,
        ),
        fontFamily: 'SF Pro Display',
        useMaterial3: true,
      ),
      // Si hay un eventId en la URL, ir directo al VoteScreen (compatibilidad QR)
      // Si no, mostrar el Splash + Onboarding
      home: eventId != null
          ? VoteScreen(eventId: eventId)
          : const SplashScreen(),
    );
  }
}
