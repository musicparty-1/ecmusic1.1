import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config.dart';
import '../models.dart';
import '../providers.dart';

class RankingScreen extends ConsumerWidget {
  final int eventId;
  const RankingScreen({super.key, required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(eventProvider(eventId));
    final songs = state.songs.take(10).toList();
    final maxVotes = songs.isEmpty ? 1 : (songs.first.votes > 0 ? songs.first.votes : 1);
    final total = songs.fold(0, (s, e) => s + e.votes);

    return Scaffold(
      backgroundColor: kBgColor,
      body: Stack(
        children: [
          // Orbs de fondo
          Positioned(top: -80, right: -60,
              child: _Orb(size: 300, color: kPrimary.withValues(alpha: 0.13))),
          Positioned(bottom: 60, left: -80,
              child: _Orb(size: 240, color: kSecondary.withValues(alpha: 0.09))),
          Positioned(top: 300, left: -60,
              child: _Orb(size: 160, color: const Color(0xFFFFD700).withValues(alpha: 0.04))),

          SafeArea(
            child: Column(
              children: [
                // ── Header ───────────────────────────────────────────────
                _RankingHeader(eventName: state.event?.name ?? ''),

                // ── Total votos ──────────────────────────────────────────
                if (total > 0)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [
                          kPrimary.withValues(alpha: 0.12),
                          kSecondary.withValues(alpha: 0.06),
                        ]),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kPrimary.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('⚡', style: TextStyle(fontSize: 16)),
                          const SizedBox(width: 8),
                          Text(
                            '$total votos en total',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                // ── Lista ranking ────────────────────────────────────────
                Expanded(
                  child: state.loading && songs.isEmpty
                      ? const Center(child: CircularProgressIndicator(color: kPrimary, strokeWidth: 2))
                      : songs.isEmpty
                          ? const Center(
                              child: Text('Sin canciones en el ranking',
                                  style: TextStyle(color: kTextMuted, fontSize: 14)),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                              itemCount: songs.length,
                              itemBuilder: (_, i) {
                                final song = songs[i];
                                final trend = state.songTrends[song.id] ?? 'same';
                                return TweenAnimationBuilder<double>(
                                  tween: Tween(begin: 0, end: 1),
                                  duration: Duration(milliseconds: 200 + i * 50),
                                  curve: Curves.easeOut,
                                  builder: (_, v, child) => Opacity(
                                    opacity: v,
                                    child: Transform.translate(
                                      offset: Offset(0, 20 * (1 - v)),
                                      child: child,
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: _RankingCard(
                                      song: song,
                                      rank: i + 1,
                                      maxVotes: maxVotes,
                                      total: total,
                                      trend: trend,
                                    ),
                                  ),
                                );
                              },
                            ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
class _RankingHeader extends StatelessWidget {
  final String eventName;
  const _RankingHeader({required this.eventName});

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        height: 2,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF7C3AED), Color(0xFFEC4899), Color(0xFF06B6D4)],
          ),
        ),
      ),
      Container(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
    decoration: BoxDecoration(
      color: const Color(0xFF08060F).withValues(alpha: 0.97),
      border: Border(bottom: BorderSide(color: kBorderColor.withValues(alpha: 0.5))),
    ),
    child: Row(children: [
      GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: kCardColor,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kBorderColor),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded, color: kTextSub, size: 16),
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('🏆 TOP 10',
              style: TextStyle(color: kPrimary, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.0)),
          const SizedBox(height: 2),
          Text(eventName,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: -0.3),
              maxLines: 1, overflow: TextOverflow.ellipsis),
        ]),
      ),
      // Indicador live
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: kSuccess.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: kSuccess.withValues(alpha: 0.3)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          _PulseDot(color: kSuccess),
          const SizedBox(width: 5),
          const Text('LIVE', style: TextStyle(color: kSuccess, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
        ]),
      ),
    ]),
      ),   // inner Container
    ],     // outer Column children
  );       // outer Column
}

// ── Ranking card ──────────────────────────────────────────────────────────────
class _RankingCard extends StatelessWidget {
  final Song song;
  final int rank;
  final int maxVotes;
  final int total;
  final String trend;

  const _RankingCard({
    required this.song,
    required this.rank,
    required this.maxVotes,
    required this.total,
    required this.trend,
  });

  @override
  Widget build(BuildContext context) {
    final isTop = rank == 1;
    final pct = maxVotes > 0 ? song.votes / maxVotes : 0.0;
    final votePct = total > 0 ? (song.votes / total * 100).round() : 0;

    final rankColors = [
      [const Color(0xFFFFD700), const Color(0xFFFFA500)],
      [const Color(0xFFC0C0C0), const Color(0xFF9AA0A6)],
      [const Color(0xFFCD7F32), const Color(0xFFB87333)],
    ];

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: isTop ? kPrimary.withValues(alpha: 0.08) : kCardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isTop
              ? kPrimary.withValues(alpha: 0.35)
              : rank <= 3
                  ? rankColors[rank - 1][0].withValues(alpha: 0.2)
                  : kBorderColor,
          width: isTop ? 1.5 : 1,
        ),
        boxShadow: isTop
            ? [
                BoxShadow(color: kPrimary.withValues(alpha: 0.2), blurRadius: 24, offset: const Offset(0, 8)),
                BoxShadow(color: const Color(0xFFFFD700).withValues(alpha: 0.08), blurRadius: 40, offset: const Offset(0, 4)),
              ]
            : rank == 2
                ? [BoxShadow(color: const Color(0xFFC0C0C0).withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 4))]
                : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(17),
        child: Column(children: [
          // Barra de fondo proporcional
          Stack(children: [
            // Progress bar de fondo
            Positioned.fill(
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: pct,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [
                      isTop ? kPrimary.withValues(alpha: 0.12) : kPrimary.withValues(alpha: 0.06),
                      Colors.transparent,
                    ]),
                  ),
                ),
              ),
            ),
            // Contenido
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
              child: Row(children: [
                // Badge de posición
                _RankBadge(rank: rank, colors: rank <= 3 ? rankColors[rank - 1] : null),
                const SizedBox(width: 12),

                // Info canción
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(
                      child: Text(song.title,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: isTop ? 16 : 14,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                    // Indicador de tendencia
                    const SizedBox(width: 6),
                    _TrendBadge(trend: trend, isTop: isTop),
                  ]),
                  const SizedBox(height: 3),
                  Text(song.artist,
                      style: const TextStyle(color: kTextMuted, fontSize: 12),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ])),
                const SizedBox(width: 12),

                // Votos
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 400),
                    child: Text(
                      '${song.votes}',
                      key: ValueKey(song.votes),
                      style: TextStyle(
                        color: isTop ? kPrimary : Colors.white,
                        fontSize: isTop ? 28 : 22,
                        fontWeight: FontWeight.w900,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                  ),
                  Text(
                    '$votePct%',
                    style: TextStyle(
                      color: isTop ? kPrimaryLight : kTextMuted,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ]),
              ]),
            ),
          ]),

          // Barra de progreso inferior
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: pct),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOut,
              builder: (_, v, child) => ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: LinearProgressIndicator(
                  value: v,
                  backgroundColor: Colors.white.withValues(alpha: 0.06),
                  valueColor: AlwaysStoppedAnimation(
                    isTop ? kPrimary : kPrimary.withValues(alpha: 0.5)),
                  minHeight: 3,
                ),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

// ── Rank badge ────────────────────────────────────────────────────────────────
class _RankBadge extends StatelessWidget {
  final int rank;
  final List<Color>? colors;
  const _RankBadge({required this.rank, this.colors});

  @override
  Widget build(BuildContext context) {
    if (rank <= 3 && colors != null) {
      return Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: colors!,
          ),
          boxShadow: rank == 1
              ? [BoxShadow(color: colors![0].withValues(alpha: 0.5), blurRadius: 14, offset: const Offset(0, 4))]
              : null,
        ),
        child: Center(
          child: Text(
            rank == 1 ? '🏆' : rank == 2 ? '🥈' : '🥉',
            style: const TextStyle(fontSize: 20),
          ),
        ),
      );
    }
    return Container(
      width: 44, height: 44,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.04),
        border: Border.all(color: kBorderColor),
      ),
      child: Center(
        child: Text(
          '#$rank',
          style: const TextStyle(color: kTextMuted, fontSize: 13, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }
}

// ── Trend badge ───────────────────────────────────────────────────────────────
class _TrendBadge extends StatelessWidget {
  final String trend;
  final bool isTop;
  const _TrendBadge({required this.trend, required this.isTop});

  @override
  Widget build(BuildContext context) {
    if (trend == 'up') {
      return Text(isTop ? '🔥' : '🔥', style: TextStyle(fontSize: isTop ? 16 : 13));
    }
    if (trend == 'new') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
        decoration: BoxDecoration(
          color: kSuccess.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: kSuccess.withValues(alpha: 0.4)),
        ),
        child: const Text('NUEVA', style: TextStyle(color: kSuccess, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 0.4)),
      );
    }
    if (trend == 'down') {
      return const Text('⬇', style: TextStyle(fontSize: 11));
    }
    return const SizedBox.shrink();
  }
}

// ── Pulse dot ─────────────────────────────────────────────────────────────────
class _PulseDot extends StatefulWidget {
  final Color color;
  const _PulseDot({required this.color});
  @override
  State<_PulseDot> createState() => _PulseDotState();
}
class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 1.0).animate(_ctrl);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, child) => Container(
      width: 6, height: 6,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: widget.color.withValues(alpha: _anim.value),
      ),
    ),
  );
}

// ── Orb ───────────────────────────────────────────────────────────────────────
class _Orb extends StatelessWidget {
  final double size;
  final Color color;
  const _Orb({required this.size, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(shape: BoxShape.circle, color: color,
        boxShadow: [BoxShadow(color: color, blurRadius: size * 0.5)]),
  );
}
