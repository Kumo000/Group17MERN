// Employer Profile Screen
// allows employer to view and edit profile information

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class EmployerProfileScreen extends StatefulWidget {
  const EmployerProfileScreen({super.key});

  @override
  State<EmployerProfileScreen> createState() => _EmployerProfileScreenState();
}

class _EmployerProfileScreenState extends State<EmployerProfileScreen> {
  // scaffold key for drawer
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // current user data
  Map<String, dynamic>? user;

  // skill input state
  bool addingSkill = false;
  String newSkill = "";

  // field editing state
  String? editingField;
  final TextEditingController _editController = TextEditingController();
  final TextEditingController _skillController = TextEditingController();

  @override
  void initState() {
    super.initState();

    // load user data
    initializeData();
  }

  @override
  void dispose() {
    _skillController.dispose();
    _editController.dispose();
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

  // save updated user to backend
  Future<void> saveUserToAPI(Map<String, dynamic> updatedUser) async {
    final res = await authPut("/api/users/update", updatedUser);

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString("user", jsonEncode(data['user']));

      if (!mounted) return;
      setState(() => user = Map<String, dynamic>.from(data['user'] as Map));
    } else {
      throw Exception("Failed to update profile");
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

  // save personal info changes
  Future<void> handleSavePersonalInfo() async {
    if (user == null) return;

    try {
      await saveUserToAPI(user!);
      _showSnack("Personal info saved!");
    } catch (_) {
      _showSnack("Error saving personal info");
    }
  }

  // save new skill
  Future<void> handleSaveSkill() async {
    final trimmed = newSkill.trim();
    if (trimmed.isEmpty || user == null) return;

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
      await saveUserToAPI({
        ...user!,
        'skills': [...existing, trimmed],
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
      await saveUserToAPI({
        ...user!,
        'skills': updated,
      });
    } catch (e) {
      debugPrint("Error removing skill: $e");
      _showSnack("Error removing skill");
    }
  }

  // show snackbar message
  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
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

  @override
  Widget build(BuildContext context) {
    // loading state
    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

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
                                    onChanged: (val) => newSkill = val,
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
                            OutlinedButton(
                              onPressed: () => setState(() => addingSkill = true),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.green[800],
                                side: BorderSide(color: Colors.green[700]!),
                              ),
                              child: const Text("+ Add Skill"),
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
        currentIndex: 0,
        onTap: (index) {
          if (index == 1) {
            Navigator.pushReplacementNamed(context, "/employerListings");
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