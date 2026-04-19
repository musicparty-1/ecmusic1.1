import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../config.dart';
import 'entry_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoCtrl;
  late AnimationController _orbCtrl;
  late AnimationController _textCtrl;
  late AnimationController _btnCtrl;
  late AnimationController _pulseCtrl;

  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _textOpacity;
  late Animation<double> _textSlide;
  late Animation<double> _btnOpacity;
  late Animation<double> _btnSlide;
  late Animation<double> _pulse;

  bool _showOnboarding = false;
  int _onboardingStep = 0;

  final _onboardingItems = [
    _OnboardingItem(
      emoji: '🗳️',
      title: 'Vos elegís la música',
      subtitle: 'Votá las canciones que querés escuchar en la fiesta. Tu gusto manda.',
    ),
    _OnboardingItem(
      emoji: '🔥',
      title: 'Influí en el DJ',
      subtitle: 'Las canciones con más votos suben al tope del ranking en tiempo real.',
    ),
    _OnboardingItem(
      emoji: '🎉',
      title: 'Viví la fiesta distinto',
      subtitle: 'Escaneá el QR, entrá al evento y empezá a votar. Sin registro.',
    ),
  ];

  @override
  void initState() {
    super.initState();

    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _orbCtrl  = AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat();
    _textCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _btnCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))..repeat(reverse: true);

    _logoScale   = Tween(begin: 0.4, end: 1.0).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
    _logoOpacity = Tween(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _logoCtrl, curve: const Interval(0, 0.5, curve: Curves.easeOut)));
    _textOpacity = Tween(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));
    _textSlide   = Tween(begin: 24.0, end: 0.0).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));
    _btnOpacity  = Tween(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _btnCtrl, curve: Curves.easeOut));
    _btnSlide    = Tween(begin: 20.0, end: 0.0).animate(CurvedAnimation(parent: _btnCtrl, curve: Curves.easeOut));
    _pulse       = Tween(begin: 0.9, end: 1.05).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));

    // Staggered entrance
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _logoCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) _textCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        _btnCtrl.forward();
        setState(() => _showOnboarding = true);
      }
    });
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _orbCtrl.dispose();
    _textCtrl.dispose();
    _btnCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  void _goToEvents() {
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (ctx, anim, sec) => const EntryScreen(),
        transitionsBuilder: (ctx, anim, sec, child) => FadeTransition(
          opacity: anim,
          child: child,
        ),
        transitionDuration: const Duration(milliseconds: 400),
      ),
    );
  }

  void _nextOnboarding() {
    if (_onboardingStep < _onboardingItems.length - 1) {
      setState(() => _onboardingStep++);
    } else {
      _goToEvents();
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: kBgColor,
      body: Stack(
        children: [
          // ── Orbs animados ──────────────────────────────────────────────
          AnimatedBuilder(
            animation: _orbCtrl,
            builder: (_, __) {
              final t = _orbCtrl.value * 2 * math.pi;
              return Stack(children: [
                Positioned(
                  top: size.height * 0.05 + 40 * math.sin(t * 0.7),
                  right: -60 + 20 * math.cos(t * 0.5),
                  child: _GlowOrb(size: 300, color: kPrimary.withValues(alpha: 0.14)),
                ),
                Positioned(
                  bottom: size.height * 0.12 + 30 * math.cos(t * 0.6),
                  left: -80 + 25 * math.sin(t * 0.4),
                  child: _GlowOrb(size: 240, color: kSecondary.withValues(alpha: 0.10)),
                ),
                Positioned(
                  top: size.height * 0.4 + 20 * math.sin(t * 0.9),
                  left: size.width * 0.3,
                  child: _GlowOrb(size: 160, color: const Color(0xFFEC4899).withValues(alpha: 0.07)),
                ),
              ]);
            },
          ),

          // ── Contenido principal ────────────────────────────────────────
          SafeArea(
            child: Column(
              children: [
                // Top section: logo + texto
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo
                      AnimatedBuilder(
                        animation: _logoCtrl,
                        builder: (_, child) => Opacity(
                          opacity: _logoOpacity.value,
                          child: Transform.scale(scale: _logoScale.value, child: child),
                        ),
                        child: _AnimatedLogo(pulse: _pulse),
                      ),

                      const SizedBox(height: 28),

                      // Título app
                      AnimatedBuilder(
                        animation: _textCtrl,
                        builder: (_, child) => Opacity(
                          opacity: _textOpacity.value,
                          child: Transform.translate(
                            offset: Offset(0, _textSlide.value),
                            child: child,
                          ),
                        ),
                        child: Column(children: [
                          ShaderMask(
                            shaderCallback: (b) => const LinearGradient(
                              colors: [Colors.white, Color(0xFFa78bfa), Color(0xFFEC4899)],
                              begin: Alignment.topLeft, end: Alignment.bottomRight,
                            ).createShader(b),
                            child: const Text(
                              'MusicParty',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 42,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 40),
                            child: Text(
                              'Vos elegís la música de la fiesta',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: kTextMuted,
                                fontSize: 16,
                                height: 1.5,
                                letterSpacing: 0.1,
                              ),
                            ),
                          ),
                        ]),
                      ),
                    ],
                  ),
                ),

                // ── Onboarding cards ──────────────────────────────────
                if (_showOnboarding) ...[
                  AnimatedBuilder(
                    animation: _btnCtrl,
                    builder: (_, child) => Opacity(
                      opacity: _btnOpacity.value,
                      child: Transform.translate(
                        offset: Offset(0, _btnSlide.value),
                        child: child,
                      ),
                    ),
                    child: _OnboardingSection(
                      items: _onboardingItems,
                      currentStep: _onboardingStep,
                      onNext: _nextOnboarding,
                      isLast: _onboardingStep == _onboardingItems.length - 1,
                    ),
                  ),
                ],

                const SizedBox(height: 20),

                // ── Botón principal ──────────────────────────────────
                AnimatedBuilder(
                  animation: _btnCtrl,
                  builder: (_, child) => Opacity(
                    opacity: _btnOpacity.value,
                    child: Transform.translate(
                      offset: Offset(0, _btnSlide.value),
                      child: child,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
                    child: _EnterButton(onTap: _goToEvents),
                  ),
                ),

                const SizedBox(height: 12),

                // Skip / powered by
                AnimatedBuilder(
                  animation: _btnCtrl,
                  builder: (_, child) => Opacity(opacity: _btnOpacity.value, child: child),
                  child: const Padding(
                    padding: EdgeInsets.only(bottom: 24),
                    child: Text(
                      'Sin registro · Gratis · En vivo',
                      style: TextStyle(color: kTextMuted, fontSize: 11, letterSpacing: 0.3),
                    ),
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

// ── Logo animado con pulse ────────────────────────────────────────────────────
class _AnimatedLogo extends StatelessWidget {
  final Animation<double> pulse;
  const _AnimatedLogo({required this.pulse});

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: pulse,
    builder: (_, child) => Transform.scale(scale: pulse.value, child: child),
    child: Container(
      width: 96, height: 96,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [Color(0xFF6D28D9), kPrimary, kSecondary],
        ),
        boxShadow: [
          BoxShadow(color: kPrimary.withValues(alpha: 0.55), blurRadius: 40, offset: const Offset(0, 12)),
          BoxShadow(color: kSecondary.withValues(alpha: 0.25), blurRadius: 60, spreadRadius: -10),
        ],
      ),
      child: Stack(alignment: Alignment.center, children: [
        // Shine
        Positioned(
          top: 12, left: 16, right: 16,
          child: Container(
            height: 1.5,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(99),
              gradient: LinearGradient(colors: [
                Colors.white.withValues(alpha: 0), Colors.white.withValues(alpha: 0.4),
                Colors.white.withValues(alpha: 0),
              ]),
            ),
          ),
        ),
        const Icon(Icons.music_note_rounded, color: Colors.white, size: 48),
      ]),
    ),
  );
}

// ── Orb de fondo con glow ─────────────────────────────────────────────────────
class _GlowOrb extends StatelessWidget {
  final double size;
  final Color color;
  const _GlowOrb({required this.size, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle, color: color,
      boxShadow: [BoxShadow(color: color, blurRadius: size * 0.7, spreadRadius: size * 0.05)],
    ),
  );
}

// ── Onboarding Section ────────────────────────────────────────────────────────
class _OnboardingItem {
  final String emoji;
  final String title;
  final String subtitle;
  const _OnboardingItem({required this.emoji, required this.title, required this.subtitle});
}

class _OnboardingSection extends StatefulWidget {
  final List<_OnboardingItem> items;
  final int currentStep;
  final VoidCallback onNext;
  final bool isLast;
  const _OnboardingSection({
    required this.items, required this.currentStep,
    required this.onNext, required this.isLast,
  });

  @override
  State<_OnboardingSection> createState() => _OnboardingSectionState();
}

class _OnboardingSectionState extends State<_OnboardingSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _slideCtrl;
  late Animation<double> _slideAnim;

  @override
  void initState() {
    super.initState();
    _slideCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 350));
    _slideAnim = CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOut);
    _slideCtrl.forward();
  }

  @override
  void didUpdateWidget(_OnboardingSection old) {
    super.didUpdateWidget(old);
    if (old.currentStep != widget.currentStep) {
      _slideCtrl.forward(from: 0);
    }
  }

  @override
  void dispose() { _slideCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final item = widget.items[widget.currentStep];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(children: [
        // Card
        AnimatedBuilder(
          animation: _slideAnim,
          builder: (_, child) => Opacity(
            opacity: _slideAnim.value,
            child: Transform.translate(
              offset: Offset(20 * (1 - _slideAnim.value), 0),
              child: child,
            ),
          ),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0A0D14),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kBorderColor.withValues(alpha: 0.6)),
              boxShadow: [BoxShadow(color: kPrimary.withValues(alpha: 0.08), blurRadius: 24)],
            ),
            child: Row(children: [
              Text(item.emoji, style: const TextStyle(fontSize: 32)),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(item.title,
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(item.subtitle,
                    style: const TextStyle(color: kTextMuted, fontSize: 12, height: 1.5)),
              ])),
            ]),
          ),
        ),

        const SizedBox(height: 16),

        // Dots progress
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.items.length, (i) => AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: i == widget.currentStep ? 20 : 6,
            height: 6,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(99),
              color: i == widget.currentStep ? kPrimary : kBorderColor,
            ),
          )),
        ),
      ]),
    );
  }
}

// ── Botón principal "Entrar / Ver eventos" ────────────────────────────────────
class _EnterButton extends StatefulWidget {
  final VoidCallback onTap;
  const _EnterButton({required this.onTap});

  @override
  State<_EnterButton> createState() => _EnterButtonState();
}

class _EnterButtonState extends State<_EnterButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 110),
        lowerBound: 0.96, upperBound: 1.0, value: 1.0);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: (_) => _ctrl.reverse(),
    onTapUp: (_) { _ctrl.forward(); widget.onTap(); },
    onTapCancel: () => _ctrl.forward(),
    child: AnimatedBuilder(
      animation: _ctrl,
      builder: (_, child) => Transform.scale(scale: _ctrl.value, child: child),
      child: Container(
        width: double.infinity,
        height: 60,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: const LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFF6D28D9), kPrimary, kSecondary],
          ),
          boxShadow: [
            BoxShadow(color: kPrimary.withValues(alpha: 0.5), blurRadius: 28, offset: const Offset(0, 8)),
          ],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.celebration_rounded, color: Colors.white, size: 22),
            SizedBox(width: 10),
            Text(
              'Entrar · Ver eventos',
              style: TextStyle(
                color: Colors.white, fontSize: 17,
                fontWeight: FontWeight.w800, letterSpacing: -0.3,
              ),
            ),
            SizedBox(width: 8),
            Icon(Icons.arrow_forward_rounded, color: Colors.white70, size: 18),
          ],
        ),
      ),
    ),
  );
}
