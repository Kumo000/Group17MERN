// Employer Listings Screen
// shows active job listings, applicants, and job management actions

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class EmployerListingsScreen extends StatefulWidget {
  const EmployerListingsScreen({super.key});

  @override
  State<EmployerListingsScreen> createState() => _EmployerListingsScreenState();
}

class _EmployerListingsScreenState extends State<EmployerListingsScreen> {
  // scaffold key for drawer
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // active job listings
  List<dynamic> activeJobs = [];

  // applicants grouped by job id
  Map<String, List<dynamic>> applicantsByJob = {};

  // tracks which applicant profile is expanded
  String? expandedApplicantKey;

  // loading and add-job state
  bool loading = true;
  bool addingJob = false;

  // new job form data
  Map<String, String> newJob = {
    "title": "",
    "description": "",
    "company": "",
    "payRate": "",
    "startDate": "",
  };

  // editing job state
  String? editingJobId;
  Map<String, String> editingJob = {
    "title": "",
    "description": "",
    "company": "",
    "payRate": "",
    "startDate": "",
  };

  // hire confirmation data
  Map<String, String>? hireConfirm;

  @override
  void initState() {
    super.initState();

    // load listings on screen start
    fetchListings();
  }

  // logout user
  Future<void> handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove("user");
    await prefs.remove("token");

    if (!mounted) return;
    Navigator.pushReplacementNamed(context, "/login");
  }

  // fetch active listings and applicants
  Future<void> fetchListings() async {
    if (mounted) {
      setState(() {
        loading = true;
      });
    }

    try {
      final res = await authGet("/api/jobs/myListings");

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final active = List<dynamic>.from(data['active'] ?? []);
        final newApplicantsByJob = <String, List<dynamic>>{};

        for (final job in active) {
          final jobMap = Map<String, dynamic>.from(job as Map);
          final jobId = jobMap['_id']?.toString();
          if (jobId != null && jobId.isNotEmpty) {
            final applicants = await fetchApplicants(jobId);
            newApplicantsByJob[jobId] = applicants;
          }
        }

        if (!mounted) return;
        setState(() {
          activeJobs = active;
          applicantsByJob = newApplicantsByJob;
        });
      } else {
        debugPrint("Failed to fetch listings: ${res.statusCode}");
      }
    } catch (e) {
      debugPrint("Error fetching listings: $e");
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  // fetch applicants for one job
  Future<List<dynamic>> fetchApplicants(String jobId) async {
    try {
      final res = await authGet("/api/jobs/getApplicants/$jobId");
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return List<dynamic>.from(data['applicants'] ?? []);
      }
    } catch (e) {
      debugPrint("Error fetching applicants: $e");
    }
    return [];
  }

  // update applicant status
  Future<void> updateApplicantStatus(
    String jobId,
    String subdocId,
    String status,
  ) async {
    try {
      final res = await authPut(
        "/api/jobs/updateApplicantStatus/$jobId/$subdocId",
        {"status": status},
      );

      if (res.statusCode == 200 && mounted) {
        setState(() {
          applicantsByJob[jobId] =
              (applicantsByJob[jobId] ?? []).map<Map<String, dynamic>>((app) {
            final appMap = Map<String, dynamic>.from(app as Map);
            if (appMap['_id'] == subdocId) {
              return {...appMap, 'status': status};
            }
            return appMap;
          }).toList();
        });
      } else {
        _showSnack("Error updating status");
      }
    } catch (e) {
      debugPrint("Error updating status: $e");
      _showSnack("Error updating status");
    }
  }

  // send interview request
  Future<void> requestInterview(String jobId, String subdocId) async {
    try {
      final res = await authPost("/api/jobs/requestInterview/$jobId/$subdocId", {});

      if (res.statusCode == 200 && mounted) {
        setState(() {
          applicantsByJob[jobId] =
              (applicantsByJob[jobId] ?? []).map<Map<String, dynamic>>((app) {
            final appMap = Map<String, dynamic>.from(app as Map);
            if (appMap['_id'] == subdocId) {
              return {...appMap, 'status': 'interview requested'};
            }
            return appMap;
          }).toList();
        });
      } else {
        _showSnack("Error sending interview request");
      }
    } catch (e) {
      debugPrint("Error requesting interview: $e");
      _showSnack("Error sending interview request");
    }
  }

  // confirm hire action
  Future<void> confirmHire() async {
    if (hireConfirm == null) return;

    final jobId = hireConfirm!['jobId']!;
    final subdocId = hireConfirm!['subdocId']!;

    try {
      final res = await authPut("/api/jobs/hire/$jobId/$subdocId", {});

      if (res.statusCode == 200) {
        if (!mounted) return;
        setState(() => hireConfirm = null);
        await fetchListings();
      } else {
        _showSnack("Error hiring applicant");
      }
    } catch (e) {
      debugPrint("Error hiring applicant: $e");
      _showSnack("Error hiring applicant");
    }
  }

  // post new job
  Future<void> handlePostJob() async {
    if (newJob['title']!.isEmpty || newJob['company']!.isEmpty) return;

    try {
      final body = {
        ...newJob,
        if (newJob['startDate']!.isEmpty) "startDate": null,
      };

      final res = await authPost("/api/jobs/postJob", body);

      if (!mounted) return;

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          addingJob = false;
          newJob = {
            "title": "",
            "description": "",
            "company": "",
            "payRate": "",
            "startDate": "",
          };
        });
        await fetchListings();
      } else {
        final err = jsonDecode(res.body) as Map<String, dynamic>;
        _showSnack(err['message'] ?? "Error posting job");
      }
    } catch (_) {
      _showSnack("Error posting job");
    }
  }

  // delete job listing
  Future<void> handleDeleteJob(String jobId) async {
    try {
      final res = await authDelete("/api/jobs/deleteJob/$jobId");

      if (res.statusCode == 200 && mounted) {
        setState(() {
          activeJobs.removeWhere((j) {
            final job = Map<String, dynamic>.from(j as Map);
            return job['_id'] == jobId;
          });
        });
      } else {
        _showSnack("Error deleting job");
      }
    } catch (e) {
      debugPrint("Error deleting job: $e");
      _showSnack("Error deleting job");
    }
  }

  // close job listing
  Future<void> handleCloseJob(String jobId) async {
    try {
      final res = await authPut("/api/jobs/closeJob/$jobId", {});

      if (res.statusCode == 200) {
        await fetchListings();
      } else {
        _showSnack("Error closing listing");
      }
    } catch (e) {
      debugPrint("Error closing listing: $e");
      _showSnack("Error closing listing");
    }
  }

  // begin editing a job
  void startEditingJob(Map<String, dynamic> job) {
    setState(() {
      editingJobId = job['_id']?.toString();
      editingJob = {
        "title": job['title']?.toString() ?? "",
        "description": job['description']?.toString() ?? "",
        "company": job['company']?.toString() ?? "",
        "payRate": job['payRate']?.toString() ?? "",
        "startDate": _dateOnly(job['startDate']?.toString()),
      };
    });
  }

  // save edited job
  Future<void> handleUpdateJob(String jobId) async {
    try {
      final res = await authPut("/api/jobs/updateJob/$jobId", editingJob);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final updatedJob = Map<String, dynamic>.from(data['job'] as Map);

        if (!mounted) return;

        setState(() {
          activeJobs = activeJobs.map<Map<String, dynamic>>((j) {
            final jobMap = Map<String, dynamic>.from(j as Map);
            if (jobMap['_id'] == jobId) {
              return {...jobMap, ...updatedJob};
            }
            return jobMap;
          }).toList();

          editingJobId = null;
        });
      } else {
        _showSnack("Error updating job");
      }
    } catch (e) {
      debugPrint("Error updating job: $e");
      _showSnack("Error updating job");
    }
  }

  // format date to only show YYYY-MM-DD
  String _dateOnly(String? value) {
    if (value == null || value.isEmpty) return "";
    return value.contains("T") ? value.split("T")[0] : value;
  }

  // show snackbar message
  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  // applicant status color helper
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

  // reusable input decoration
  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    );
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

  // reusable job form for add/edit
  Widget _buildJobForm({
    required Map<String, String> jobData,
    required void Function(String key, String value) onChanged,
    required VoidCallback onSave,
    required VoidCallback onCancel,
    required String saveLabel,
  }) {
    Widget field(String label, String key, {int maxLines = 1}) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: TextEditingController(text: jobData[key])
            ..selection = TextSelection.fromPosition(
              TextPosition(offset: (jobData[key] ?? "").length),
            ),
          maxLines: maxLines,
          decoration: _inputDecoration(label),
          onChanged: (val) => onChanged(key, val),
        ),
      );
    }

    return Column(
      children: [
        field("Job Title", "title"),
        field("Description", "description", maxLines: 3),
        field("Company", "company"),
        field("Pay Rate", "payRate"),
        field("Start Date (YYYY-MM-DD)", "startDate"),
        Row(
          children: [
            // save button
            ElevatedButton(
              onPressed: onSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color.fromRGBO(50, 30, 90, 0.7),
              ),
              child: Text(saveLabel, style: const TextStyle(color: Colors.white)),
            ),
            const SizedBox(width: 8),

            // cancel button
            ElevatedButton(
              onPressed: onCancel,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.grey),
              child: const Text("Cancel", style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ],
    );
  }

  // mini label for applicant profile details
  Widget _miniLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: Colors.grey,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  // applicant panel inside each job card
  Widget _buildApplicantPanel(Map<String, dynamic> app, String jobId, String jobTitle) {
    final appId = app['_id']?.toString() ?? "";
    final key = "${jobId}_$appId";
    final isExpanded = expandedApplicantKey == key;
    final status = app['status']?.toString() ?? "pending";
    final canRequestInterview =
        status == "under review" || status == "interview requested";
    final canHire =
        status == "interview requested" || status == "interview pending";

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: Colors.deepPurple.withOpacity(0.35),
            width: 3,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // applicant name, email, and status
          Wrap(
            runSpacing: 8,
            spacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                "${app['firstname'] ?? ''} ${app['lastname'] ?? ''}",
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                app['email']?.toString() ?? "",
                style: const TextStyle(color: Colors.black54),
              ),
              Text(
                "($status)",
                style: TextStyle(
                  color: _statusColor(status),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // applicant action buttons
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (status == "pending")
                ElevatedButton(
                  onPressed: () => updateApplicantStatus(jobId, appId, "under review"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromRGBO(50, 30, 90, 0.7),
                  ),
                  child: const Text("Under Review", style: TextStyle(color: Colors.white)),
                ),
              if (canRequestInterview)
                ElevatedButton(
                  onPressed: status == "interview requested"
                      ? null
                      : () => requestInterview(jobId, appId),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepOrange,
                  ),
                  child: Text(
                    status == "interview requested"
                        ? "Interview Requested"
                        : "Request Interview",
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              if (canHire)
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      hireConfirm = {
                        "jobId": jobId,
                        "subdocId": appId,
                        "name": "${app['firstname'] ?? ''} ${app['lastname'] ?? ''}",
                        "jobTitle": jobTitle,
                      };
                    });
                    _showHireDialog();
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  child: const Text("Hire", style: TextStyle(color: Colors.white)),
                ),
              if (status != "rejected" &&
                  status != "hired" &&
                  status != "interview requested" &&
                  status != "interview pending")
                ElevatedButton(
                  onPressed: () => updateApplicantStatus(jobId, appId, "rejected"),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text("Reject", style: TextStyle(color: Colors.white)),
                ),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    expandedApplicantKey = isExpanded ? null : key;
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromRGBO(50, 30, 90, 0.45),
                ),
                child: Text(
                  isExpanded ? "Hide Profile" : "View Profile",
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),

          // expanded applicant profile
          if (isExpanded) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _miniLabel("Phone"),
                  Text(
                    app['phone']?.toString().isNotEmpty == true
                        ? app['phone'].toString()
                        : "—",
                  ),
                  const SizedBox(height: 8),
                  _miniLabel("Skills"),
                  Text(
                    (app['skills'] is List && (app['skills'] as List).isNotEmpty)
                        ? (app['skills'] as List).join(", ")
                        : "—",
                  ),
                  const SizedBox(height: 8),
                  _miniLabel("Degrees"),
                  if (app['degrees'] is List && (app['degrees'] as List).isNotEmpty)
                    ...List.generate((app['degrees'] as List).length, (i) {
                      final d = Map<String, dynamic>.from(
                        (app['degrees'] as List)[i] as Map,
                      );
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          "${d['degree'] ?? ''} ${d['major'] != null && d['major'].toString().isNotEmpty ? 'in ${d['major']}' : ''} - ${d['university'] ?? ''}",
                        ),
                      );
                    })
                  else
                    const Text("—"),
                  const SizedBox(height: 8),
                  _miniLabel("Experience"),
                  if (app['experience'] is List && (app['experience'] as List).isNotEmpty)
                    ...List.generate((app['experience'] as List).length, (i) {
                      final e = Map<String, dynamic>.from(
                        (app['experience'] as List)[i] as Map,
                      );
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text(
                          "${e['title'] ?? ''}"
                          "${e['description'] != null && e['description'].toString().isNotEmpty ? ' — ${e['description']}' : ''}",
                        ),
                      );
                    })
                  else
                    const Text("—"),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // job card for each active listing
  Widget _buildJobCard(Map<String, dynamic> job) {
    final jobId = job['_id']?.toString() ?? "";
    final isEditing = editingJobId == jobId;
    final applicants = applicantsByJob[jobId] ?? [];

    return Container(
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
          if (isEditing)
            _buildJobForm(
              jobData: editingJob,
              onChanged: (key, value) => setState(() => editingJob[key] = value),
              onSave: () => handleUpdateJob(jobId),
              onCancel: () => setState(() => editingJobId = null),
              saveLabel: "Save Changes",
            )
          else ...[
            // job details
            Text(
              job['title']?.toString() ?? "Untitled Job",
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text("Company: ${job['company'] ?? '—'}"),
            if ((job['description'] ?? "").toString().isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(job['description'].toString()),
              ),
            if ((job['payRate'] ?? "").toString().isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text("Pay Rate: ${job['payRate']}"),
              ),
            if ((job['startDate'] ?? "").toString().isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text("Start Date: ${_dateOnly(job['startDate']?.toString())}"),
              ),
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
            const SizedBox(height: 10),

            // job action buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton(
                  onPressed: () => startEditingJob(job),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromRGBO(50, 30, 90, 0.7),
                  ),
                  child: const Text("Edit", style: TextStyle(color: Colors.white)),
                ),
                ElevatedButton(
                  onPressed: () => handleDeleteJob(jobId),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text("Delete", style: TextStyle(color: Colors.white)),
                ),
                ElevatedButton(
                  onPressed: () => handleCloseJob(jobId),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                  child: const Text("Close Listing", style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // applicants section
            const Text(
              "Applicants",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),

            if (applicants.isEmpty)
              const Text(
                "No applicants yet.",
                style: TextStyle(color: Colors.grey),
              )
            else
              ...applicants.map(
                (app) => _buildApplicantPanel(
                  Map<String, dynamic>.from(app as Map),
                  jobId,
                  job['title']?.toString() ?? "",
                ),
              ),
          ],
        ],
      ),
    );
  }

  // hire confirmation dialog
  Future<void> _showHireDialog() async {
    if (hireConfirm == null) return;

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Confirm Hire"),
          content: Text(
            "Hire ${hireConfirm!['name']} for ${hireConfirm!['jobTitle']}?",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                if (mounted) {
                  setState(() => hireConfirm = null);
                }
              },
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                await confirmHire();
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text("Hire", style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
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
                        "My Listings",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // main listings card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionTitle("Active Listings"),

                          // loading state
                          if (loading)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.symmetric(vertical: 24),
                                child: CircularProgressIndicator(),
                              ),
                            )
                          else ...[
                            // empty state
                            if (activeJobs.isEmpty && !addingJob)
                              const Text(
                                "No active job listings yet.",
                                style: TextStyle(color: Colors.grey),
                              ),

                            // job cards
                            ...activeJobs.map(
                              (job) => _buildJobCard(
                                Map<String, dynamic>.from(job as Map),
                              ),
                            ),
                          ],

                          const SizedBox(height: 8),

                          // add listing form or button
                          if (addingJob)
                            _buildJobForm(
                              jobData: newJob,
                              onChanged: (key, val) =>
                                  setState(() => newJob[key] = val),
                              onSave: handlePostJob,
                              onCancel: () => setState(() {
                                addingJob = false;
                                newJob = {
                                  "title": "",
                                  "description": "",
                                  "company": "",
                                  "payRate": "",
                                  "startDate": "",
                                };
                              }),
                              saveLabel: "Post Job",
                            )
                          else
                            OutlinedButton(
                              onPressed: () => setState(() => addingJob = true),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.green[800],
                                side: BorderSide(color: Colors.green[700]!),
                              ),
                              child: const Text("+ Add Listing"),
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
        currentIndex: 1,
        onTap: (index) {
          if (index == 0) {
            Navigator.pushReplacementNamed(context, "/employerProfile");
          } else if (index == 2) {
            Navigator.pushReplacementNamed(context, "/employerPastListings");
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.work),
            label: "My Listings",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: "Past Listings",
          ),
        ],
      ),
    );
  }
}