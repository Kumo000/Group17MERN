// Applicant Profile Screen
// allows applicant to view and edit profile information

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'api_service.dart';

class ApplicantProfileScreen extends StatefulWidget {
  const ApplicantProfileScreen({super.key});

  @override
  State<ApplicantProfileScreen> createState() => _ApplicantProfileScreenState();
}

class _ApplicantProfileScreenState extends State<ApplicantProfileScreen> {
  // scaffold key for drawer
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // current user data
  Map<String, dynamic>? user;

  // field editing state
  String? editingField;
  final TextEditingController _editController = TextEditingController();

  // skill input state
  bool addingSkill = false;
  String newSkill = "";
  final TextEditingController _skillController = TextEditingController();

  // degree input state
  bool addingDegree = false;
  Map<String, String> newDegree = {
    "university": "",
    "degree": "",
    "major": "",
  };

  // experience input state
  bool addingExperience = false;
  Map<String, String> newExperience = {
    "title": "",
    "startDate": "",
    "endDate": "",
    "description": "",
  };

  // resume upload loading state
  bool resumeUploading = false;

  @override
  void initState() {
    super.initState();

    // load user data
    initializeData();
  }

  @override
  void dispose() {
    _editController.dispose();
    _skillController.dispose();
    super.dispose();
  }

  // fetch user from backend or local storage
  Future<void> initializeData() async {
    final prefs = await SharedPreferences.getInstance();

    try {
      final res = await authGet("/api/users/me");
      if (res.statusCode == 200) {
        final userData = jsonDecode(res.body) as Map<String, dynamic>;
        await prefs.setString("user", jsonEncode(userData));
        if (!mounted) return;
        setState(() => user = userData);
      } else {
        final stored = prefs.getString("user");
        if (stored != null && mounted) {
          setState(() => user = jsonDecode(stored) as Map<String, dynamic>);
        }
      }
    } catch (_) {
      final stored = prefs.getString("user");
      if (stored != null && mounted) {
        setState(() => user = jsonDecode(stored) as Map<String, dynamic>);
      }
    }
  }

  // save updated user data to backend
  Future<void> saveToAPI(Map<String, dynamic> updatedUser) async {
    final res = await authPut("/api/users/update", updatedUser);

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString("user", jsonEncode(data['user']));

      if (!mounted) return;
      setState(() {
        user = Map<String, dynamic>.from(data['user'] as Map);
      });
    } else {
      throw Exception("Failed to update profile");
    }
  }

  // save personal info changes
  Future<void> handleSavePersonalInfo() async {
    if (user == null) return;

    try {
      await saveToAPI(user!);
      _showSnack("Personal info saved!");
    } catch (_) {
      _showSnack("Error saving personal info");
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

  // start editing a field
  void startEditingField(String field, String currentValue) {
    setState(() {
      editingField = field;
      _editController.text = currentValue;
    });
  }

  // cancel editing
  void cancelEditingField() {
    setState(() {
      editingField = null;
      _editController.clear();
    });
  }

  // confirm field edit locally
  void confirmEditingField() {
    if (user == null || editingField == null) return;

    setState(() {
      user![editingField!] = _editController.text.trim();
      editingField = null;
      _editController.clear();
    });
  }

  // save new skill
  Future<void> handleSaveSkill() async {
    if (user == null) return;
    final trimmed = newSkill.trim();
    if (trimmed.isEmpty) return;

    final existing = List<String>.from(user!['skills'] ?? []);
    if (existing.contains(trimmed)) {
      setState(() {
        addingSkill = false;
        newSkill = "";
        _skillController.clear();
      });
      return;
    }

    try {
      await saveToAPI({
        ...user!,
        "skills": [...existing, trimmed],
      });

      if (!mounted) return;
      setState(() {
        addingSkill = false;
        newSkill = "";
        _skillController.clear();
      });
    } catch (_) {
      _showSnack("Error saving skill");
    }
  }

  // remove skill
  Future<void> handleRemoveSkill(String skill) async {
    if (user == null) return;

    final updated = List<String>.from(user!['skills'] ?? [])..remove(skill);

    try {
      await saveToAPI({
        ...user!,
        "skills": updated,
      });
    } catch (_) {
      _showSnack("Error removing skill");
    }
  }

  // save new degree
  Future<void> handleSaveDegree() async {
    if (user == null) return;
    if (newDegree["university"]!.trim().isEmpty ||
        newDegree["degree"]!.trim().isEmpty) {
      return;
    }

    final degrees = List<dynamic>.from(user!['degrees'] ?? []);
    degrees.add({
      "university": newDegree["university"]!.trim(),
      "degree": newDegree["degree"]!.trim(),
      "major": newDegree["major"]!.trim(),
    });

    try {
      await saveToAPI({
        ...user!,
        "degrees": degrees,
      });

      if (!mounted) return;
      setState(() {
        addingDegree = false;
        newDegree = {
          "university": "",
          "degree": "",
          "major": "",
        };
      });
    } catch (_) {
      _showSnack("Error saving degree");
    }
  }

  // remove degree
  Future<void> handleRemoveDegree(int idx) async {
    if (user == null) return;

    final degrees = List<dynamic>.from(user!['degrees'] ?? []);
    degrees.removeAt(idx);

    try {
      await saveToAPI({
        ...user!,
        "degrees": degrees,
      });
    } catch (_) {
      _showSnack("Error removing degree");
    }
  }

  // save new experience entry
  Future<void> handleSaveExperience() async {
    if (user == null) return;
    if (newExperience["title"]!.trim().isEmpty ||
        newExperience["startDate"]!.trim().isEmpty) {
      return;
    }

    final experience = List<dynamic>.from(user!['experience'] ?? []);
    experience.add({
      "title": newExperience["title"]!.trim(),
      "startDate": newExperience["startDate"]!.trim(),
      "endDate": newExperience["endDate"]!.trim(),
      "description": newExperience["description"]!.trim(),
    });

    try {
      await saveToAPI({
        ...user!,
        "experience": experience,
      });

      if (!mounted) return;
      setState(() {
        addingExperience = false;
        newExperience = {
          "title": "",
          "startDate": "",
          "endDate": "",
          "description": "",
        };
      });
    } catch (_) {
      _showSnack("Error saving experience");
    }
  }

  // remove experience entry
  Future<void> handleRemoveExperience(int idx) async {
    if (user == null) return;

    final experience = List<dynamic>.from(user!['experience'] ?? []);
    experience.removeAt(idx);

    try {
      await saveToAPI({
        ...user!,
        "experience": experience,
      });
    } catch (_) {
      _showSnack("Error removing experience");
    }
  }

  // upload or replace resume PDF
  Future<void> handleResumeUpload() async {
    try {
      // open file picker for PDF only
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        withData: true,
      );

      if (result == null || result.files.isEmpty) return;

      final file = result.files.first;

      // make sure file bytes were loaded
      if (file.bytes == null) {
        _showSnack("Could not read the selected PDF.");
        return;
      }

      setState(() => resumeUploading = true);

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token") ?? "";

      // create multipart upload request
      final request = http.MultipartRequest(
        "POST",
        Uri.parse("$baseUrl/api/users/upload-resume"),
      );

      request.headers["Authorization"] = token;

      // attach selected PDF file
      request.files.add(
        http.MultipartFile.fromBytes(
          "resume",
          file.bytes!,
          filename: file.name,
          contentType: MediaType("application", "pdf"),
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (!mounted) return;

      // store updated user after successful upload
      if (response.statusCode == 200) {
        final updatedUser = Map<String, dynamic>.from(data["user"] as Map);

        await prefs.setString("user", jsonEncode(updatedUser));

        setState(() {
          user = updatedUser;
        });

        _showSnack(data["message"] ?? "Resume uploaded successfully!");
      } else {
        _showSnack(data["message"] ?? "Upload failed");
      }
    } catch (e) {
      _showSnack("Error uploading resume");
    } finally {
      if (mounted) {
        setState(() => resumeUploading = false);
      }
    }
  }

  // show snackbar message
  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
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
  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Color(0xFF333333),
        ),
      ),
    );
  }

  // editable row for profile fields
  Widget _editableInfoRow(String label, String field, String value) {
    final isEditing = editingField == field;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // field label
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF444444),
            ),
          ),
          const SizedBox(height: 6),

          // edit mode
          if (isEditing)
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _editController,
                    autofocus: true,
                    decoration: _inputDecoration("Enter $label"),
                    onSubmitted: (_) => confirmEditingField(),
                  ),
                ),
                const SizedBox(width: 8),

                // confirm edit button
                ElevatedButton(
                  onPressed: confirmEditingField,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  child: const Text("✓", style: TextStyle(color: Colors.white)),
                ),
                const SizedBox(width: 4),

                // cancel edit button
                ElevatedButton(
                  onPressed: cancelEditingField,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.grey),
                  child: const Text("✕", style: TextStyle(color: Colors.white)),
                ),
              ],
            )

          // display mode
          else
            Row(
              children: [
                Expanded(
                  child: Text(
                    value.isEmpty ? "—" : value,
                    style: const TextStyle(fontSize: 15),
                  ),
                ),

                // edit button
                ElevatedButton(
                  onPressed: () => startEditingField(field, value),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromRGBO(50, 30, 90, 0.7),
                  ),
                  child: const Text(
                    "Edit",
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  // reusable outlined action button
  Widget _smallOutlineButton(String label, VoidCallback onPressed) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.green[800],
        side: BorderSide(color: Colors.green[700]!),
      ),
      child: Text(label),
    );
  }

  // card for one degree entry
  Widget _buildDegreeCard(Map<String, dynamic> deg, int idx) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // degree and major
          Text(
            "${deg['degree'] ?? ''}${(deg['major'] ?? '').toString().isNotEmpty ? ' — ${deg['major']}' : ''}",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),

          // university name
          Text(
            deg['university']?.toString() ?? "—",
            style: const TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 8),

          // remove degree button
          ElevatedButton(
            onPressed: () => handleRemoveDegree(idx),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Remove", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // card for one experience entry
  Widget _buildExperienceCard(Map<String, dynamic> exp, int idx) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // job title
          Text(
            exp['title']?.toString() ?? "—",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),

          // date range
          Text(
            "${exp['startDate'] != null && exp['startDate'].toString().isNotEmpty ? exp['startDate'].toString().split('T')[0] : '—'} — ${exp['endDate'] != null && exp['endDate'].toString().isNotEmpty ? exp['endDate'].toString().split('T')[0] : 'Present'}",
            style: const TextStyle(color: Colors.black54),
          ),

          // optional description
          if ((exp['description'] ?? "").toString().isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(exp['description'].toString()),
          ],
          const SizedBox(height: 8),

          // remove experience button
          ElevatedButton(
            onPressed: () => handleRemoveExperience(idx),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Remove", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // loading state
    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final degrees = List<dynamic>.from(user!['degrees'] ?? []);
    final experience = List<dynamic>.from(user!['experience'] ?? []);
    final skills = List<String>.from(user!['skills'] ?? []);

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
              // drawer header
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
                    // greeting
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        "Hello, ${user!['firstname'] ?? ''}",
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // personal information card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionTitle("Personal Information"),
                          _editableInfoRow(
                            "First Name",
                            "firstname",
                            user!['firstname']?.toString() ?? "",
                          ),
                          _editableInfoRow(
                            "Last Name",
                            "lastname",
                            user!['lastname']?.toString() ?? "",
                          ),
                          _editableInfoRow(
                            "Email",
                            "email",
                            user!['email']?.toString() ?? "",
                          ),
                          _editableInfoRow(
                            "Phone",
                            "phone",
                            user!['phone']?.toString() ?? "",
                          ),
                          const SizedBox(height: 8),

                          // save personal info button
                          ElevatedButton(
                            onPressed: handleSavePersonalInfo,
                            style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  const Color.fromRGBO(50, 30, 90, 0.7),
                            ),
                            child: const Text(
                              "Save",
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // degrees card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionTitle("Degrees"),

                          // existing degree entries
                          ...degrees.asMap().entries.map(
                                (entry) => _buildDegreeCard(
                                  Map<String, dynamic>.from(entry.value as Map),
                                  entry.key,
                                ),
                              ),

                          // add degree form
                          if (addingDegree) ...[
                            TextField(
                              decoration: _inputDecoration("University"),
                              onChanged: (v) => newDegree['university'] = v,
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              decoration: _inputDecoration("Degree"),
                              onChanged: (v) => newDegree['degree'] = v,
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              decoration: _inputDecoration("Major (optional)"),
                              onChanged: (v) => newDegree['major'] = v,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                // save degree button
                                ElevatedButton(
                                  onPressed: handleSaveDegree,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        const Color.fromRGBO(50, 30, 90, 0.7),
                                  ),
                                  child: const Text(
                                    "Save",
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // cancel add degree button
                                ElevatedButton(
                                  onPressed: () => setState(() {
                                    addingDegree = false;
                                    newDegree = {
                                      "university": "",
                                      "degree": "",
                                      "major": "",
                                    };
                                  }),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.grey,
                                  ),
                                  child: const Text(
                                    "Cancel",
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ] else
                            // add degree button
                            _smallOutlineButton("+ Add Degree", () {
                              setState(() => addingDegree = true);
                            }),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // experience card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionTitle("Experience"),

                          // existing experience entries
                          ...experience.asMap().entries.map(
                                (entry) => _buildExperienceCard(
                                  Map<String, dynamic>.from(entry.value as Map),
                                  entry.key,
                                ),
                              ),

                          // add experience form
                          if (addingExperience) ...[
                            TextField(
                              decoration: _inputDecoration("Job Title"),
                              onChanged: (v) => newExperience['title'] = v,
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              decoration:
                                  _inputDecoration("Start Date (YYYY-MM-DD)"),
                              onChanged: (v) => newExperience['startDate'] = v,
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              decoration: _inputDecoration("End Date (optional)"),
                              onChanged: (v) => newExperience['endDate'] = v,
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              maxLines: 3,
                              decoration:
                                  _inputDecoration("Description (optional)"),
                              onChanged: (v) => newExperience['description'] = v,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                // save experience button
                                ElevatedButton(
                                  onPressed: handleSaveExperience,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        const Color.fromRGBO(50, 30, 90, 0.7),
                                  ),
                                  child: const Text(
                                    "Save",
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // cancel add experience button
                                ElevatedButton(
                                  onPressed: () => setState(() {
                                    addingExperience = false;
                                    newExperience = {
                                      "title": "",
                                      "startDate": "",
                                      "endDate": "",
                                      "description": "",
                                    };
                                  }),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.grey,
                                  ),
                                  child: const Text(
                                    "Cancel",
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ] else
                            // add experience button
                            _smallOutlineButton("+ Add Experience", () {
                              setState(() => addingExperience = true);
                            }),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // resume card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionTitle("Resume"),

                          // resume status text
                          if ((user!['resumeUrl'] ?? "").toString().isNotEmpty) ...[
                            const Text(
                              "A resume is currently uploaded.",
                              style: TextStyle(color: Colors.black54),
                            ),
                            const SizedBox(height: 8),
                          ] else
                            const Text(
                              "No resume uploaded yet.",
                              style: TextStyle(color: Colors.black54),
                            ),

                          // upload / replace resume button
                          ElevatedButton(
                            onPressed: resumeUploading ? null : handleResumeUpload,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade50,
                              foregroundColor: Colors.green.shade800,
                              side: BorderSide(color: Colors.green.shade700),
                            ),
                            child: Text(
                              resumeUploading
                                  ? "Uploading..."
                                  : ((user!['resumeUrl'] ?? "").toString().isNotEmpty
                                      ? "Replace Resume (PDF)"
                                      : "Upload Resume (PDF)"),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // skills card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _sectionTitle("Skills"),

                          // skill chips
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: skills
                                .map(
                                  (skill) => Chip(
                                    label: Text(skill),
                                    deleteIcon: const Icon(Icons.close, size: 16),
                                    onDeleted: () => handleRemoveSkill(skill),
                                  ),
                                )
                                .toList(),
                          ),
                          const SizedBox(height: 8),

                          // add skill input
                          if (addingSkill) ...[
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _skillController,
                                    autofocus: true,
                                    decoration: _inputDecoration("Enter a skill"),
                                    onChanged: (v) => newSkill = v,
                                    onSubmitted: (_) => handleSaveSkill(),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // save skill button
                                ElevatedButton(
                                  onPressed: handleSaveSkill,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        const Color.fromRGBO(50, 30, 90, 0.7),
                                  ),
                                  child: const Text(
                                    "Save",
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 4),

                                // cancel add skill button
                                ElevatedButton(
                                  onPressed: () => setState(() {
                                    addingSkill = false;
                                    newSkill = "";
                                    _skillController.clear();
                                  }),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.grey,
                                  ),
                                  child: const Text(
                                    "Cancel",
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ] else
                            // add skill button
                            _smallOutlineButton("+ Add Skill", () {
                              setState(() => addingSkill = true);
                            }),
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
        currentIndex: 0,
        onTap: (index) {
          if (index == 1) {
            Navigator.pushReplacementNamed(context, "/jobs");
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
}