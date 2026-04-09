// Job Search Screen
// lets applicants search jobs and apply to listings

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class JobSearchScreen extends StatefulWidget {
  const JobSearchScreen({super.key});

  @override
  State<JobSearchScreen> createState() => _JobSearchScreenState();
}

class _JobSearchScreenState extends State<JobSearchScreen> {
  // scaffold key for opening drawer
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // search results
  List<dynamic> jobs = [];

  // loading state for search
  bool loading = false;

  // stores jobs user already applied to
  Set<String> appliedIds = {};

  // search input controller
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();

    // load previously applied jobs
    loadAppliedIds();
  }

  // clears local user data and returns to login
  Future<void> handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove("user");
    await prefs.remove("token");

    if (!mounted) return;
    Navigator.pushReplacementNamed(context, "/login");
  }

  // loads job ids for jobs the user has already applied to
  Future<void> loadAppliedIds() async {
    try {
      final res = await authGet("/api/users/jobs/my-applications");

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as List<dynamic>;
        final ids = <String>{};

        for (final app in data) {
          final appMap = Map<String, dynamic>.from(app as Map);

          if (appMap['jobId'] != null) {
            ids.add(appMap['jobId'].toString());
          } else if (appMap['job'] != null && appMap['job'] is Map) {
            final jobMap = Map<String, dynamic>.from(appMap['job'] as Map);
            if (jobMap['_id'] != null) {
              ids.add(jobMap['_id'].toString());
            }
          } else if (appMap['_id'] != null) {
            ids.add(appMap['_id'].toString());
          }
        }

        if (!mounted) return;
        setState(() {
          appliedIds = ids;
        });
      }
    } catch (e) {
      debugPrint("Error loading applied job IDs: $e");
    }
  }

  // sends search request to backend
  Future<void> handleSearch() async {
    setState(() => loading = true);

    try {
      final res = await authPost("/api/jobs/searchJobs", {
        "title": _searchController.text,
        "description": "",
        "company": "",
      });

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body) as List<dynamic>;

        if (!mounted) return;
        setState(() => jobs = decoded);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Error fetching jobs")),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Error fetching jobs")),
        );
      }
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  // applies user to selected job
  Future<void> handleApply(String jobId) async {
    try {
      final res = await authPost("/api/users/jobs/apply/$jobId", {});
      if (!mounted) return;

      final data = jsonDecode(res.body);

      if (res.statusCode == 200) {
        await loadAppliedIds();
        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Applied successfully!")),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? "Error applying")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Error applying to job")),
        );
      }
    }
  }

  @override
  void dispose() {
    // dispose search controller
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      extendBodyBehindAppBar: true,

      // top app bar
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

      // side drawer
      endDrawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
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
              child: Column(
                children: [
                  // search header section
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 16),

                        const Text(
                          "Search Jobs",
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),

                        const SizedBox(height: 12),

                        // search bar and button
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _searchController,
                                decoration: InputDecoration(
                                  hintText: "Title, keyword or company ...",
                                  filled: true,
                                  fillColor: Colors.white,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                ),
                                onSubmitted: (_) => handleSearch(),
                              ),
                            ),

                            const SizedBox(width: 8),

                            ElevatedButton(
                              onPressed: handleSearch,
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromRGBO(50, 30, 90, 0.7),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 14,
                                ),
                              ),
                              child: const Text(
                                "Search",
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // results container
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.85),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
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
                          else if (jobs.isEmpty)
                            const Expanded(
                              child: Center(
                                child: Text(
                                  "No jobs found. Try another search above.",
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            )

                          // results list
                          else
                            Expanded(
                              child: ListView.separated(
                                itemCount: jobs.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 12),
                                itemBuilder: (context, index) {
                                  final job =
                                      Map<String, dynamic>.from(jobs[index]);
                                  return _buildJobCard(job);
                                },
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),

      // bottom navigation
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1,
        onTap: (index) {
          if (index == 0) {
            Navigator.pushReplacementNamed(context, "/applicantProfile");
          } else if (index == 2) {
            Navigator.pushReplacementNamed(context, "/applications");
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            label: "Search",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: "Applications",
          ),
        ],
      ),
    );
  }

  // builds each job result card
  Widget _buildJobCard(Map<String, dynamic> job) {
    final jobId = job['_id'].toString();
    final alreadyApplied = appliedIds.contains(jobId);
    final createdBy = job['createdBy'];

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
          // title
          _fieldLabel("Job Title"),
          Text(
            job['title'] ?? "",
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 17,
            ),
          ),

          const SizedBox(height: 8),

          // company
          _fieldLabel("Company Name"),
          Text(
            job['company'] ?? "",
            style: const TextStyle(
              fontSize: 15,
              color: Colors.black87,
            ),
          ),

          // pay rate
          if (job['payRate'] != null && job['payRate'] != "") ...[
            const SizedBox(height: 8),
            _fieldLabel("Pay Rate"),
            Text(
              job['payRate'],
              style: TextStyle(
                color: Colors.green[800],
                fontWeight: FontWeight.w600,
              ),
            ),
          ],

          // start date
          if (job['startDate'] != null && job['startDate'] != "") ...[
            const SizedBox(height: 8),
            _fieldLabel("Start Date"),
            Text(
              DateTime.parse(job['startDate'])
                  .toLocal()
                  .toString()
                  .split(' ')[0],
              style: const TextStyle(color: Colors.black54),
            ),
          ],

          // description
          if (job['description'] != null && job['description'] != "") ...[
            const SizedBox(height: 8),
            _fieldLabel("Job Description"),
            Text(
              job['description'],
              style: const TextStyle(
                fontSize: 13,
                color: Colors.black54,
                height: 1.5,
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(),

          // footer with post info and apply button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (createdBy != null)
                    Text(
                      "Posted by: ${createdBy['firstname']} ${createdBy['lastname']}",
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.grey,
                      ),
                    ),
                  if (job['createdAt'] != null)
                    Text(
                      DateTime.parse(job['createdAt'])
                          .toLocal()
                          .toString()
                          .split(' ')[0],
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.grey,
                      ),
                    ),
                ],
              ),

              // apply button
              ElevatedButton(
                onPressed: alreadyApplied ? null : () => handleApply(jobId),
                style: ElevatedButton.styleFrom(
                  backgroundColor: alreadyApplied
                      ? Colors.grey
                      : const Color.fromRGBO(50, 30, 90, 0.75),
                ),
                child: Text(
                  alreadyApplied ? "Applied ✓" : "Apply Now",
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // small label used above job fields
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