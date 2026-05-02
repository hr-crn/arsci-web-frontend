import {
  Card,
  CardBody,
  Typography,
  IconButton,
  Input,
  Button,
  Tooltip,
} from "@material-tailwind/react";
import { EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import SectionSelect from "@/widgets/sections/SectionSelect";
// Headless UI imports removed; reverting to Material Select

import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";

import { deleteStudentById, deleteStudent, addStudent, editStudent } from "@/api/students";
import FloatingPanel from "@/widgets/layout/FloatingPanel";
import { useAuth } from "@/context/AuthContext"; // <-- Make sure this path is correct
import { ConfirmDialog } from "@/widgets/alerts";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/widgets/layout/PageHeader";
import useStudents from "@/hooks/useStudents";

export function Students() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // <-- Get the logged-in teacher's info
  const { showToast } = useToast();
  const [showArchived, setShowArchived] = useState(false);
  const {
    students,
    sections,
    loading: loadingList,
    searchQuery,
    setSearchQuery,
    selectedSection,
    setSelectedSection,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedStudents,
    reload,
    setStudents,
  } = useStudents(showArchived);

  // FloatingPanel state for Add/Edit
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("add"); // "add" | "edit" | "batch"
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    section: "",
    username: "",
    password: "",
  });
  
  const isAddMode = panelMode === "add";
  const isEditMode = panelMode === "edit";
  const singlePasswordTooShort = (isAddMode || (isEditMode && studentForm.password)) && (studentForm.password?.length || 0) > 0 && studentForm.password.length < 8;

  // Helper: resolve section name by id (for badges)
  const sectionNameById = (id) => {
    if (!id) return "";
    const s = sections.find((sx) => String(sx.section) === String(id));
    return s ? s.sectionName : String(id);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      showToast("Copied to clipboard", "green");
    } catch {
      showToast("Failed to copy", "red");
    }
  };
  const deriveUsername = (firstName, middleName, lastName) => {
    if (!firstName || !lastName) return "";
    const first = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const middleInitial = (middleName || "").charAt(0).toLowerCase();
    const lastInitial = (lastName || "").charAt(0).toLowerCase();
    return middleInitial ? `${first}${middleInitial}${lastInitial}` : `${first}${lastInitial}`;
  };
  const derivePassword = (sectionId, firstName, middleName, lastName) => {
    const s = sections.find((sx) => String(sx.section) === String(sectionId));
    if (!s || !firstName || !lastName) return "";
    const sec = (s.sectionName || "").replace(/\s+/g, "");
    const first = (firstName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const middleInitial = (middleName || "").charAt(0).toLowerCase();
    const lastInitial = (lastName || "").charAt(0).toLowerCase();
    const userPart = middleInitial ? `${first}${middleInitial}${lastInitial}` : `${first}${lastInitial}`;
    return `${sec}${userPart}`;
  };
  const existingUsernames = React.useMemo(() => new Set((students || []).map(s => String(s.username).toLowerCase())), [students]);
  const uniqueUsername = (base, exclude = null) => {
    let candidate = base || "";
    if (!candidate) return "";
    candidate = candidate.toLowerCase();
    if (exclude && candidate === String(exclude).toLowerCase()) return candidate;
    if (!existingUsernames.has(candidate)) return candidate;
    let i = 2;
    while (existingUsernames.has(`${candidate}${i}`)) i += 1;
    return `${candidate}${i}`;
  };
  const [editingStudentID, setEditingStudentID] = useState(null);
  const [originalPassword, setOriginalPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, studentID: null, username: null });

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [rowPassVisible, setRowPassVisible] = useState({}); // { [studentID|username]: boolean }
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [batchShowPassword, setBatchShowPassword] = useState(false);
  
  // Username and password columns visibility
  const [showCredentials, setShowCredentials] = useState(false);

  // Search and pagination state handled by useStudents hook

  // Batch/staging state
  const [batchFirstName, setBatchFirstName] = useState("");
  const [batchLastName, setBatchLastName] = useState("");
  const [batchMiddleName, setBatchMiddleName] = useState("");
  const [batchUsername, setBatchUsername] = useState("");
  const [batchPassword, setBatchPassword] = useState("");
  const [batchSection, setBatchSection] = useState(""); // applies to all
  const [stagedStudents, setStagedStudents] = useState([]); // {firstName, lastName, middleName, username, password}
  const batchPasswordTooShort = (batchPassword?.length || 0) > 0 && batchPassword.length < 8;

  // Edit staged student state
  const [editingStagedStudent, setEditingStagedStudent] = useState(null); // username of student being edited
  const [editStagedForm, setEditStagedForm] = useState({ firstName: "", lastName: "", middleName: "", username: "", password: "" });
  // Auto-generation controls
  const [autoGenEnabled, setAutoGenEnabled] = useState(() => {
    const v = localStorage.getItem("auto_gen_credentials");
    return v === null ? true : v === "true";
  });
  const [autoUser, setAutoUser] = useState(true);
  const [autoPass, setAutoPass] = useState(true);

  // Refs for keyboard navigation in batch mode
  const batchFirstNameRef = useRef(null);
  const batchLastNameRef = useRef(null);
  const batchMiddleNameRef = useRef(null);
  const batchUsernameRef = useRef(null);
  const batchPasswordRef = useRef(null);

  // Data is loaded by useStudents hook

  // Handle URL parameters to auto-open panels
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get('action');

    if (action === 'add-batch') {
      openBatchAddPanel();
      // Clear the URL parameter
      navigate('/dashboard/students', { replace: true });
    }
  }, [location.search, navigate]);

  function handleDeleteStudent(studentID, username) {
    if (!studentID && !username) {
      showToast("Cannot delete: missing student identifier.", "red");
      return;
    }
    setConfirmDelete({ open: true, studentID: studentID || null, username: username || null });
  }

  async function doDeleteStudent() {
    const { studentID, username } = confirmDelete;
    if (!studentID && !username) {
      showToast("Delete failed: invalid student identifier.", "red");
      setConfirmDelete({ open: false, studentID: null, username: null });
      return;
    }
    setLoading(true);
    try {
      await deleteStudent({ username, studentID });
      // Optimistic UI update in case the backend is eventually consistent
      setStudents((prev) => prev.filter((s) => String(s.studentID) !== String(studentID) && String(s.username) !== String(username)));
      await reload();
      showToast("Student deleted successfully.", "green");
    } catch (e) {
      // Fallback: try legacy delete by ID if username-first approach failed and we do have an ID
      if (studentID) {
        try {
          await deleteStudentById(studentID);
          setStudents((prev) => prev.filter((s) => String(s.studentID) !== String(studentID)));
          await reload();
          showToast("Student deleted successfully.", "green");
        } catch (err) {
          showToast("Failed to delete student.", "red");
        }
      } else {
        showToast("Failed to delete student.", "red");
      }
    }
    setLoading(false);
    setConfirmDelete({ open: false, studentID: null, username: null });
  }

  // No batch/staging handlers

  // Open FloatingPanel for adding student
  const openAddStudentPanel = () => {
    setPanelMode("add");
    setStudentForm({ firstName: "", lastName: "", middleName: "", section: "", sectionName: "", username: "", password: "" });
    setEditingStudentID(null);
    setAutoUser(true);
    setAutoPass(true);
    setIsPanelOpen(true);
  };

  // Open FloatingPanel for batch adding students
  const openBatchAddPanel = () => {
    setPanelMode("batch");
    setBatchFirstName("");
    setBatchLastName("");
    setBatchMiddleName("");
    setBatchUsername("");
    setBatchPassword("");
    // Don't reset batchSection and stagedStudents - preserve them
    // setBatchSection("");
    // setStagedStudents([]);
    setIsPanelOpen(true);
  };

  // Open FloatingPanel for editing student
  const openEditStudentPanel = (student) => {
    setPanelMode("edit");
    setStudentForm({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      middleName: student.middleName || "",
      section: student.section || student.sectionID || "",
      sectionName: sectionNameById(student.section || student.sectionID || ""),
      username: student.username,
      // Leave password blank on edit so user can choose to change it
      password: "",
    });
    setOriginalPassword(student.password || "");
    // Prefer the backend apiId if available to address CORS/500 on PUT by username
    setEditingStudentID(student.apiId || student.studentID);
    // Initialize auto flags based on whether values match the derived forms
    const derivedUser = deriveUsername(student.firstName, student.middleName, student.lastName);
    setAutoUser(String(student.username || "").toLowerCase() === String(derivedUser));
    const derivedPass = derivePassword(student.section || student.sectionID || "", student.firstName, student.middleName, student.lastName);
    setAutoPass(!student.password || student.password === derivedPass);
    setIsPanelOpen(true);
  };

  // Handle form submit for both add and edit
  const handlePanelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation: section must be selected
    if ((panelMode === "add" || panelMode === "edit") && !studentForm.section) {
      setLoading(false);
      showToast("Please select a section.", "red");
      return;
    }

    // Validation: password must be at least 8 characters
    if (panelMode === "add" && (!studentForm.password || studentForm.password.length < 8)) {
      setLoading(false);
      showToast("Password must be at least 8 characters.", "red");
      return;
    }
    if (panelMode === "edit" && studentForm.password && studentForm.password.length < 8) {
      setLoading(false);
      showToast("New password must be at least 8 characters.", "red");
      return;
    }

    // Convert studentForm to API format
    const apiPayload = {
      ...studentForm,
      firstName: studentForm.firstName,
      lastName: studentForm.lastName,
      middleName: studentForm.middleName || null,
      sectionID: studentForm.section,
      username: studentForm.username,
      userName: studentForm.username,
      email: user.email, // <-- Make sure this is present!
    };
    delete apiPayload.section;

    // If editing and password is blank, include the original password (backend requires it in UpdateExpression)
    if (panelMode === "edit" && !apiPayload.password) {
      apiPayload.password = originalPassword || "";
    }

    // Submit payload (debug logging removed)

    if (panelMode === "add") {
      // Ensure auto defaults if teacher left fields blank
      if (!apiPayload.username) apiPayload.username = deriveUsername(studentForm.firstName, studentForm.middleName, studentForm.lastName);
      if (!apiPayload.password) apiPayload.password = derivePassword(apiPayload.sectionID, apiPayload.firstName, apiPayload.middleName, apiPayload.lastName);
      const success = await addStudent(apiPayload);
      if (success) {
        await reload();
        closePanel();
      }
    } else if (panelMode === "edit" && editingStudentID) {
      const success = await editStudent(editingStudentID, apiPayload);
      if (success) {
        await reload();
        closePanel();
      }
    } else if (panelMode === "batch") {
      // Submit all staged students with the selected section
      try {
        // Validate all staged passwords
        const anyShort = stagedStudents.some((s) => !s.password || s.password.length < 8);
        if (anyShort) {
          showToast("All staged students must have passwords with at least 8 characters.", "red");
          setLoading(false);
          return;
        }
        // Validate section selection for batch add
        if (!batchSection) {
          showToast("Please select a section for all staged students.", "red");
          setLoading(false);
          return;
        }
        const tasks = stagedStudents.map((s) => {
          const payload = {
            firstName: s.firstName,
            lastName: s.lastName,
            middleName: s.middleName || null,
            username: s.username || uniqueUsername(deriveUsername(s.firstName, s.middleName, s.lastName)),
            userName: s.username,
            sectionID: batchSection || "",
            email: user.email,
            password: s.password || derivePassword(batchSection, s.firstName, s.middleName, s.lastName),
          };
          return addStudent(payload);
        });
        const results = await Promise.allSettled(tasks);
        await reload();
        // Clear staged students after successful batch addition
        setStagedStudents([]);
        setBatchSection("");
        closePanel();
      } catch (err) {
        console.error("Batch add failed", err);
      }
    }
    setLoading(false);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setStudentForm({
      firstName: "",
      lastName: "",
      middleName: "",
      section: "",
      sectionName: "",
      username: "",
      password: "",
    });
    setEditingStudentID(null);
    setPanelMode("add");
    setBatchFirstName("");
    setBatchLastName("");
    setBatchMiddleName("");
    setBatchUsername("");
    setBatchPassword("");
    // Don't clear batchSection and stagedStudents - preserve them
    // setBatchSection("");
    // setStagedStudents([]);
    setEditingStagedStudent(null);
    setEditStagedForm({ firstName: "", lastName: "", middleName: "", username: "", password: "" });
  };

  // Handlers for batch staging
  const handleAddToStaged = () => {
    if (!batchFirstName.trim() || !batchLastName.trim() || !batchUsername.trim() || !batchPassword.trim()) return;
    if (batchPassword.trim().length < 8) return;
    setStagedStudents((prev) => [
      ...prev,
      { 
        firstName: batchFirstName.trim(), 
        lastName: batchLastName.trim(), 
        middleName: batchMiddleName.trim() || null,
        username: batchUsername.trim(), 
        password: batchPassword.trim() 
      },
    ]);
    setBatchFirstName("");
    setBatchLastName("");
    setBatchMiddleName("");
    setBatchUsername("");
    setBatchPassword("");
  };

  const handleRemoveStaged = (username) => {
    setStagedStudents((prev) => prev.filter((s) => s.username !== username));
  };

  // Handle editing staged student
  const handleEditStagedStudent = (student) => {
    setEditingStagedStudent(student.username);
    setEditStagedForm({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName || "",
      username: student.username,
      password: student.password
    });
  };

  // Save edited staged student
  const handleSaveEditedStaged = () => {
    if (!editStagedForm.firstName.trim() || !editStagedForm.lastName.trim() || !editStagedForm.username.trim() || !editStagedForm.password.trim()) return;
    
    setStagedStudents((prev) => 
      prev.map((s) => 
        s.username === editingStagedStudent 
          ? { 
              firstName: editStagedForm.firstName.trim(), 
              lastName: editStagedForm.lastName.trim(), 
              middleName: editStagedForm.middleName.trim() || null,
              username: editStagedForm.username.trim(), 
              password: editStagedForm.password.trim() 
            }
          : s
      )
    );
    setEditingStagedStudent(null);
    setEditStagedForm({ firstName: "", lastName: "", middleName: "", username: "", password: "" });
  };

  // Cancel editing staged student
  const handleCancelEditStaged = () => {
    setEditingStagedStudent(null);
    setEditStagedForm({ firstName: "", lastName: "", middleName: "", username: "", password: "" });
  };

  // Clear all staged students
  const handleClearAllStaged = () => {
    setStagedStudents([]);
    setBatchSection("");
    setEditingStagedStudent(null);
    setEditStagedForm({ firstName: "", lastName: "", middleName: "", username: "", password: "" });
  };

  // Handle keyboard navigation in batch mode
  const handleBatchKeyDown = (e, currentField) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentField === 'firstName' && batchMiddleNameRef.current) {
        batchMiddleNameRef.current.focus();
      } else if (currentField === 'middleName' && batchLastNameRef.current) {
        batchLastNameRef.current.focus();
      } else if (currentField === 'lastName' && batchUsernameRef.current) {
        batchUsernameRef.current.focus();
      } else if (currentField === 'username' && batchPasswordRef.current) {
        batchPasswordRef.current.focus();
      } else if (currentField === 'password' && batchFirstNameRef.current) {
        // If all required fields are filled, add to list and focus back to firstName
        if (batchFirstName.trim() && batchLastName.trim() && batchUsername.trim() && batchPassword.trim()) {
          handleAddToStaged();
          setTimeout(() => batchFirstNameRef.current?.focus(), 100);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentField === 'middleName' && batchFirstNameRef.current) {
        batchFirstNameRef.current.focus();
      } else if (currentField === 'lastName' && batchMiddleNameRef.current) {
        batchMiddleNameRef.current.focus();
      } else if (currentField === 'username' && batchLastNameRef.current) {
        batchLastNameRef.current.focus();
      } else if (currentField === 'password' && batchUsernameRef.current) {
        batchUsernameRef.current.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (batchFirstName.trim() && batchLastName.trim() && batchUsername.trim() && batchPassword.trim()) {
        handleAddToStaged();
        setTimeout(() => batchFirstNameRef.current?.focus(), 100);
      }
    }
  };

  // Search and pagination are provided by useStudents hook

  return (
    <div className="max-w-6xl mx-auto mt-10 mb-16 flex flex-col gap-10">
      <FloatingPanel
        open={isPanelOpen}

        onClose={closePanel}
        title={panelMode === "add" ? "Add Student" : panelMode === "edit" ? "Edit Student" : "Add Student"}
        size={panelMode === "batch" ? "xl" : "md"}
        actions={<Button className="bg-blue-600" onClick={closePanel} disabled={loading}>Close</Button>}
      >
        {panelMode !== "batch" ? (
          <form onSubmit={handlePanelSubmit} className="grid grid-cols-1 gap-4">
            {/* Auto-generation master toggle */}
            <div className="-mb-2 flex items-center gap-3">
              <input
                id="auto-gen-toggle"
                type="checkbox"
                checked={autoGenEnabled}
                onChange={(e) => { setAutoGenEnabled(e.target.checked); localStorage.setItem("auto_gen_credentials", String(e.target.checked)); }}
                className="h-4 w-4 accent-blue-600"
              />
              <label htmlFor="auto-gen-toggle" className="text-sm text-gray-700 select-none">Auto-generate username & password</label>
            </div>

            <div className="relative">
              <input
                className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                value={studentForm.firstName}
                onChange={(e) => {
                  const newFirstName = e.target.value;
                  setStudentForm((prev) => {
                    const prevDerivedUser = deriveUsername(prev.firstName, prev.middleName, prev.lastName);
                    const shouldUpdateUsername = autoGenEnabled && autoUser && (!prev.username || prev.username === prevDerivedUser);
                    const baseUser = deriveUsername(newFirstName, prev.middleName, prev.lastName);
                    const nextUsername = shouldUpdateUsername ? uniqueUsername(baseUser) : prev.username;
                    const prevDerivedPass = derivePassword(prev.section, prev.firstName, prev.middleName, prev.lastName);
                    const shouldUpdatePassword = autoGenEnabled && autoPass && (!prev.password || prev.password === prevDerivedPass);
                    const nextPassword = shouldUpdatePassword ? derivePassword(prev.section, newFirstName, prev.middleName, prev.lastName) : prev.password;
                    return { ...prev, firstName: newFirstName, username: nextUsername, password: nextPassword };
                  });
                }}
                disabled={loading || !studentForm.section}
                aria-required="true"
              />
              {(!studentForm.firstName || studentForm.firstName.length === 0) && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                  <span>First Name</span><span className="text-red-500">*</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                value={studentForm.middleName}
                onChange={(e) => {
                  const newMiddleName = e.target.value;
                  setStudentForm((prev) => {
                    const prevDerivedUser = deriveUsername(prev.firstName, prev.middleName, prev.lastName);
                    const shouldUpdateUsername = autoGenEnabled && autoUser && (!prev.username || prev.username === prevDerivedUser);
                    const baseUser = deriveUsername(prev.firstName, newMiddleName, prev.lastName);
                    const nextUsername = shouldUpdateUsername ? uniqueUsername(baseUser) : prev.username;
                    const prevDerivedPass = derivePassword(prev.section, prev.firstName, prev.middleName, prev.lastName);
                    const shouldUpdatePassword = autoGenEnabled && autoPass && (!prev.password || prev.password === prevDerivedPass);
                    const nextPassword = shouldUpdatePassword ? derivePassword(prev.section, prev.firstName, newMiddleName, prev.lastName) : prev.password;
                    return { ...prev, middleName: newMiddleName, username: nextUsername, password: nextPassword };
                  });
                }}
                disabled={loading || !studentForm.section}
              />
              {(!studentForm.middleName || studentForm.middleName.length === 0) && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                  <span>Middle Name</span><span className="text-gray-400"> (Optional)</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                value={studentForm.lastName}
                onChange={(e) => {
                  const newLastName = e.target.value;
                  setStudentForm((prev) => {
                    const prevDerivedUser = deriveUsername(prev.firstName, prev.middleName, prev.lastName);
                    const shouldUpdateUsername = autoGenEnabled && autoUser && (!prev.username || prev.username === prevDerivedUser);
                    const baseUser = deriveUsername(prev.firstName, prev.middleName, newLastName);
                    const nextUsername = shouldUpdateUsername ? uniqueUsername(baseUser) : prev.username;
                    const prevDerivedPass = derivePassword(prev.section, prev.firstName, prev.middleName, prev.lastName);
                    const shouldUpdatePassword = autoGenEnabled && autoPass && (!prev.password || prev.password === prevDerivedPass);
                    const nextPassword = shouldUpdatePassword ? derivePassword(prev.section, prev.firstName, prev.middleName, newLastName) : prev.password;
                    return { ...prev, lastName: newLastName, username: nextUsername, password: nextPassword };
                  });
                }}
                disabled={loading || !studentForm.section}
                aria-required="true"
              />
              {(!studentForm.lastName || studentForm.lastName.length === 0) && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                  <span>Last Name</span><span className="text-red-500">*</span>
                </span>
              )}
            </div>
            {/* Section selector (reusable) */}
            <SectionSelect
              label="Section *"
              value={studentForm.section}
              onChange={(val) => {
                const s = sections.find((sec) => String(sec.section) === String(val));
                setStudentForm((prev) => {
                  const nextSection = val || "";
                  const prevDerivedPass = derivePassword(prev.section, prev.firstName, prev.middleName, prev.lastName);
                  const shouldUpdatePassword = autoGenEnabled && autoPass && (!prev.password || prev.password === prevDerivedPass);
                  const nextPassword = shouldUpdatePassword ? derivePassword(nextSection, prev.firstName, prev.middleName, prev.lastName) : prev.password;
                  return { ...prev, section: nextSection, sectionName: s ? s.sectionName : "", password: nextPassword };
                });
              }}
              sections={sections}
              loading={loadingList}
              disabled={loading}
              required
            />
            {!studentForm.section && (
              <Typography variant="small" className="text-red-500 -mt-1">
                Please select a section before entering student details.
              </Typography>
            )}
            <div className="relative">
              <input
                className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                value={studentForm.username}
                onChange={(e) => {
                  const newUsername = e.target.value.toLowerCase();
                  setStudentForm((prev) => {
                    const sanitized = newUsername.replace(/[^a-z0-9]/g, "");
                    const unique = autoGenEnabled ? uniqueUsername(sanitized, prev.username) : sanitized;
                    const prevDerivedPass = derivePassword(prev.section, prev.firstName, prev.middleName, prev.lastName);
                    const shouldUpdatePassword = autoGenEnabled && autoPass && (!prev.password || prev.password === prevDerivedPass);
                    const nextPassword = shouldUpdatePassword ? derivePassword(prev.section, prev.firstName, prev.middleName, prev.lastName) : prev.password;
                    return { ...prev, username: unique, password: nextPassword };
                  });
                }}
                disabled={loading}
                aria-required="true"
              />
              {(!studentForm.username || studentForm.username.length === 0) && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                  <span>Username</span><span className="text-red-500">*</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                value={studentForm.password}
                onChange={(e) => setStudentForm((prev) => ({ ...prev, password: e.target.value }))}
                disabled={loading || !studentForm.section}
                aria-required={panelMode !== "edit"}
                placeholder={panelMode === "edit" ? "" : ""}
              />
              {(!studentForm.password || studentForm.password.length === 0) && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                  <span>{panelMode === "edit" ? "Password (leave blank to keep)" : "Password"}</span>
                  {panelMode !== "edit" && <span className="text-red-500">*</span>}
                </span>
              )}
            </div>
            <div className="-mt-2 flex items-center gap-3">
              <button type="button" className="flex items-center gap-1 text-xs text-gray-700 hover:text-blue-600" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />} {showPassword ? "Hide" : "View"} password
              </button>
              <button type="button" className="flex items-center gap-1 text-xs text-gray-700 hover:text-blue-600" onClick={() => copyText(studentForm.password)}>
                <ClipboardDocumentIcon className="w-4 h-4" /> Copy password
              </button>
            </div>
            {(!autoPass || !autoGenEnabled) && (
              <div className="-mt-2 text-xs text-gray-600">
                Auto suggestion: <span className="font-mono">{derivePassword(studentForm.section, studentForm.firstName, studentForm.middleName, studentForm.lastName) || "(select section to enable)"}</span>
                {" "}
                <button
                  type="button"
                  className="ml-2 text-blue-600 hover:underline"
                  onClick={() => {
                    setAutoPass(true);
                    setStudentForm((prev) => ({ ...prev, password: derivePassword(prev.section, prev.firstName, prev.middleName, prev.lastName) }));
                  }}
                >
                  Use
                </button>
              </div>
            )}
            {singlePasswordTooShort && (
              <Typography variant="small" className="text-red-500 -mt-2">
                Password must be at least 8 characters.
              </Typography>
            )}
            <div className="flex justify-end">
              <Button type="submit" color="blue" disabled={loading || loadingList || sections.length === 0 || singlePasswordTooShort || !studentForm.section}>
                {loading ? (panelMode === "add" ? "Adding..." : "Saving...") : panelMode === "add" ? "Add Student" : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Enhanced staged list */}
            <div className="space-y-4 h-full">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <Typography variant="h6" className="text-gray-800 font-semibold">
                          Students to Add ({stagedStudents.length})
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section selector */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                  <SectionSelect
                    label="📚 Assign Section to All"
                    value={batchSection}
                    onChange={(val) => setBatchSection(val || "")}
                    sections={sections}
                    loading={loadingList}
                    disabled={loading}
                    allowNone
                    noneLabel="Select section"
                    required
                  />
                </div>

                {/* Students list */}
                <div className="p-4 space-y-3 overflow-y-auto h-[450px]">
                  {stagedStudents.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0" />
                      </svg>
                      <Typography variant="small" className="text-gray-500 font-medium">No students in the list yet</Typography>
                      <Typography variant="small" className="text-gray-400">Add students using the form on the left</Typography>
                    </div>
                  )}
                  {stagedStudents.map((s) => (
                  <div
                    key={s.username}
                    className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-3 shadow-sm hover:bg-purple-100/50 transition-colors"
                  >
                    {editingStagedStudent === s.username ? (
                      // Edit mode
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            size="sm"
                            label="First Name"
                            value={editStagedForm.firstName}
                            onChange={(e) => setEditStagedForm(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                          <Input
                            size="sm"
                            label="Last Name"
                            value={editStagedForm.lastName}
                            onChange={(e) => setEditStagedForm(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                          <Input
                            size="sm"
                            label="Middle Name (Optional)"
                            value={editStagedForm.middleName}
                            onChange={(e) => setEditStagedForm(prev => ({ ...prev, middleName: e.target.value }))}
                          />
                          <Input
                            size="sm"
                            label="Username"
                            value={editStagedForm.username}
                            onChange={(e) => setEditStagedForm(prev => ({ ...prev, username: e.target.value }))}
                          />
                          <Input
                            size="sm"
                            label="Password"
                            type="password"
                            value={editStagedForm.password}
                            onChange={(e) => setEditStagedForm(prev => ({ ...prev, password: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="text" color="gray" onClick={handleCancelEditStaged}>
                            Cancel
                          </Button>
                          <Button size="sm" color="green" onClick={handleSaveEditedStaged}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-arsci-navy to-arsci-purple text-white text-sm font-semibold">
                            {s.firstName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div 
                              className="font-semibold text-blue-gray-800 cursor-pointer hover:text-arsci-pink hover:underline"
                              onClick={() => handleEditStagedStudent(s)}
                              title="Click to edit"
                            >
                              {(() => {
                                const middleInitial = s.middleName ? s.middleName.charAt(0) + "." : "";
                                return [s.firstName, middleInitial, s.lastName].filter(Boolean).join(' ');
                              })()}
                            </div>
                            <div className="text-xs text-blue-gray-500">@{s.username}</div>
                            <div className="text-[10px] text-blue-gray-400">Password: {s.password ? '********' : ''}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {batchSection && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              {sectionNameById(batchSection)}
                            </span>
                          )}
                          <Button variant="text" color="red" onClick={() => handleRemoveStaged(s.username)} disabled={loading}>
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  ))}
                </div>

                {/* Submit button */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                  {stagedStudents.length > 0 && (
                    <Button 
                      variant="outlined" 
                      color="red" 
                      onClick={handleClearAllStaged}
                      disabled={loading}
                      className="hover:bg-red-50 transition-colors duration-200 min-w-[100px]"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button 
                    className="flex-1 arsci-btn-gradient rounded-xl shadow-md hover:shadow-lg" 
                    onClick={handlePanelSubmit} 
                    disabled={loading || stagedStudents.length === 0 || !batchSection}
                    size="lg"
                  >
                    {loading ? "Saving..." : `Add All ${stagedStudents.length} Students`}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Enhanced add form (only visible if section is selected) */}
            {batchSection && (
              <div className="space-y-6 h-full">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-purple-100 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <Typography variant="h6" className="text-gray-800 font-semibold">
                      Add Student
                    </Typography>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="-mb-2 flex items-center gap-3">
                    <input
                      id="auto-gen-toggle-batch"
                      type="checkbox"
                      checked={autoGenEnabled}
                      onChange={(e) => { setAutoGenEnabled(e.target.checked); localStorage.setItem("auto_gen_credentials", String(e.target.checked)); }}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <label htmlFor="auto-gen-toggle-batch" className="text-sm text-gray-700 select-none">Auto-generate username & password</label>
                  </div>
                  <div className="relative">
                    <input
                      ref={batchFirstNameRef}
                      className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                      value={batchFirstName}
                      onChange={(e) => {
                        const newFirstName = e.target.value;
                        const prevDerivedUser = deriveUsername(batchFirstName, batchMiddleName, batchLastName);
                        const shouldUpdateUser = autoGenEnabled && (!batchUsername || batchUsername === prevDerivedUser);
                        const nextUsername = shouldUpdateUser ? uniqueUsername(deriveUsername(newFirstName, batchMiddleName, batchLastName)) : batchUsername;
                        const prevDerivedPass = derivePassword(batchSection, batchFirstName, batchMiddleName, batchLastName);
                        const shouldUpdatePass = autoGenEnabled && (!batchPassword || batchPassword === prevDerivedPass);
                        const nextPassword = shouldUpdatePass ? derivePassword(batchSection, newFirstName, batchMiddleName, batchLastName) : batchPassword;
                        setBatchFirstName(newFirstName);
                        setBatchUsername(nextUsername);
                        setBatchPassword(nextPassword);
                      }}
                      onKeyDown={(e) => handleBatchKeyDown(e, 'firstName')}
                      disabled={loading || !batchSection}
                      aria-required="true"
                    />
                    {(!batchFirstName || batchFirstName.length === 0) && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                        <span>First Name</span><span className="text-red-500">*</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      ref={batchMiddleNameRef}
                      className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                      value={batchMiddleName}
                      onChange={(e) => {
                        const newMiddleName = e.target.value;
                        const prevDerivedUser = deriveUsername(batchFirstName, batchMiddleName, batchLastName);
                        const shouldUpdateUser = autoGenEnabled && (!batchUsername || batchUsername === prevDerivedUser);
                        const nextUsername = shouldUpdateUser ? uniqueUsername(deriveUsername(batchFirstName, newMiddleName, batchLastName)) : batchUsername;
                        const prevDerivedPass = derivePassword(batchSection, batchFirstName, batchMiddleName, batchLastName);
                        const shouldUpdatePass = autoGenEnabled && (!batchPassword || batchPassword === prevDerivedPass);
                        const nextPassword = shouldUpdatePass ? derivePassword(batchSection, batchFirstName, newMiddleName, batchLastName) : batchPassword;
                        setBatchMiddleName(newMiddleName);
                        setBatchUsername(nextUsername);
                        setBatchPassword(nextPassword);
                      }}
                      onKeyDown={(e) => handleBatchKeyDown(e, 'middleName')}
                      disabled={loading || !batchSection}
                    />
                    {(!batchMiddleName || batchMiddleName.length === 0) && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                        <span>Middle Name</span><span className="text-gray-400"> (Optional)</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      ref={batchLastNameRef}
                      className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                      value={batchLastName}
                      onChange={(e) => {
                        const newLastName = e.target.value;
                        const prevDerivedUser = deriveUsername(batchFirstName, batchMiddleName, batchLastName);
                        const shouldUpdateUser = autoGenEnabled && (!batchUsername || batchUsername === prevDerivedUser);
                        const nextUsername = shouldUpdateUser ? uniqueUsername(deriveUsername(batchFirstName, batchMiddleName, newLastName)) : batchUsername;
                        const prevDerivedPass = derivePassword(batchSection, batchFirstName, batchMiddleName, batchLastName);
                        const shouldUpdatePass = autoGenEnabled && (!batchPassword || batchPassword === prevDerivedPass);
                        const nextPassword = shouldUpdatePass ? derivePassword(batchSection, batchFirstName, batchMiddleName, newLastName) : batchPassword;
                        setBatchLastName(newLastName);
                        setBatchUsername(nextUsername);
                        setBatchPassword(nextPassword);
                      }}
                      onKeyDown={(e) => handleBatchKeyDown(e, 'lastName')}
                      disabled={loading || !batchSection}
                      aria-required="true"
                    />
                    {(!batchLastName || batchLastName.length === 0) && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                        <span>Last Name</span><span className="text-red-500">*</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      ref={batchUsernameRef}
                      className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                      value={batchUsername}
                      onChange={(e) => {
                        const raw = e.target.value.toLowerCase();
                        const sanitized = raw.replace(/[^a-z0-9]/g, "");
                        const unique = autoGenEnabled ? uniqueUsername(sanitized, batchUsername) : sanitized;
                        const prevDerivedPass = derivePassword(batchSection, batchFirstName, batchMiddleName, batchLastName);
                        const shouldUpdatePass = autoGenEnabled && (!batchPassword || batchPassword === prevDerivedPass);
                        const nextPassword = shouldUpdatePass ? derivePassword(batchSection, batchFirstName, batchMiddleName, batchLastName) : batchPassword;
                        setBatchUsername(unique);
                        setBatchPassword(nextPassword);
                      }}
                      onKeyDown={(e) => handleBatchKeyDown(e, 'username')}
                      disabled={loading}
                      aria-required="true"
                    />
                    {(!batchUsername || batchUsername.length === 0) && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                        <span>Username</span><span className="text-red-500">*</span>
                      </span>
                    )}
                  </div>
                  {/* Batch username suggestion */}
                  {(() => {
                    const suggestedUser = uniqueUsername(deriveUsername(batchFirstName, batchMiddleName, batchLastName));
                    const show = suggestedUser && suggestedUser !== batchUsername;
                    return show ? (
                      <div className="-mt-2 text-xs text-gray-600">
                        Suggested username: <span className="font-mono">{suggestedUser}</span>
                        {" "}
                        <button
                          type="button"
                          className="ml-2 text-blue-600 hover:underline"
                          onClick={() => setBatchUsername(suggestedUser)}
                        >
                          Use
                        </button>
                      </div>
                    ) : null;
                  })()}
                  <div className="relative">
                    <input
                      ref={batchPasswordRef}
                      type={batchShowPassword ? "text" : "password"}
                      className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                      value={batchPassword}
                      onChange={(e) => setBatchPassword(e.target.value)}
                      onKeyDown={(e) => handleBatchKeyDown(e, 'password')}
                      disabled={loading || !batchSection}
                      aria-required="true"
                    />
                    {(!batchPassword || batchPassword.length === 0) && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                        <span>Password</span><span className="text-red-500">*</span>
                      </span>
                    )}
                  </div>
                  <div className="-mt-2">
                    <button type="button" className="flex items-center gap-1 text-xs text-gray-700 hover:text-blue-600" onClick={() => setBatchShowPassword((v) => !v)}>
                      {batchShowPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />} {batchShowPassword ? "Hide" : "View"} password
                    </button>
                  </div>
                  {/* Batch password suggestion */}
                  {(() => {
                    const suggestedUser = batchUsername || uniqueUsername(deriveUsername(batchFirstName, batchMiddleName, batchLastName));
                    const suggestedPass = derivePassword(batchSection, batchFirstName, batchMiddleName, batchLastName);
                    const show = !!suggestedPass && suggestedPass !== batchPassword;
                    return show ? (
                      <div className="-mt-2 text-xs text-gray-600">
                        Auto suggestion: <span className="font-mono">{suggestedPass}</span>
                        {" "}
                        <button
                          type="button"
                          className="ml-2 text-blue-600 hover:underline"
                          onClick={() => setBatchPassword(suggestedPass)}
                        >
                          Use
                        </button>
                      </div>
                    ) : null;
                  })()}
                  {batchPasswordTooShort && (
                    <Typography variant="small" className="text-red-500 -mt-2">
                      Password must be at least 8 characters.
                    </Typography>
                  )}
                  <Button 
                    className="w-full arsci-btn-gradient rounded-xl shadow-md hover:shadow-lg" 
                    onClick={handleAddToStaged} 
                    disabled={loading || !batchSection || !batchFirstName.trim() || !batchLastName.trim() || !batchUsername.trim() || !batchPassword.trim() || batchPasswordTooShort}
                    size="lg"
                  >
                    Add to List
                  </Button>
                </div>
              </div>
            </div>
            )}
          </div>
        )}
      </FloatingPanel>

      <Card>
        <PageHeader
          title="Students"
          subtitle="Manage your students and sections"
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          )}
        />
        <CardBody className="overflow-x-scroll px-0 pt-4 pb-2">
          <div className="px-6 mb-4 flex flex-col md:flex-row items-start md:items-center gap-4 relative z-[1200]">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  className="w-full rounded-lg border bg-white py-2.5 pl-3 pr-3 text-sm text-blue-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-blue-gray-200 hover:border-blue-400 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder=""
                  aria-label="Search students"
                />
                {(!searchQuery || searchQuery.length === 0) && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-gray-500">
                    Search students...
                  </span>
                )}
              </div>
            </div>
            <div className="w-full md:w-auto flex gap-3 items-center">
              <div className="students-filter relative z-[1200] w-72">
                <SectionSelect
                  value={selectedSection}
                  onChange={(val) => {
                    setSelectedSection(val || "");
                    setCurrentPage(1);
                  }}
                  sections={sections}
                  loading={loadingList}
                  allowNone
                  noneLabel="All sections"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={!!showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Show archived
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={showCredentials}
                  onChange={(e) => setShowCredentials(e.target.checked)}
                />
                Show credentials
              </label>
            </div>
          </div>
          <div className="overflow-hidden">
            <table className="w-full min-w-[640px] table-auto">
              <thead className="bg-gray-50/80">
                <tr>
                  {[
                    { key: "STUDENTNAME", label: "Student Name", visible: true },
                    { key: "SECTION", label: "Section", visible: true },
                    { key: "USERNAME", label: "Username", visible: showCredentials },
                    { key: "PASSWORD", label: "Password", visible: showCredentials },
                    { key: "STATUS", label: "Status", visible: true },
                    { key: "ACTIONS", label: "Actions", visible: true }
                  ].filter(col => col.visible).map((col) => (
                    <th key={col.key} className="border-b border-gray-200 py-4 px-6 text-left">
                      <Typography
                        variant="small"
                        className="text-xs font-bold uppercase text-gray-600 tracking-wider"
                      >
                        {col.label}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.map(
                  (student, key) => {
                    const { studentID, firstName, lastName, middleName, username, password, section, archived } = student;
                    
                    // Find section obj (string-safe compare)
                    const sectionObj = sections.find((s) => String(s.section) === String(section));
                    // Effective archived = student archived OR section archived
                    const archivedEffective = Boolean(archived || sectionObj?.archived);
                    const className = `py-4 px-6 hover:bg-blue-50/50 transition-colors duration-200 ${
                      key % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    } ${archivedEffective ? "opacity-60" : ""}`;

                    // Section name (empty if deleted)
                    const sectionName = sectionObj ? sectionObj.sectionName : "";
                    
                    // Construct full name from firstName, middleName, lastName
                    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

                  return (
                    <tr key={studentID || username}>
                      <td className={className}>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold"
                        >
                          {fullName}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {sectionName}
                        </Typography>
                      </td>
                      {showCredentials && (
                        <td className={className}>
                          <div className="flex items-center gap-2">
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {username}
                            </Typography>
                            <button type="button" className="text-gray-500 hover:text-blue-600" title="Copy username" onClick={() => copyText(username)}>
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                      {showCredentials && (
                        <td className={className}>
                          <div className="flex items-center gap-2">
                            <Typography className="text-xs font-semibold text-blue-gray-600 font-mono">
                              {(showAllPasswords || rowPassVisible[studentID || username]) ? (password || "") : "********"}
                            </Typography>
                            <button
                              type="button"
                              className="text-gray-500 hover:text-blue-600"
                              title={(showAllPasswords || rowPassVisible[studentID || username]) ? "Hide password" : "View password"}
                              onClick={() => setRowPassVisible((m) => ({ ...m, [studentID || username]: !m[studentID || username] }))}
                            >
                              {(showAllPasswords || rowPassVisible[studentID || username]) ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                            <button type="button" className="text-gray-500 hover:text-blue-600" title="Copy password" onClick={() => copyText(password)}>
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                      <td className={className}>
                        {archivedEffective ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Archived</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">Active</span>
                        )}
                      </td>
                      <td className={className}>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Edit student">
                            <button
                              type="button"
                              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                              aria-label="Edit student"
                              onClick={() =>
                                openEditStudentPanel({
                                  studentID,
                                  firstName,
                                  lastName,
                                  middleName,
                                  section,
                                  username,
                                  password,
                                })
                              }
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete student">
                            <button
                              type="button"
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              aria-label="Delete student"
                              onClick={() => handleDeleteStudent(studentID, username)}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-end items-center gap-2 mt-4">
            <div className="flex justify-center items-center gap-2 w-full">
              <button
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="mx-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* Confirm delete student */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
        onConfirm={doDeleteStudent}
        onCancel={() => setConfirmDelete({ open: false, studentID: null })}
      />
    </div>
  );
}

export default Students;
