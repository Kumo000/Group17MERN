import 'package:flutter/material.dart';
import 'login_screen.dart';
import 'signup_screen.dart';
import 'applicant_profile_screen.dart';
import 'employer_profile_screen.dart';
import 'job_search_screen.dart';
import 'applications_screen.dart';
import 'employer_listings_screen.dart';
import 'employer_past_listings_screen.dart';
import 'forgot_password_screen.dart';

void main() {
  runApp(const AscentApp());
}

class AscentApp extends StatelessWidget {
  const AscentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ascent',
      debugShowCheckedModeBanner: false,
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/signup': (context) => const SignupScreen(),
        '/applicantProfile': (context) => const ApplicantProfileScreen(),
        '/employerProfile': (context) => const EmployerProfileScreen(),
        '/jobs': (context) => const JobSearchScreen(),
        '/applications': (context) => const ApplicationsScreen(),
        '/employerPastListings': (context) => const EmployerPastListingsScreen(),
        '/employerListings': (context) => const EmployerListingsScreen(),
        '/forgotPassword': (context) => const ForgotPasswordScreen(),
      },
    );
  }
}