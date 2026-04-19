class EventData {
  final int id;
  final String name;
  final String venue;
  final String status; // ACTIVE | PENDING | FINISHED
  final bool isRecitalMode;
  final int maxVotesPerDevice;

  const EventData({
    required this.id,
    required this.name,
    required this.venue,
    required this.status,
    required this.isRecitalMode,
    required this.maxVotesPerDevice,
  });

  factory EventData.fromJson(Map<String, dynamic> j) => EventData(
        id: j['id'] as int,
        name: j['name'] as String,
        venue: j['venue'] as String,
        status: j['status'] as String,
        isRecitalMode: j['isRecitalMode'] as bool? ?? false,
        maxVotesPerDevice: j['maxVotesPerDevice'] as int? ?? 3,
      );
}

class Song {
  final int id;
  final String title;
  final String artist;
  final int votes;
  final bool played;
  final String? playedAt;

  const Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.votes,
    required this.played,
    this.playedAt,
  });

  factory Song.fromJson(Map<String, dynamic> j) => Song(
        id: j['id'] as int,
        title: j['title'] as String,
        artist: j['artist'] as String,
        votes: (j['votes'] as num?)?.toInt() ?? 0,
        played: j['played'] as bool? ?? false,
        playedAt: j['played_at'] as String?,
      );
}
