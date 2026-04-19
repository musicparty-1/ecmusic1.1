import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models.dart';
import 'config.dart';

const _headers = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

class ApiService {
  final String baseUrl;
  const ApiService({this.baseUrl = kBaseUrl});

  Future<EventData> getEvent(int id) async {
    final res = await http.get(Uri.parse('$baseUrl/events/$id'), headers: _headers)
        .timeout(const Duration(seconds: 12));
    if (res.statusCode == 200) return EventData.fromJson(jsonDecode(res.body));
    if (res.statusCode == 404) throw Exception('Evento no encontrado');
    throw Exception('Error del servidor (${res.statusCode})');
  }

  Future<List<Song>> getRanking(int eventId) async {
    final res = await http.get(Uri.parse('$baseUrl/events/$eventId/ranking'), headers: _headers)
        .timeout(const Duration(seconds: 12));
    if (res.statusCode != 200) throw Exception('Error al cargar canciones');
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Song.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<List<Song>> getPlayedSongs(int eventId) async {
    final res = await http.get(Uri.parse('$baseUrl/events/$eventId/played'), headers: _headers)
        .timeout(const Duration(seconds: 12));
    if (res.statusCode != 200) return [];
    final list = jsonDecode(res.body) as List;
    return list.map((j) => Song.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<void> vote(int songId, String deviceId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/votes'),
      headers: _headers,
      body: jsonEncode({'song_id': songId, 'device_id': deviceId}),
    ).timeout(const Duration(seconds: 12));

    if (res.statusCode == 201) return;

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final msg = body['message'] as String? ?? 'Error al votar';
    throw Exception(msg);
  }

  Future<void> unvote(int songId, String deviceId) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/votes'),
      headers: _headers,
      body: jsonEncode({'song_id': songId, 'device_id': deviceId}),
    ).timeout(const Duration(seconds: 12));

    if (res.statusCode == 200 || res.statusCode == 201) return;
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final msg = body['message'] as String? ?? 'Error al quitar voto';
    throw Exception(msg);
  }

  Future<List<Map<String, dynamic>>> searchEvents(String q) async {
    final encoded = Uri.encodeComponent(q);
    final res = await http.get(
      Uri.parse('$baseUrl/events/search?q=$encoded'),
      headers: _headers,
    ).timeout(const Duration(seconds: 12));
    if (res.statusCode == 200) {
      final list = jsonDecode(res.body) as List;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Error al buscar eventos');
  }

  Future<void> heartbeat(int eventId, String deviceId) async {
    try {
      await http.post(
        Uri.parse('$baseUrl/events/$eventId/heartbeat'),
        headers: _headers,
        body: jsonEncode({'device_id': deviceId}),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {}
  }

  Future<int> getActiveDevices(int eventId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/events/$eventId/active-devices'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return (data['count'] as int?) ?? 0;
      }
    } catch (_) {}
    return 0;
  }
}
