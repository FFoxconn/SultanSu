import 'package:flutter/material.dart';

import 'screens/assignment_screen.dart';
import 'screens/login_screen.dart';
import 'state/auth_scope.dart';
import 'state/auth_state.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const SultanSuApp());
}

class SultanSuApp extends StatefulWidget {
  const SultanSuApp({super.key});

  @override
  State<SultanSuApp> createState() => _SultanSuAppState();
}

class _SultanSuAppState extends State<SultanSuApp> {
  final _authState = AuthState();

  @override
  void initState() {
    super.initState();
    _authState.bootstrap();
  }

  @override
  void dispose() {
    _authState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      authState: _authState,
      child: MaterialApp(
        title: 'SultanSu Kurye',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: AnimatedBuilder(
          animation: _authState,
          builder: (context, _) {
            if (_authState.loading) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator(color: AppColors.accent)),
              );
            }
            return _authState.user != null ? const AssignmentScreen() : const LoginScreen();
          },
        ),
      ),
    );
  }
}
