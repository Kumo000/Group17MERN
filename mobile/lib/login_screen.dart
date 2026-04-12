// Login Screen
// handles user login and navigation to profile screens

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {

  // controllers for input fields
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  // input values
  String email = "";
  String password = "";

  // error states
  bool emailError = false;
  bool passwordError = false;

  // validate inputs
  bool validate() {
    setState(() {
      emailError = email.trim().isEmpty;
      passwordError = password.trim().isEmpty;
    });

    return !emailError && !passwordError;
  }

  // clear error when user types
  void clearError(String field) {
    setState(() {
      if (field == "email") emailError = false;
      if (field == "password") passwordError = false;
    });
  }

  // login request to backend
  Future<void> handleLogin() async {
    if (!validate()) return;

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/api/users/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email, "password": password}),
      );

      final data = jsonDecode(response.body);

      // login failed
      if (response.statusCode != 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Login failed: ${data['message']}")),
        );
        return;
      }

      // store token and user locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString("token", data['token']);
      await prefs.setString("user", jsonEncode(data['user']));

      // fetch full user info
      final meRes = await http.get(
        Uri.parse("$baseUrl/api/users/me"),
        headers: {"Authorization": data['token']},
      );

      final meData = jsonDecode(meRes.body);
      await prefs.setString("user", jsonEncode(meData));

      if (!mounted) return;

      // navigate based on role
      if (meData['role'] == "Employer") {
        Navigator.pushReplacementNamed(context, "/employerProfile");
      } else {
        Navigator.pushReplacementNamed(context, "/applicantProfile");
      }

    } catch (e) {
      if (!mounted) return;

      // fallback error
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("An error occurred. Please try again later."),
        ),
      );
    }
  }

  // input styling
  InputDecoration inputDecoration(String hint, bool hasError) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: hasError ? const Color(0xFFFFF5F5) : Colors.white,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: hasError ? const Color(0xFFE53935) : Colors.grey,
          width: hasError ? 2 : 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: hasError ? const Color(0xFFE53935) : Colors.grey,
          width: hasError ? 2 : 1,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [

          // background image
          Positioned.fill(
            child: Image.asset(
              "assets/mountain.jpg",
              fit: BoxFit.cover,
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                child: Column(
                  children: [

                    const SizedBox(height: 60),

                    // app title
                    const Text(
                      "ASCENT",
                      style: TextStyle(
                        fontSize: 48,
                        letterSpacing: 18,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // subtitle
                    const Text(
                      "climb the ladder. reach your career potential.",
                      style: TextStyle(
                        fontSize: 13,
                        letterSpacing: 3,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 48),

                    // main card
                    Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 48,
                        horizontal: 32,
                      ),
                      margin: const EdgeInsets.symmetric(horizontal: 32),
                      decoration: BoxDecoration(
                        color: Colors.grey[300]!.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [

                          // email input
                          SizedBox(
                            width: 250,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                TextField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: inputDecoration("Email", emailError),
                                  onChanged: (val) {
                                    setState(() => email = val);
                                    clearError("email");
                                  },
                                ),

                                if (emailError)
                                  const Padding(
                                    padding: EdgeInsets.only(top: 6, left: 4),
                                    child: Text(
                                      "Email is required",
                                      style: TextStyle(
                                        color: Color(0xFFE53935),
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // password input
                          SizedBox(
                            width: 250,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                TextField(
                                  controller: _passwordController,
                                  obscureText: true,
                                  decoration:
                                      inputDecoration("Password", passwordError),
                                  onChanged: (val) {
                                    setState(() => password = val);
                                    clearError("password");
                                  },
                                ),

                                if (passwordError)
                                  const Padding(
                                    padding: EdgeInsets.only(top: 6, left: 4),
                                    child: Text(
                                      "Password is required",
                                      style: TextStyle(
                                        color: Color(0xFFE53935),
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // login button
                          SizedBox(
                            width: 250,
                            child: ElevatedButton(
                              onPressed: handleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromRGBO(50, 30, 90, 0.6),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text(
                                "Login",
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // signup section
                          const Text(
                            "Don't have an account?",
                            style: TextStyle(fontSize: 11, letterSpacing: 2),
                          ),

                          const SizedBox(height: 8),

                          SizedBox(
                            width: 250,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.pushNamed(context, "/signup");
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromRGBO(50, 30, 90, 0.6),
                              ),
                              child: const Text(
                                "Sign Up",
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // forgot password section
                          const Text(
                            "Forgot password?",
                            style: TextStyle(fontSize: 11, letterSpacing: 2),
                          ),

                          const SizedBox(height: 8),

                          SizedBox(
                            width: 250,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.pushNamed(context, "/forgotPassword");
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromRGBO(50, 30, 90, 0.6),
                              ),
                              child: const Text(
                                "Forgot Password",
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}