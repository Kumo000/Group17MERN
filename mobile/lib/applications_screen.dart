// Applications Screen
// displays all jobs the applicant has applied to

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class ApplicationsScreen extends StatefulWidget {
  const ApplicationsScreen({super.key});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> {

  // scaffold key for drawer
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // applications list
  List<dynamic> applications = [];

  // loading state
  bool loading = true;

  @override
  void initState() {
    super.initState();

    // load applications on screen start
    loadApplications();
  }

  // fetch applications from backend
  Future<void> loadApplications() async {
    try {
      final res = await authGet("/api/users/jobs/my-applications");

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body) as List<dynamic>;

        if (!mounted) return;
        setState(() {
          applications = decoded;
        });
      } else {
        if (!mounted) return;

        // error fetching applications
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Error fetching applications")),
        );
      }
    } catch (e) {
      debugPrint("Error fetching applications: $e");

      if (!mounted) return;

      // fallback error
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Error fetching applications")),
      );
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  // logout user
  Future<void> handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove("user");
    await prefs.remove("token");

    if (!mounted) return;
    Navigator.pushReplacementNamed(context, "/login");
  }

  // status color helper
  Color _statusColor(String? status) {
    switch (status) {
      case "interview requested":
        return Colors.purple;
      case "interview pending":
        return Colors.deepOrange;
      case "under review":
        return Colors.blue;
      case "hired":
        return Colors.green;
      case "rejected":
        return Colors.red;
      default:
        return Colors.black54;
    }
  }

  // status label helper
  String _statusLabel(String? status) {
    switch (status) {
      case "interview requested":
        return "Interview Requested";
      case "interview pending":
        return "Interview Pending";
      case "under review":
        return "Under Review";
      case "hired":
        return "Hired";
      case "rejected":
        return "Not Selected";
      default:
        return "Pending";
    }
  }

  // format date to YYYY-MM-DD
  String _formatDate(dynamic date) {
    if (date == null || date.toString().isEmpty) return "—";
    try {
      return DateTime.parse(date.toString())
          .toLocal()
          .toString()
          .split(' ')[0];
    } catch (_) {
      return date.toString();
    }
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
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // page title
                    const Text(
                      "My Applications",
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 16),

                    Expanded(
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [

                            // section title
                            const Text(
                              "Results",
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),

                            const SizedBox(height: 12),

                            // loading state
                            if (loading)
                              const Expanded(
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              )

                            // empty state
                            else if (applications.isEmpty)
                              const Expanded(
                                child: Center(
                                  child: Text(
                                    "No applications yet.",
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                ),
                              )

                            // applications list
                            else
                              Expanded(
                                child: ListView.separated(
                                  itemCount: applications.length,
                                  separatorBuilder: (_, __) =>
                                      const SizedBox(height: 12),
                                  itemBuilder: (context, index) {

                                    final app = Map<String, dynamic>.from(
                                      applications[index] as Map,
                                    );

                                    return _buildApplicationCard(app);
                                  },
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
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
            Navigator.pushReplacementNamed(context, "/applicantProfile");
          } else if (index == 1) {
            Navigator.pushReplacementNamed(context, "/jobs");
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home"),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: "Search"),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: "Applications"),
        ],
      ),
    );
  }

  // builds each application card
  Widget _buildApplicationCard(Map<String, dynamic> app) {
    final status = app['status']?.toString();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(10),
        color: Colors.white.withOpacity(0.9),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // job title
          _fieldLabel("Job Title"),
          Text(
            app['title']?.toString() ?? "",
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 17,
            ),
          ),

          const SizedBox(height: 8),

          // company
          _fieldLabel("Company Name"),
          Text(
            app['company']?.toString() ?? "",
            style: const TextStyle(
              fontSize: 15,
              color: Colors.black87,
            ),
          ),

          const SizedBox(height: 8),

          // applied date
          _fieldLabel("Date Applied"),
          Text(
            _formatDate(app['appliedAt']),
            style: const TextStyle(color: Colors.black54),
          ),

          const SizedBox(height: 8),

          // application status
          _fieldLabel("Status"),
          Text(
            _statusLabel(status),
            style: TextStyle(
              color: _statusColor(status),
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  // small label for fields
  Widget _fieldLabel(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            color: Colors.grey,
            letterSpacing: 1,
          ),
        ),
      );
}