import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'api.dart';
import 'models.dart';

// ─── API provider ─────────────────────────────────────────────────────────────
final apiProvider = Provider((_) => const ApiService());

// ─── Device ID ────────────────────────────────────────────────────────────────
final deviceIdProvider = FutureProvider<String>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  String? id = prefs.getString('device_id');
  if (id == null) {
    id = const Uuid().v4();
    await prefs.setString('device_id', id);
  }
  return id;
});

// ─── Estado del evento ────────────────────────────────────────────────────────
// trend: 'up' | 'down' | 'same' | 'new'
class EventState {
  final EventData? event;
  final List<Song> songs;
  final Song? nowPlaying;
  final Set<int> votedSongs;
  final bool loading;
  final String? error;
  final int? votingId;
  /// songId → tendencia de posición respecto a la fetch anterior
  final Map<int, String> songTrends;
  /// Personas activas ahora mismo en el evento
  final int activeDevices;

  const EventState({
    this.event,
    this.songs = const [],
    this.nowPlaying,
    this.votedSongs = const {},
    this.loading = true,
    this.error,
    this.votingId,
    this.songTrends = const {},
    this.activeDevices = 0,
  });

  EventState copyWith({
    EventData? event,
    List<Song>? songs,
    Song? nowPlaying,
    bool clearNowPlaying = false,
    Set<int>? votedSongs,
    bool? loading,
    String? error,
    bool clearError = false,
    int? votingId,
    bool clearVotingId = false,
    Map<int, String>? songTrends,
    int? activeDevices,
  }) =>
      EventState(
        event: event ?? this.event,
        songs: songs ?? this.songs,
        nowPlaying: clearNowPlaying ? null : (nowPlaying ?? this.nowPlaying),
        votedSongs: votedSongs ?? this.votedSongs,
        loading: loading ?? this.loading,
        error: clearError ? null : (error ?? this.error),
        votingId: clearVotingId ? null : (votingId ?? this.votingId),
        songTrends: songTrends ?? this.songTrends,
        activeDevices: activeDevices ?? this.activeDevices,
      );
}

// ─── Notifier ─────────────────────────────────────────────────────────────────
class EventNotifier extends StateNotifier<EventState> {
  final ApiService _api;
  final int eventId;
  Timer? _pollTimer;
  Timer? _heartbeatTimer;
  String? _deviceId;

  EventNotifier(this._api, this.eventId) : super(const EventState()) {
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    // Obtener o crear device_id
    String? id = prefs.getString('device_id');
    if (id == null) {
      id = const Uuid().v4();
      await prefs.setString('device_id', id);
    }
    _deviceId = id;

    // Cargar votos persistidos
    final saved = prefs.getStringList('voted_$eventId') ?? [];
    final votedSet = saved.map(int.parse).toSet();
    state = state.copyWith(votedSongs: votedSet);

    await _fetch();
    _startTimers();
  }

  Future<void> _fetch({bool silent = false}) async {
    if (!silent) state = state.copyWith(loading: true, clearError: true);
    try {
      final results = await Future.wait([
        _api.getEvent(eventId),
        _api.getRanking(eventId),
        _api.getPlayedSongs(eventId),
        _api.getActiveDevices(eventId),
      ]);

      final event = results[0] as EventData;
      final newSongs = results[1] as List<Song>;
      final played = results[2] as List<Song>;
      final activeDevices = results[3] as int;
      final nowPlaying = played.isNotEmpty ? played.first : null;

      // Calcular tendencias comparando con las posiciones anteriores
      final prevPositions = <int, int>{};
      for (var i = 0; i < state.songs.length; i++) {
        prevPositions[state.songs[i].id] = i;
      }
      final trends = <int, String>{};
      for (var i = 0; i < newSongs.length; i++) {
        final prev = prevPositions[newSongs[i].id];
        if (prev == null) {
          trends[newSongs[i].id] = 'new';
        } else if (prev > i) {
          trends[newSongs[i].id] = 'up';
        } else if (prev < i) {
          trends[newSongs[i].id] = 'down';
        } else {
          trends[newSongs[i].id] = 'same';
        }
      }

      if (mounted) {
        state = state.copyWith(
          event: event,
          songs: newSongs,
          songTrends: trends,
          nowPlaying: nowPlaying,
          clearNowPlaying: nowPlaying == null,
          loading: false,
          clearError: true,
          activeDevices: activeDevices,
        );
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          loading: false,
          error: e.toString().replaceFirst('Exception: ', ''),
        );
      }
    }
  }

  void _startTimers() {
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) => _fetch(silent: true));

    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (_deviceId != null) _api.heartbeat(eventId, _deviceId!);
    });

    if (_deviceId != null) _api.heartbeat(eventId, _deviceId!);
  }

  Future<bool> vote(int songId) async {
    if (_deviceId == null || state.votingId != null) return false;
    if (state.votedSongs.contains(songId)) return false;

    state = state.copyWith(votingId: songId);
    try {
      await _api.vote(songId, _deviceId!);

      final newVoted = {...state.votedSongs, songId};
      state = state.copyWith(votedSongs: newVoted, clearVotingId: true);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(
          'voted_$eventId', newVoted.map((e) => e.toString()).toList());

      await _fetch(silent: true);
      return true;
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          clearVotingId: true,
          error: e.toString().replaceFirst('Exception: ', ''),
        );
        Timer(const Duration(seconds: 3), () {
          if (mounted) state = state.copyWith(clearError: true);
        });
      }
      return false;
    }
  }

  Future<void> unvote(int songId) async {
    if (_deviceId == null || state.votingId != null) return;
    if (!state.votedSongs.contains(songId)) return;

    state = state.copyWith(votingId: songId);
    try {
      await _api.unvote(songId, _deviceId!);

      final newVoted = {...state.votedSongs}..remove(songId);
      state = state.copyWith(votedSongs: newVoted, clearVotingId: true);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(
          'voted_$eventId', newVoted.map((e) => e.toString()).toList());

      await _fetch(silent: true);
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          clearVotingId: true,
          error: e.toString().replaceFirst('Exception: ', ''),
        );
        Timer(const Duration(seconds: 3), () {
          if (mounted) state = state.copyWith(clearError: true);
        });
      }
    }
  }

  Future<void> refresh() => _fetch();

  @override
  void dispose() {
    _pollTimer?.cancel();
    _heartbeatTimer?.cancel();
    super.dispose();
  }
}

// ─── Provider del evento ──────────────────────────────────────────────────────
final eventProvider =
    StateNotifierProvider.family<EventNotifier, EventState, int>(
  (ref, eventId) => EventNotifier(ref.watch(apiProvider), eventId),
);
