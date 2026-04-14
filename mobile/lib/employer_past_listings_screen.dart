// Employer Past Listings Screen
// displays employer's previous job listings

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class EmployerPastListingsScreen extends StatefulWidget {
  const EmployerPastListingsScreen({super.key});

  @override
  State<EmployerPastListingsScreen> createState() =>
      _EmployerPastListingsScreenState();
}

class _EmployerPastListingsScreenState
    extends State<EmployerPastListingsScreen> {

  // scaffold key for drawer
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // past job listings
  List<dynamic> pastJobs = [];

  // loading state
  bool loading = true;

  @override
  void initState() {
    super.initState();

    // fetch past listings on load
    fetchPastListings();
  }

  // logout user
  Future<void> handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove("user");
    await prefs.remove("token");

    if (!mounted) return;
    Navigator.pushReplacementNamed(context, "/login");
  }

  // fetch past job listings from backend
  Future<void> fetchPastListings() async {
    if (mounted) {
      setState(() {
        loading = true;
      });
    }

    try {
      final res = await authGet("/api/jobs/myListings");

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;

        // extract past jobs
        final past = List<dynamic>.from(data['past'] ?? []);

        if (!mounted) return;
        setState(() {
          pastJobs = past;
        });
      } else {
        debugPrint("Failed to fetch past listings: ${res.statusCode}");
      }
    } catch (e) {
      debugPrint("Error fetching past listings: $e");
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  // formats date to only show YYYY-MM-DD
  String _dateOnly(String? value) {
    if (value == null || value.isEmpty) return "";
    return value.contains("T") ? value.split("T")[0] : value;
  }

  // reusable card container
  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.88),
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }

  // section title
  Widget _sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: Color(0xFF333333),
        ),
      ),
    );
  }

  // builds each past job card
  Widget _buildPastJobCard(Map<String, dynamic> job) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.black12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // job title
          Text(
            job['title']?.toString() ?? "Untitled Job",
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 6),

          // company
          Text("Company: ${job['company'] ?? '—'}"),

          // description
          if ((job['description'] ?? "").toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(job['description'].toString()),
            ),

          // pay rate
          if ((job['payRate'] ?? "").toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text("Pay Rate: ${job['payRate']}"),
            ),

          // start date
          if ((job['startDate'] ?? "").toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                "Start Date: ${_dateOnly(job['startDate']?.toString())}",
              ),
            ),

          // hired applicant
          if ((job['hiredApplicant']) != null) ...[
            const SizedBox(height: 8),
            Text(
              "Hired: ${job['hiredApplicant']['firstname'] ?? ''} ${job['hiredApplicant']['lastname'] ?? ''}",
              style: const TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],

          // closed date
          if ((job['closedAt'] ?? "").toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                "Closed: ${_dateOnly(job['closedAt']?.toString())}",
                style: const TextStyle(color: Colors.black54),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      extendBodyBehindAppBar: true,

      // app bar
      appBar: AppBar(
        title: const Text("Ascent"),
        backgroundColor: const Color.fromRGBO(50, 30, 90, 0.85),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              _scaffoldKey.currentState?.openEndDrawer();
            },
          ),
        ],
      ),

      // drawer
      endDrawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [

              // header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                color: const Color.fromRGBO(50, 30, 90, 0.85),
                child: const Text(
                  "Ascent",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              // logout option
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text("Logout"),
                onTap: () async {
                  Navigator.pop(context);
                  await handleLogout();
                },
              ),
            ],
          ),
        ),
      ),

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
            child: SizedBox.expand(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [

                    // page title
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        "Past Listings",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // main content card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionTitle("Past Listings"),

                          // loading state
                          if (loading)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.symmetric(vertical: 24),
                                child: CircularProgressIndicator(),
                              ),
                            )

                          // empty state
                          else if (pastJobs.isEmpty)
                            const Text(
                              "No past job listings yet.",
                              style: TextStyle(color: Colors.grey),
                            )

                          // listings
                          else
                            ...pastJobs.map(
                              (job) => _buildPastJobCard(
                                Map<String, dynamic>.from(job as Map),
                              ),
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),

      // bottom navigation
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 2,
        onTap: (index) {
          if (index == 0) {
            Navigator.pushReplacementNamed(context, "/employerProfile");
          } else if (index == 1) {
            Navigator.pushReplacementNamed(context, "/employerListings");
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home"),
          BottomNavigationBarItem(icon: Icon(Icons.work), label: "My Listings"),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: "Past Listings"),
        ],
      ),
    );
  }
}