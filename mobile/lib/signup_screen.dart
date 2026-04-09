// Signup Screen
// handles user registration and account creation

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {

  // user input fields
  String firstname = "";
  String lastname = "";
  String email = "";
  String phone = "";
  String password = "";
  String role = "";

  // register request to backend
  Future<void> handleRegister() async {

    // validate inputs
    if (firstname.trim().isEmpty ||
        lastname.trim().isEmpty ||
        email.trim().isEmpty ||
        phone.trim().isEmpty ||
        password.trim().isEmpty ||
        role.trim().isEmpty) {

      if (!mounted) return;

      // show error if fields missing
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill out all fields.")),
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/api/users/register"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "firstname": firstname.trim(),
          "lastname": lastname.trim(),
          "email": email.trim(),
          "phone": phone.trim(),
          "password": password,
          "role": role,
        }),
      );

      final data = jsonDecode(response.body);

      if (!mounted) return;

      // success
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? "Registration successful")),
        );

        // go back to login
        Navigator.pushReplacementNamed(context, "/login");
      } 
      // failure
      else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "Registration failed: ${data['message'] ?? 'Unknown error'}",
            ),
          ),
        );
      }

    } catch (error) {
      if (!mounted) return;

      // fallback error
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("An error occurred. Please try again later."),
        ),
      );
    }
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
                      "Create your account",
                      style: TextStyle(
                        fontSize: 13,
                        letterSpacing: 3,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // main card
                    Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 40,
                        horizontal: 32,
                      ),
                      margin: const EdgeInsets.symmetric(horizontal: 32),
                      decoration: BoxDecoration(
                        color: Colors.grey[300]!.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [

                          // first name input
                          _buildTextField(
                            hint: "First Name",
                            onChanged: (val) => setState(() => firstname = val),
                          ),

                          const SizedBox(height: 16),

                          // last name input
                          _buildTextField(
                            hint: "Last Name",
                            onChanged: (val) => setState(() => lastname = val),
                          ),

                          const SizedBox(height: 16),

                          // email input
                          _buildTextField(
                            hint: "Email",
                            keyboardType: TextInputType.emailAddress,
                            onChanged: (val) => setState(() => email = val),
                          ),

                          const SizedBox(height: 16),

                          // phone input
                          _buildTextField(
                            hint: "Phone",
                            keyboardType: TextInputType.phone,
                            onChanged: (val) => setState(() => phone = val),
                          ),

                          const SizedBox(height: 16),

                          // password input
                          _buildTextField(
                            hint: "Password",
                            obscureText: true,
                            onChanged: (val) => setState(() => password = val),
                          ),

                          const SizedBox(height: 16),

                          // role dropdown
                          SizedBox(
                            width: 250,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: role.isEmpty ? null : role,
                                  hint: const Text("Select role"),
                                  isExpanded: true,
                                  items: const [
                                    DropdownMenuItem(
                                      value: "Applicant",
                                      child: Text("Applicant"),
                                    ),
                                    DropdownMenuItem(
                                      value: "Employer",
                                      child: Text("Employer"),
                                    ),
                                  ],
                                  onChanged: (val) =>
                                      setState(() => role = val ?? ""),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // signup button
                          SizedBox(
                            width: 250,
                            child: ElevatedButton(
                              onPressed: handleRegister,
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
                                "Signup",
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // footer text
                          const Text(
                            "It's time to climb",
                            style: TextStyle(fontSize: 11, letterSpacing: 2),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // reusable text field widget
  Widget _buildTextField({
    required String hint,
    required Function(String) onChanged,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return SizedBox(
      width: 250,
      child: TextField(
        obscureText: obscureText,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          hintText: hint,
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Colors.grey),
          ),
        ),
        onChanged: onChanged,
      ),
    );
  }
}