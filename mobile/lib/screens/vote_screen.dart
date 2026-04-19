import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config.dart';
import '../models.dart';
import '../providers.dart';
import 'vote_confirmation.dart';
import 'ranking_screen.dart';

class VoteScreen extends ConsumerStatefulWidget {
  final int eventId;
  const VoteScreen({super.key, required this.eventId});

  @override
  ConsumerState<VoteScreen> createState() => _VoteScreenState();
}

class _VoteScreenState extends ConsumerState<VoteScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(eventProvider(widget.eventId));
    final notifier = ref.read(eventProvider(widget.eventId).notifier);

    final filteredSongs = _query.isEmpty
        ? state.songs
        : state.songs.where((s) {
            final q = _query.toLowerCase();
            return s.title.toLowerCase().contains(q) ||
                s.artist.toLowerCase().contains(q);
          }).toList();

    return Scaffold(
      backgroundColor: kBgColor,
      body: state.loading && state.event == null
          ? const _LoadingView()
          : state.error != null && state.event == null
              ? _ErrorView(message: state.error!, onRetry: notifier.refresh)
              : _buildMain(context, state, notifier, filteredSongs),
    );
  }

  Widget _buildMain(BuildContext context, EventState state, EventNotifier notifier, List<Song> filteredSongs) {
    final event = state.event!;
    final isFinished = event.status == 'FINISHED';
    final isRecital = event.isRecitalMode;
    final canVote = !isFinished && !isRecital;
    final votesLeft = event.maxVotesPerDevice - state.votedSongs.length;
    final songs = filteredSongs;

    return Stack(
      children: [
        // Fondo con gradiente sutil
        Positioned(top: -100, right: -80,
            child: _Orb(size: 320, color: kPrimary.withValues(alpha: 0.11))),
        Positioned(bottom: -60, left: -60,
            child: _Orb(size: 240, color: kSecondary.withValues(alpha: 0.08))),
        Positioned(top: 350, left: -80,
            child: _Orb(size: 180, color: kPrimary.withValues(alpha: 0.05))),

        SafeArea(
          child: Column(
            children: [
              // ── Header ────────────────────────────────────────────────────
              _Header(
                event: event,
                votesLeft: votesLeft,
                canVote: canVote,
                isRecital: isRecital,
                activeDevices: state.activeDevices,
                onRankingTap: () => Navigator.push(context, PageRouteBuilder(
                  pageBuilder: (_, a, s) => RankingScreen(eventId: widget.eventId),
                  transitionsBuilder: (_, a, s, child) => SlideTransition(
                    position: Tween(begin: const Offset(1, 0), end: Offset.zero)
                        .animate(CurvedAnimation(parent: a, curve: Curves.easeOutCubic)),
                    child: child,
                  ),
                  transitionDuration: const Duration(milliseconds: 300),
                )),
              ),

              // ── Error toast ───────────────────────────────────────────────
              if (state.error != null)
                _ErrorToast(message: state.error!),

              // ── Now Playing ───────────────────────────────────────────────
              if (state.nowPlaying != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: _NowPlayingCard(song: state.nowPlaying!),
                ),

              // ── Search ────────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: _SearchBar(
                  controller: _searchController,
                  onChanged: (v) => setState(() => _query = v),
                  onClear: () { _searchController.clear(); setState(() => _query = ''); },
                ),
              ),

              // ── Banner sin votos ──────────────────────────────────────────
              if (canVote && votesLeft == 0)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [
                        kPrimary.withValues(alpha: 0.14),
                        kSecondary.withValues(alpha: 0.08),
                      ]),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: kPrimary.withValues(alpha: 0.3)),
                    ),
                    child: Row(children: [
                      const Text('🎉', style: TextStyle(fontSize: 20)),
                      const SizedBox(width: 10),
                      const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('¡Usaste todos tus votos!',
                            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                        SizedBox(height: 2),
                        Text('Podés ver el ranking en tiempo real',
                            style: TextStyle(color: kTextMuted, fontSize: 11)),
                      ])),
                    ]),
                  ),
                ),

              // ── Lista ─────────────────────────────────────────────────────
              Expanded(
                child: songs.isEmpty
                    ? _EmptyList(hasQuery: _query.isNotEmpty, query: _query)
                    : RefreshIndicator(
                        onRefresh: notifier.refresh,
                        color: kPrimary,
                        backgroundColor: kCardColor,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                          itemCount: songs.length,
                          itemBuilder: (_, i) {
                            final song = songs[i];
                            final hasVoted = state.votedSongs.contains(song.id);
                            final isVoting = state.votingId == song.id;
                            final total = songs.fold(0, (s, e) => s + e.votes);
                            final trend = state.songTrends[song.id] ?? 'same';
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: _SongCard(
                                song: song,
                                rank: i + 1,
                                hasVoted: hasVoted,
                                isVoting: isVoting,
                                canVote: canVote && !hasVoted && votesLeft > 0,
                                totalVotes: total,
                                trend: trend,
                                onVote: () async {
                                  HapticFeedback.lightImpact();
                                  final success = await notifier.vote(song.id);
                                  if (success && context.mounted) {
                                    showVoteConfirmation(
                                      context,
                                      songTitle: song.title,
                                      artist: song.artist,
                                      position: i + 1,
                                      totalVotes: total,
                                    );
                                  }
                                },
                                onUnvote: () async {
                                  HapticFeedback.mediumImpact();
                                  await notifier.unvote(song.id);
                                },
                              ),
                            );
                          },
                        ),
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
class _Header extends StatelessWidget {
  final EventData event;
  final int votesLeft;
  final bool canVote;
  final bool isRecital;
  final int activeDevices;
  final VoidCallback? onRankingTap;
  const _Header({required this.event, required this.votesLeft, required this.canVote, required this.isRecital, required this.activeDevices, this.onRankingTap});

  @override
  Widget build(BuildContext context) {
    final isFinished = event.status == 'FINISHED';

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Línea gradiente superior
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
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          // Botón volver
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
          // Nombre evento
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(event.name,
                style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: -0.3),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 3),
            Row(children: [
              const Icon(Icons.location_on_outlined, color: kTextMuted, size: 11),
              const SizedBox(width: 2),
              Expanded(child: Text(event.venue,
                  style: const TextStyle(color: kTextMuted, fontSize: 12),
                  maxLines: 1, overflow: TextOverflow.ellipsis)),
            ]),
          ])),
          if (activeDevices > 0) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  width: 5, height: 5,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text('$activeDevices votando',
                    style: const TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w700)),
              ]),
            ),
          ],
          const SizedBox(width: 8),
          // Botón Ranking
          if (onRankingTap != null)
            GestureDetector(
              onTap: onRankingTap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF6D28D9), kPrimary]),
                  borderRadius: BorderRadius.circular(999),
                  boxShadow: [BoxShadow(color: kPrimary.withValues(alpha: 0.4), blurRadius: 8, offset: const Offset(0, 3))],
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Text('🏆', style: TextStyle(fontSize: 12)),
                  SizedBox(width: 4),
                  Text('TOP', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                ]),
              ),
            ),
          const SizedBox(width: 6),
          // Badge estado
          _StatusBadge(status: event.status, isRecital: isRecital),
        ]),

        if (canVote && !isFinished) ...[
          const SizedBox(height: 12),
          // Barra de votos disponibles
          _VotesBar(votesLeft: votesLeft, maxVotes: event.maxVotesPerDevice),
        ],
      ]),
        ),  // inner Container
      ],    // outer Column children
    );      // outer Column
  }
}

class _VotesBar extends StatelessWidget {
  final int votesLeft;
  final int maxVotes;
  const _VotesBar({required this.votesLeft, required this.maxVotes});

  @override
  Widget build(BuildContext context) {
    final fraction = maxVotes > 0 ? votesLeft / maxVotes : 0.0;
    final isEmpty = votesLeft == 0;
    final color = isEmpty ? kTextMuted : votesLeft == 1 ? kWarning : kPrimary;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isEmpty
            ? kBorderColor.withValues(alpha: 0.3)
            : color.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isEmpty ? kBorderColor : color.withValues(alpha: 0.25),
        ),
      ),
      child: Row(children: [
        Icon(
          isEmpty ? Icons.check_circle_outline_rounded : Icons.how_to_vote_outlined,
          color: color, size: 14,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              isEmpty ? 'Todos los votos usados' : '$votesLeft voto${votesLeft == 1 ? '' : 's'} disponible${votesLeft == 1 ? '' : 's'}',
              style: TextStyle(color: isEmpty ? kTextMuted : Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 5),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: fraction),
                duration: const Duration(milliseconds: 600),
                curve: Curves.easeOut,
                builder: (_, v, child) => LinearProgressIndicator(
                  value: v,
                  backgroundColor: kBorderColor,
                  valueColor: AlwaysStoppedAnimation(color),
                  minHeight: 3,
                ),
              ),
            ),
          ]),
        ),
        const SizedBox(width: 8),
        Text(
          '${maxVotes - votesLeft}/$maxVotes',
          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w800, fontFeatures: const [FontFeature.tabularFigures()]),
        ),
      ]),
    );
  }
}

class _StatusBadge extends StatefulWidget {
  final String status;
  final bool isRecital;
  const _StatusBadge({required this.status, required this.isRecital});
  @override
  State<_StatusBadge> createState() => _StatusBadgeState();
}
class _StatusBadgeState extends State<_StatusBadge> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))..repeat(reverse: true);
    _anim = Tween(begin: 0.4, end: 1.0).animate(_ctrl);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (widget.status) {
      'FINISHED' => (kTextMuted, 'FINALIZADO'),
      'PENDING'  => (kWarning, 'PRE-EVENTO'),
      _ when widget.isRecital => (const Color(0xFF38BDF8), 'RECITAL'),
      _ => (kSuccess, 'EN VIVO'),
    };
    final isLive = widget.status == 'ACTIVE' && !widget.isRecital;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (isLive)
          AnimatedBuilder(
            animation: _anim,
            builder: (_, child) => Container(
              width: 6, height: 6, margin: const EdgeInsets.only(right: 5),
              decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: _anim.value)),
            ),
          ),
        Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
      ]),
    );
  }
}

// ── Now Playing ───────────────────────────────────────────────────────────────
class _NowPlayingCard extends StatelessWidget {
  final Song song;
  const _NowPlayingCard({required this.song});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft, end: Alignment.bottomRight,
        colors: [kPrimary.withValues(alpha: 0.28), kSecondary.withValues(alpha: 0.16)],
      ),
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: kPrimary.withValues(alpha: 0.55), width: 1.5),
      boxShadow: [
        BoxShadow(color: kPrimary.withValues(alpha: 0.28), blurRadius: 32, offset: const Offset(0, 8)),
        BoxShadow(color: kSecondary.withValues(alpha: 0.12), blurRadius: 48, offset: const Offset(0, 12)),
      ],
    ),
    child: Row(children: [
      // Equalizer container
      Container(
        width: 42, height: 42,
        decoration: BoxDecoration(
          color: kPrimary.withValues(alpha: 0.18),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(child: _Equalizer()),
      ),
      const SizedBox(width: 13),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 6, height: 6,
            decoration: BoxDecoration(shape: BoxShape.circle, color: kSuccess,
                boxShadow: [BoxShadow(color: kSuccess.withValues(alpha: 0.7), blurRadius: 6)]),
          ),
          const SizedBox(width: 5),
          const Text('SONANDO AHORA',
              style: TextStyle(color: kPrimary, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        ]),
        const SizedBox(height: 3),
        Text(song.title,
            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: -0.3),
            maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 1),
        Text(song.artist,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 12),
            maxLines: 1, overflow: TextOverflow.ellipsis),
      ])),
    ]),
  );
}

// ── Equalizer ─────────────────────────────────────────────────────────────────
class _Equalizer extends StatefulWidget {
  const _Equalizer();
  @override
  State<_Equalizer> createState() => _EqualizerState();
}
class _EqualizerState extends State<_Equalizer> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late List<Animation<double>> _anims;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);
    final heights = [0.6, 1.0, 0.4, 0.85, 0.55];
    _anims = List.generate(5, (i) => Tween(begin: 0.2, end: heights[i]).animate(
      CurvedAnimation(parent: _ctrl, curve: Interval(i * 0.1, 1.0, curve: Curves.easeInOut))));
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _ctrl,
    builder: (_, child) => Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(5, (i) => Container(
        width: 3, height: 22 * _anims[i].value,
        margin: const EdgeInsets.only(right: 2),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(99),
          gradient: const LinearGradient(
            begin: Alignment.bottomCenter, end: Alignment.topCenter,
            colors: [kPrimary, kSecondary]),
        ),
      )),
    ),
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  const _SearchBar({required this.controller, required this.onChanged, required this.onClear});

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    onChanged: onChanged,
    style: const TextStyle(color: Colors.white, fontSize: 14),
    decoration: InputDecoration(
      hintText: 'Buscar canción o artista...',
      hintStyle: const TextStyle(color: kTextMuted, fontSize: 14),
      prefixIcon: const Icon(Icons.search_rounded, color: kTextMuted, size: 18),
      suffixIcon: controller.text.isNotEmpty
          ? IconButton(icon: const Icon(Icons.close_rounded, color: kTextMuted, size: 16), onPressed: onClear)
          : null,
      filled: true,
      fillColor: kCardColor,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: kBorderColor)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: kBorderColor)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: kPrimary, width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    ),
  );
}

// ── Song card ─────────────────────────────────────────────────────────────────
class _SongCard extends StatefulWidget {
  final Song song;
  final int rank;
  final bool hasVoted;
  final bool isVoting;
  final bool canVote;
  final int totalVotes;
  final String trend; // 'up' | 'down' | 'same' | 'new'
  final VoidCallback onVote;
  final VoidCallback onUnvote;
  const _SongCard({required this.song, required this.rank, required this.hasVoted,
      required this.isVoting, required this.canVote, required this.totalVotes,
      required this.trend, required this.onVote, required this.onUnvote});
  @override
  State<_SongCard> createState() => _SongCardState();
}
class _SongCardState extends State<_SongCard> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 100),
        lowerBound: 0.97, upperBound: 1.0, value: 1.0);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final isTop3 = widget.rank <= 3;
    final topColors = [
      [const Color(0xFFFFD700), const Color(0xFFFFA500)],
      [const Color(0xFFC0C0C0), const Color(0xFF9AA0A6)],
      [const Color(0xFFCD7F32), const Color(0xFFB87333)],
    ];

    return GestureDetector(
      onTapDown: widget.canVote ? (_) => _ctrl.reverse() : null,
      onTapUp: widget.canVote ? (_) { _ctrl.forward(); widget.onVote(); } : null,
      onTapCancel: () => _ctrl.forward(),
      child: AnimatedBuilder(
        animation: _ctrl,
        builder: (_, child) => Transform.scale(scale: _ctrl.value, child: child),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: widget.hasVoted ? kSuccess.withValues(alpha: 0.06) : kCardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: widget.hasVoted ? kSuccess.withValues(alpha: 0.35)
                  : isTop3 ? topColors[widget.rank - 1][0].withValues(alpha: 0.25) : kBorderColor,
              width: widget.hasVoted || isTop3 ? 1.5 : 1,
            ),
          ),
          child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Row(children: [
            // Borde izquierdo de acento
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 3,
              color: widget.rank == 1 ? const Color(0xFFFFD700)
                  : widget.rank == 2 ? const Color(0xFFC0C0C0)
                  : widget.rank == 3 ? const Color(0xFFCD7F32)
                  : widget.hasVoted ? kSuccess.withValues(alpha: 0.7)
                  : kBorderColor.withValues(alpha: 0.3),
            ),
            Expanded(child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
            child: Row(children: [
            // Rank badge - con 🔥 para el primero
            SizedBox(
              width: 32,
              child: isTop3
                  ? Text(
                      widget.rank == 1 ? '🔥' : ['🥈', '🥉'][widget.rank - 2],
                      style: const TextStyle(fontSize: 20), textAlign: TextAlign.center)
                  : Text('#${widget.rank}',
                      style: const TextStyle(color: kTextMuted, fontSize: 12, fontWeight: FontWeight.w700),
                      textAlign: TextAlign.center),
            ),
            const SizedBox(width: 10),
            // Info + barra de progreso
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(
                  child: Text(widget.song.title,
                      style: TextStyle(
                        color: widget.hasVoted ? kSuccess : Colors.white,
                        fontSize: 14, fontWeight: FontWeight.w700),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                if (widget.trend == 'up')
                  const Text('🔥', style: TextStyle(fontSize: 13))
                else if (widget.trend == 'new')
                  Container(
                    margin: const EdgeInsets.only(left: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: kSuccess.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: kSuccess.withValues(alpha: 0.4)),
                    ),
                    child: const Text('NUEVA', style: TextStyle(color: kSuccess, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 0.4)),
                  )
                else if (widget.trend == 'down')
                  const Text('⬇', style: TextStyle(fontSize: 11)),
              ]),
              const SizedBox(height: 4),
              // Barra de progreso animada
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0,
                    end: widget.totalVotes > 0 ? widget.song.votes / widget.totalVotes : 0),
                duration: const Duration(milliseconds: 700),
                curve: Curves.easeOut,
                builder: (_, v, child) => ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: v,
                    backgroundColor: Colors.white.withValues(alpha: 0.06),
                    valueColor: AlwaysStoppedAnimation(
                      widget.hasVoted ? kSuccess : (isTop3 ? kPrimary : kPrimary.withValues(alpha: 0.5))),
                    minHeight: 4,
                  ),
                ),
              ),
              const SizedBox(height: 3),
              Text(widget.song.artist,
                  style: const TextStyle(color: kTextMuted, fontSize: 11),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
            const SizedBox(width: 10),
            // Votos + %
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                child: Text(
                    widget.song.votes == 0 ? '—' : '${widget.song.votes}',
                    key: ValueKey(widget.song.votes),
                    style: TextStyle(
                      color: widget.song.votes > 0 ? Colors.white : kTextMuted,
                      fontSize: 18, fontWeight: FontWeight.w800,
                      fontFeatures: const [FontFeature.tabularFigures()])),
              ),
              if (widget.totalVotes > 0 && widget.song.votes > 0)
                Text('${(widget.song.votes / widget.totalVotes * 100).round()}%',
                    style: TextStyle(
                      color: isTop3 ? kPrimaryLight : kTextMuted,
                      fontSize: 10, fontWeight: FontWeight.w700,
                      fontFeatures: const [FontFeature.tabularFigures()])),
            ]),
            const SizedBox(width: 10),
            // Botón votar / cambiar
            _VoteBtn(hasVoted: widget.hasVoted, isVoting: widget.isVoting,
                canVote: widget.canVote, onVote: widget.onVote,
                onUnvote: widget.onUnvote),
          ]),
          )),  // Padding + Expanded
        ]),    // Row (acento + contenido)
        ),     // ClipRRect
      ),       // AnimatedContainer
    ),         // AnimatedBuilder > Transform.scale
  );           // GestureDetector
  }
}

class _VoteBtn extends StatelessWidget {
  final bool hasVoted, isVoting, canVote;
  final VoidCallback onVote;
  final VoidCallback onUnvote;
  const _VoteBtn({
    required this.hasVoted, required this.isVoting,
    required this.canVote, required this.onVote, required this.onUnvote,
  });

  @override
  Widget build(BuildContext context) {
    if (isVoting) {
      return Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: kPrimary.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: kPrimary.withValues(alpha: 0.3)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: const [
          SizedBox(width: 13, height: 13,
              child: CircularProgressIndicator(color: kPrimary, strokeWidth: 2)),
          SizedBox(width: 6),
          Text('...', style: TextStyle(color: kPrimary, fontSize: 11, fontWeight: FontWeight.w800)),
        ]),
      );
    }
    if (hasVoted) {
      return GestureDetector(
        onTap: onUnvote,
        child: Container(
          height: 34,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            color: kSuccess.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: kSuccess.withValues(alpha: 0.35)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: const [
            Icon(Icons.check_rounded, color: kSuccess, size: 13),
            SizedBox(width: 4),
            Text('VOTADO', style: TextStyle(color: kSuccess, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.4)),
            SizedBox(width: 5),
            Text('·', style: TextStyle(color: kTextMuted, fontSize: 9)),
            SizedBox(width: 5),
            Text('CAMBIAR', style: TextStyle(color: kTextMuted, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.3)),
          ]),
        ),
      );
    }
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      height: 34,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        gradient: canVote
            ? const LinearGradient(colors: [Color(0xFF6D28D9), kPrimary])
            : null,
        color: canVote ? null : kCardColor,
        borderRadius: BorderRadius.circular(999),
        border: canVote ? null : Border.all(color: kBorderColor),
        boxShadow: canVote ? [BoxShadow(color: kPrimary.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4))] : null,
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.thumb_up_alt_rounded, color: canVote ? Colors.white : kTextMuted, size: 14),
        const SizedBox(width: 5),
        Text('VOTAR', style: TextStyle(color: canVote ? Colors.white : kTextMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
      ]),
    );
  }
}

// ── Loading ───────────────────────────────────────────────────────────────────
class _LoadingView extends StatelessWidget {
  const _LoadingView();
  @override
  Widget build(BuildContext context) => const Scaffold(
    backgroundColor: kBgColor,
    body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      CircularProgressIndicator(color: kPrimary, strokeWidth: 2),
      SizedBox(height: 16),
      Text('Cargando evento...', style: TextStyle(color: kTextMuted, fontSize: 14)),
    ])),
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────
class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBgColor,
    body: Center(child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.wifi_off_rounded, color: kTextMuted, size: 56),
        const SizedBox(height: 16),
        Text(message, textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh_rounded, size: 18),
          label: const Text('Reintentar'),
          style: ElevatedButton.styleFrom(
            backgroundColor: kPrimary, foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ]),
    )),
  );
}

// ── Error toast ───────────────────────────────────────────────────────────────
class _ErrorToast extends StatelessWidget {
  final String message;
  const _ErrorToast({required this.message});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: kError.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kError.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        const Icon(Icons.error_outline_rounded, color: kError, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text(message, style: const TextStyle(color: kError, fontSize: 13))),
      ]),
    ),
  );
}

// ── Empty list ────────────────────────────────────────────────────────────────
class _EmptyList extends StatelessWidget {
  final bool hasQuery;
  final String query;
  const _EmptyList({required this.hasQuery, required this.query});
  @override
  Widget build(BuildContext context) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    Icon(hasQuery ? Icons.search_off_rounded : Icons.music_off_outlined,
        color: kTextMuted.withValues(alpha: 0.4), size: 52),
    const SizedBox(height: 12),
    Text(hasQuery ? 'Sin resultados para "$query"' : 'Sin canciones disponibles',
        style: const TextStyle(color: kTextMuted, fontSize: 14)),
  ]));
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
