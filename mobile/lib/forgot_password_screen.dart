// Forgot Password Screen
// allows user to request a password reset email

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {

  // user email input
  String email = "";

  // shows error if email is empty
  bool emailError = false;

  // clears error when user types
  void clearError() {
    setState(() => emailError = false);
  }

  // sends reset request to backend
  Future<void> sendResetLink() async {

    // validate email
    if (email.trim().isEmpty) {
      setState(() => emailError = true);
      return;
    }

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/api/users/forgot-password"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email}),
      );

      final data = jsonDecode(response.body);

      if (!mounted) return;

      // success message
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Check your email for reset link"),
          ),
        );
      } 
      // error message
      else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data["message"])),
        );
      }

    } catch (e) {
      if (!mounted) return;

      // fallback error
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Something went wrong"),
        ),
      );
    }
  }

  // input styling
  InputDecoration inputDecoration(bool hasError) {
    return InputDecoration(
      hintText: "Email",
      filled: true,
      fillColor: hasError ? const Color(0xFFFFF5F5) : Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: hasError ? Colors.red : Colors.grey,
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

                    const SizedBox(height: 48),

                    // main card
                    Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 48, horizontal: 32),
                      margin:
                          const EdgeInsets.symmetric(horizontal: 32),
                      decoration: BoxDecoration(
                        color: Colors.grey[300]!.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [

                          // instructions
                          const Text(
                            "Enter email to reset password",
                            style: TextStyle(
                                fontSize: 14, letterSpacing: 2),
                          ),

                          const SizedBox(height: 16),

                          // email input
                          SizedBox(
                            width: 250,
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                TextField(
                                  decoration:
                                      inputDecoration(emailError),
                                  onChanged: (val) {
                                    setState(() => email = val);
                                    clearError();
                                  },
                                ),

                                // error text
                                if (emailError)
                                  const Padding(
                                    padding: EdgeInsets.only(
                                        top: 6, left: 4),
                                    child: Text(
                                      "Email is required",
                                      style: TextStyle(
                                          color: Colors.red,
                                          fontSize: 12),
                                    ),
                                  ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // send reset link button
                          SizedBox(
                            width: 250,
                            child: ElevatedButton(
                              onPressed: sendResetLink,
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromRGBO(
                                        50, 30, 90, 0.6),
                              ),
                              child: const Text(
                                "Send Reset Link",
                                style: TextStyle(color: Colors.black),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // back to login button
                          SizedBox(
                            width: 250,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.pop(context);
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromRGBO(
                                        50, 30, 90, 0.6),
                              ),
                              child: const Text(
                                "Back to Login",
                                style: TextStyle(color: Colors.black),
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