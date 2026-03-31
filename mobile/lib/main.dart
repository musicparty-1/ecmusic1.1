import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

void main() {
  runApp(const MusicPartyApp());
}

/// Lee el event ID desde la URL de la web (ej: /event/42) o desde
/// query params (ej: ?event=42). Si no hay ninguno, muestra pantalla de error.
int? _parseEventIdFromUrl() {
  try {
    final uri = Uri.base;
    // Soporta /event/42 y /mirror/42
    final segments = uri.pathSegments;
    final idx = segments.indexWhere((s) => s == 'event' || s == 'mirror');
    if (idx != -1 && idx + 1 < segments.length) {
      return int.tryParse(segments[idx + 1]);
    }
    // Fallback: query param ?event=42
    final q = uri.queryParameters['event'];
    if (q != null) return int.tryParse(q);
  } catch (_) {}
  return null;
}

class MusicPartyApp extends StatelessWidget {
  const MusicPartyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final eventId = _parseEventIdFromUrl();
    return MaterialApp(
      title: 'MusicParty',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF8B5CF6),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF8B5CF6),
          secondary: Color(0xFFEC4899),
        ),
        useMaterial3: true,
      ),
      home: eventId != null
          ? PublicVotePage(eventId: eventId)
          : const _NoEventScreen(),
    );
  }
}

class _NoEventScreen extends StatelessWidget {
  const _NoEventScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.music_off, size: 64, color: Color(0xFF8B5CF6)),
            SizedBox(height: 16),
            Text('Evento no encontrado',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Escaneá el QR del evento para acceder.',
                style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class PublicVotePage extends StatefulWidget {
  final int eventId;
  const PublicVotePage({super.key, required this.eventId});

  @override
  State<PublicVotePage> createState() => _PublicVotePageState();
}

class _PublicVotePageState extends State<PublicVotePage> {
  String? _deviceId;
  List<dynamic> _songs = [];
  bool _loading = true;
  String _query = '';
  final Set<int> _votedSongs = {};
  
  final String _baseUrl = 'http://localhost:8080/api'; // Cambiar a la IP del servidor en red real




  @override
  void initState() {
    super.initState();
    _initDevice();
    _fetchSongs();
  }

  Future<void> _initDevice() async {
    final prefs = await SharedPreferences.getInstance();
    String? id = prefs.getString('device_id');
    if (id == null) {
      id = const Uuid().v4();
      await prefs.setString('device_id', id);
    }
    setState(() {
      _deviceId = id;
    });
  }

  Future<void> _fetchSongs() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/events/${widget.eventId}/songs'));
      if (response.statusCode == 200) {
        setState(() {
          _songs = json.decode(response.body);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    }
  }

  Future<void> _vote(int songId) async {
    if (_deviceId == null) return;
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/votes'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'song_id': songId,
          'device_id': _deviceId,
        }),
      );

      if (response.statusCode == 201) {
        setState(() {
          _votedSongs.add(songId);
        });
      } else {
        final body = json.decode(response.body);
        _showError(body['message'] ?? 'Error al votar');
      }
    } catch (e) {
      _showError('Error de conexión');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final filteredSongs = _songs.where((s) {
      final q = _query.toLowerCase();
      return s['title'].toString().toLowerCase().contains(q) ||
             s['artist'].toString().toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('MusicParty', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              onChanged: (val) => setState(() => _query = val),
              decoration: InputDecoration(
                hintText: 'Buscar canción...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: _loading 
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  itemCount: filteredSongs.length,
                  itemBuilder: (context, index) {
                    final song = filteredSongs[index];
                    final hasVoted = _votedSongs.contains(song['id']);
                    
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      color: const Color(0xFF1E293B),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(12),
                        title: Text(song['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(song['artist'], style: const TextStyle(color: Colors.grey)),
                        trailing: IconButton(
                          onPressed: hasVoted ? null : () => _vote(song['id']),
                          icon: Icon(
                            hasVoted ? Icons.check_circle : Icons.thumb_up_alt_rounded,
                            color: hasVoted ? Colors.green : const Color(0xFF8B5CF6),
                          ),
                        ),
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }
}
