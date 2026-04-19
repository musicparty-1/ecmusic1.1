import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../config.dart';

/// Overlay/Bottom-sheet de confirmación emocional post-voto.
/// Uso:  showVoteConfirmation(context, songTitle: 'La Bichota', position: 1);
void showVoteConfirmation(
  BuildContext context, {
  required String songTitle,
  required int position,
  required int totalVotes,
  String artist = '',
}) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.5),
    isDismissible: true,
    enableDrag: true,
    builder: (_) => _VoteConfirmationSheet(
      songTitle: songTitle,
      artist: artist,
      position: position,
      totalVotes: totalVotes,
    ),
  );

  // Auto-dismiss después de 2.5s
  Future.delayed(const Duration(milliseconds: 2500), () {
    if (context.mounted) Navigator.of(context, rootNavigator: true).maybePop();
  });
}

class _VoteConfirmationSheet extends StatefulWidget {
  final String songTitle;
  final String artist;
  final int position;
  final int totalVotes;

  const _VoteConfirmationSheet({
    required this.songTitle,
    required this.artist,
    required this.position,
    required this.totalVotes,
  });

  @override
  State<_VoteConfirmationSheet> createState() => _VoteConfirmationSheetState();
}

class _VoteConfirmationSheetState extends State<_VoteConfirmationSheet>
    with TickerProviderStateMixin {
  late AnimationController _scaleCtrl;
  late AnimationController _fireCtrl;
  late Animation<double> _scaleAnim;
  late Animation<double> _fireAnim;

  @override
  void initState() {
    super.initState();

    HapticFeedback.heavyImpact();

    _scaleCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _fireCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..repeat(reverse: true);

    _scaleAnim = Tween(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(parent: _scaleCtrl, curve: Curves.elasticOut));
    _fireAnim  = Tween(begin: 0.8, end: 1.15).animate(
      CurvedAnimation(parent: _fireCtrl, curve: Curves.easeInOut));

    _scaleCtrl.forward();
  }

  @override
  void dispose() {
    _scaleCtrl.dispose();
    _fireCtrl.dispose();
    super.dispose();
  }

  String _positionLabel(int pos) {
    if (pos == 1) return '🥇 #1 · La más votada';
    if (pos == 2) return '🥈 #2 · Casi arriba';
    if (pos == 3) return '🥉 #3 · Top 3';
    if (pos <= 5) return '🔥 Top 5 · Subiendo fuerte';
    if (pos <= 10) return '⚡ Top 10 · En el radar';
    return '📈 Posición #$pos · El voto cuenta';
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleCtrl,
      builder: (_, child) => Transform.scale(scale: _scaleAnim.value, child: child),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          color: const Color(0xFF0A0D14),
          border: Border.all(color: kPrimary.withValues(alpha: 0.4), width: 1.5),
          boxShadow: [
            BoxShadow(color: kPrimary.withValues(alpha: 0.3), blurRadius: 50, offset: const Offset(0, -10)),
            BoxShadow(color: kSecondary.withValues(alpha: 0.15), blurRadius: 80, offset: const Offset(0, 10)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 36, height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: kBorderColor,
                borderRadius: BorderRadius.circular(99),
              ),
            ),

            // 🔥 emoji animado
            AnimatedBuilder(
              animation: _fireAnim,
              builder: (_, child) => Transform.scale(scale: _fireAnim.value, child: child),
              child: const Text('🔥', style: TextStyle(fontSize: 56)),
            ),

            const SizedBox(height: 16),

            // Headline
            ShaderMask(
              shaderCallback: (b) => const LinearGradient(
                colors: [Colors.white, Color(0xFFa78bfa)],
              ).createShader(b),
              child: const Text(
                '¡Tu voto cuenta!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ),

            const SizedBox(height: 8),

            // Canción votada
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  kPrimary.withValues(alpha: 0.12),
                  kSecondary.withValues(alpha: 0.06),
                ]),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kPrimary.withValues(alpha: 0.25)),
              ),
              child: Row(children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(
                    color: kPrimary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.music_note_rounded, color: kPrimary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(widget.songTitle,
                      style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  if (widget.artist.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(widget.artist,
                        style: const TextStyle(color: kTextMuted, fontSize: 12),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ])),
                const Icon(Icons.check_circle_rounded, color: kSuccess, size: 22),
              ]),
            ),

            const SizedBox(height: 16),

            // Posición actual
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: widget.position <= 3
                    ? const Color(0xFFFFD700).withValues(alpha: 0.07)
                    : kCardColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: widget.position <= 3
                      ? const Color(0xFFFFD700).withValues(alpha: 0.25)
                      : kBorderColor,
                ),
              ),
              child: Column(children: [
                Text(
                  _positionLabel(widget.position),
                  style: TextStyle(
                    color: widget.position <= 3 ? const Color(0xFFFFD700) : Colors.white,
                    fontSize: 14, fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.totalVotes} votos en total en este evento',
                  style: const TextStyle(color: kTextMuted, fontSize: 11),
                ),
              ]),
            ),

            const SizedBox(height: 20),

            // Mensaje motivacional
            Text(
              'Seguí votando para que tu canción suba más 🚀',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: kTextMuted.withValues(alpha: 0.7),
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
