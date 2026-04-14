import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// base API URL for backend requests
const String baseUrl = "https://miniapp4331.com"; // http://10.0.2.2:5000

// authenticated GET request
Future<http.Response> authGet(String path) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString("token") ?? "";

  return http.get(
    Uri.parse("$baseUrl$path"),
    headers: {"Authorization": token},
  );
}

// authenticated POST request with JSON body
Future<http.Response> authPost(String path, Map<String, dynamic> body) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString("token") ?? "";

  return http.post(
    Uri.parse("$baseUrl$path"),
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: jsonEncode(body),
  );
}

// authenticated PUT request with JSON body
Future<http.Response> authPut(String path, Map<String, dynamic> body) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString("token") ?? "";

  return http.put(
    Uri.parse("$baseUrl$path"),
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: jsonEncode(body),
  );
}

// authenticated DELETE request
Future<http.Response> authDelete(String path) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString("token") ?? "";

  return http.delete(
    Uri.parse("$baseUrl$path"),
    headers: {"Authorization": token},
  );
}