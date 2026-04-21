import 'dart:async';
import 'package:flutter/material.dart';
import '../config.dart';
import '../api.dart';
import 'vote_screen.dart';

class _EventResult {
  final int id;
  final String name;
  final String venue;
  final String status;
  final String? djName;
  const _EventResult({
    required this.id,
    required this.name,
    required this.venue,
    required this.status,
    this.djName,
  });
  factory _EventResult.fromJson(Map<String, dynamic> j) => _EventResult(
        id: j['id'] as int,
        name: j['name'] as String,
        venue: j['venue'] as String,
        status: j['status'] as String,
        djName: j['djName'] as String?,
      );
}

class EntryScreen extends StatefulWidget {
  const EntryScreen({super.key});
  @override
  State<EntryScreen> createState() => _EntryScreenState();
}

class _EntryScreenState extends State<EntryScreen>
    with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  final _api = const ApiService();

  List<_EventResult> _results = [];
  bool _loading = true;
  bool _searching = false;
  String? _error;
  Timer? _debounce;
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
    _loadAll(); // carga todos los eventos activos al entrar
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() { _loading = true; _error = null; });
    try {
      final list = await _api.searchEvents('');
      if (!mounted) return;
      setState(() {
        _results = list.map((j) => _EventResult.fromJson(j)).toList();
        _error = _results.isEmpty ? 'No hay eventos activos en este momento' : null;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = 'Sin conexión al servidor'; _loading = false; });
    }
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    if (value.trim().isEmpty) {
      _loadAll();
      return;
    }
    if (value.trim().length < 2) {
      setState(() { _error = null; _searching = false; });
      return;
    }
    setState(() => _searching = true);
    _debounce = Timer(const Duration(milliseconds: 400), () => _search(value.trim()));
  }

  Future<void> _search(String q) async {
    try {
      final list = await _api.searchEvents(q);
      if (!mounted) return;
      setState(() {
        _results = list.map((j) => _EventResult.fromJson(j)).toList();
        _error = _results.isEmpty ? 'No se encontraron eventos' : null;
        _searching = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = 'Sin conexión al servidor'; _searching = false; });
    }
  }

  void _goToEvent(int id) {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context2, anim, sec) => VoteScreen(eventId: id),
        transitionsBuilder: (context2, anim, sec, child) => SlideTransition(
          position: Tween(begin: const Offset(1, 0), end: Offset.zero)
              .animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)),
          child: child,
        ),
        transitionDuration: const Duration(milliseconds: 320),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgColor,
      body: Stack(
        children: [
          const _BackgroundOrbs(),
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: Column(
                children: [
                  // ── Línea gradiente superior ──────────────────────────────
                  Container(
                    height: 2,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF7C3AED), Color(0xFFEC4899), Color(0xFF06B6D4)],
                      ),
                    ),
                  ),
                  // ── Header ────────────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                    child: Column(children: [
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        _Logo(),
                        const SizedBox(width: 12),
                        ShaderMask(
                          shaderCallback: (b) => const LinearGradient(
                            colors: [Colors.white, Color(0xFFa78bfa)],
                          ).createShader(b),
                          child: const Text('EC Music',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.8)),
                        ),
                      ]),
                      const SizedBox(height: 6),
                      const Text('Elegí tu evento y empezá a votar',
                          style: TextStyle(color: kTextMuted, fontSize: 13)),
                      const SizedBox(height: 20),
                      // Buscador
                      _SearchField(
                        controller: _controller,
                        focusNode: _focusNode,
                        searching: _searching,
                        onChanged: _onChanged,
                        onClear: () {
                          _controller.clear();
                          _loadAll();
                        },
                      ),
                    ]),
                  ),

                  const SizedBox(height: 16),

                  // ── Lista de eventos ──────────────────────────────────────
                  Expanded(
                    child: _loading
                        ? const Center(
                            child: CircularProgressIndicator(color: kPrimary, strokeWidth: 2))
                        : _error != null && _results.isEmpty
                            ? _EmptyState(error: _error)
                            : RefreshIndicator(
                                onRefresh: _loadAll,
                                color: kPrimary,
                                backgroundColor: kCardColor,
                                child: ListView.builder(
                                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                                  itemCount: _results.length + (_controller.text.isEmpty ? 1 : 0),
                                  itemBuilder: (_, i) {
                                    // Encabezado de sección
                                    if (_controller.text.isEmpty && i == 0) {
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 12),
                                        child: Row(children: [
                                          _PulseDot(color: kSuccess),
                                          const SizedBox(width: 6),
                                          Text(
                                            '${_results.length} evento${_results.length == 1 ? '' : 's'} disponible${_results.length == 1 ? '' : 's'}',
                                            style: const TextStyle(
                                                color: kTextMuted,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                letterSpacing: 0.3),
                                          ),
                                        ]),
                                      );
                                    }
                                    final idx = _controller.text.isEmpty ? i - 1 : i;
                                    final event = _results[idx];
                                    return TweenAnimationBuilder<double>(
                                      tween: Tween(begin: 0, end: 1),
                                      duration: Duration(milliseconds: 200 + idx * 50),
                                      curve: Curves.easeOut,
                                      builder: (_, v, child) => Opacity(
                                        opacity: v,
                                        child: Transform.translate(
                                            offset: Offset(0, 12 * (1 - v)),
                                            child: child),
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.only(bottom: 10),
                                        child: _EventCard(
                                          event: event,
                                          onTap: () => _goToEvent(event.id),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Logo animado ──────────────────────────────────────────────────────────────
class _Logo extends StatefulWidget {
  @override
  State<_Logo> createState() => _LogoState();
}
class _LogoState extends State<_Logo> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000))
      ..repeat(reverse: true);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _ctrl,
    builder: (_, child) => Transform.scale(
        scale: 0.9 + 0.1 * _ctrl.value, child: child),
    child: Container(
      width: 36, height: 36,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: kPrimary.withValues(alpha: 0.4), blurRadius: 14)],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.asset('assets/images/logo.png', fit: BoxFit.cover),
      ),
    ),
  );
}

// ── Orbs de fondo ─────────────────────────────────────────────────────────────
class _BackgroundOrbs extends StatelessWidget {
  const _BackgroundOrbs();
  @override
  Widget build(BuildContext context) => Stack(children: [
    Positioned(top: -80, right: -60,
        child: _Orb(size: 300, color: kPrimary.withValues(alpha: 0.14))),
    Positioned(bottom: 40, left: -80,
        child: _Orb(size: 260, color: kSecondary.withValues(alpha: 0.10))),
    Positioned(top: 200, left: -100,
        child: _Orb(size: 180, color: kPrimary.withValues(alpha: 0.06))),
  ]);
}
class _Orb extends StatelessWidget {
  final double size;
  final Color color;
  const _Orb({required this.size, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(shape: BoxShape.circle, color: color,
        boxShadow: [BoxShadow(color: color, blurRadius: size * 0.6)]),
  );
}

// ── Search field ──────────────────────────────────────────────────────────────
class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool searching;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  const _SearchField({
    required this.controller, required this.focusNode,
    required this.searching, required this.onChanged, required this.onClear,
  });

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    focusNode: focusNode,
    onChanged: onChanged,
    style: const TextStyle(color: Colors.white, fontSize: 15),
    decoration: InputDecoration(
      hintText: 'Buscar por nombre o lugar...',
      hintStyle: const TextStyle(color: kTextMuted, fontSize: 15),
      prefixIcon: const Padding(
        padding: EdgeInsets.only(left: 14, right: 10),
        child: Icon(Icons.search_rounded, color: kPrimary, size: 20),
      ),
      prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
      suffixIcon: searching
          ? const Padding(padding: EdgeInsets.all(14),
              child: SizedBox(width: 18, height: 18,
                  child: CircularProgressIndicator(color: kPrimary, strokeWidth: 2)))
          : controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.close_rounded, color: kTextMuted, size: 18),
                  onPressed: onClear)
              : null,
      filled: true,
      fillColor: const Color(0xFF0D1117),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: kBorderColor)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: kBorderColor)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: kPrimary, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final String? error;
  const _EmptyState({this.error});
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(
          error?.contains('conexión') == true
              ? Icons.wifi_off_rounded
              : Icons.search_off_rounded,
          color: kTextMuted.withValues(alpha: 0.3),
          size: 52,
        ),
        const SizedBox(height: 14),
        Text(error ?? 'Sin resultados',
            textAlign: TextAlign.center,
            style: const TextStyle(color: kTextMuted, fontSize: 14)),
      ]),
    ),
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
class _EventCard extends StatefulWidget {
  final _EventResult event;
  final VoidCallback onTap;
  const _EventCard({required this.event, required this.onTap});
  @override
  State<_EventCard> createState() => _EventCardState();
}
class _EventCardState extends State<_EventCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 100),
        lowerBound: 0.96, upperBound: 1.0, value: 1.0);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final isLive     = widget.event.status == 'ACTIVE';
    final isFinished = widget.event.status == 'FINISHED';
    final statusColor = isLive ? kSuccess : isFinished ? kTextMuted : kWarning;
    final statusLabel = isLive ? 'EN VIVO' : isFinished ? 'CERRADO' : 'PRÓXIMO';

    return GestureDetector(
      onTapDown: (_) => _ctrl.reverse(),
      onTapUp: (_) { _ctrl.forward(); widget.onTap(); },
      onTapCancel: () => _ctrl.forward(),
      child: AnimatedBuilder(
        animation: _ctrl,
        builder: (_, child) => Transform.scale(scale: _ctrl.value, child: child),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0A0D14),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isLive
                  ? kSuccess.withValues(alpha: 0.28)
                  : kBorderColor.withValues(alpha: 0.6),
            ),
            boxShadow: isLive
                ? [BoxShadow(color: kSuccess.withValues(alpha: 0.08), blurRadius: 20)]
                : [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 10)],
          ),
          child: Row(children: [
            // Ícono
            Container(
              width: 50, height: 50,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  kPrimary.withValues(alpha: 0.18),
                  kSecondary.withValues(alpha: 0.10),
                ]),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.queue_music_rounded, color: kPrimary, size: 26),
            ),
            const SizedBox(width: 14),
            // Info
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(widget.event.name,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Row(children: [
                  const Icon(Icons.location_on_outlined, color: kTextMuted, size: 12),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(widget.event.venue,
                        style: const TextStyle(color: kTextMuted, fontSize: 12),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ]),
                // Nombre del DJ
                if (widget.event.djName != null && widget.event.djName!.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Row(children: [
                    const Icon(Icons.headphones_rounded, color: kTextMuted, size: 11),
                    const SizedBox(width: 3),
                    Text('DJ ${widget.event.djName}',
                        style: TextStyle(
                            color: kPrimary.withValues(alpha: 0.8),
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                  ]),
                ],
              ]),
            ),
            const SizedBox(width: 10),
            // Badge estado
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: statusColor.withValues(alpha: 0.35)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  if (!isFinished) ...[
                    _PulseDot(color: statusColor),
                    const SizedBox(width: 4),
                  ],
                  Text(statusLabel,
                      style: TextStyle(
                          color: statusColor,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3)),
                ]),
              ),
              const SizedBox(height: 6),
              const Icon(Icons.arrow_forward_ios_rounded, color: kTextMuted, size: 12),
            ]),
          ]),
        ),
      ),
    );
  }
}

class _PulseDot extends StatefulWidget {
  final Color color;
  const _PulseDot({required this.color});
  @override
  State<_PulseDot> createState() => _PulseDotState();
}
class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _ctrl,
    builder: (_, _) => Container(
      width: 5, height: 5,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: widget.color.withValues(alpha: 0.3 + 0.7 * _ctrl.value),
      ),
    ),
  );
}
