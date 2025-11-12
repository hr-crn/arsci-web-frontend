
import {
  Card,
  CardBody,
  Avatar,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import {
  PencilIcon,
} from "@heroicons/react/24/solid";

import { ProfileInfoCard} from "@/widgets/cards";
import FloatingPanel from "@/widgets/layout/FloatingPanel";
import PageHeader from "@/widgets/layout/PageHeader";
import AlertMessage from "@/widgets/alerts/alertmessage";
import { fetchTeacherByEmail, editTeacher } from "@/api/teachers";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";

export function Profile() {
  const { user, login } = useAuth();
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    profilePicture: user?.profilePicture || null
  });
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  const handleEditOpen = () => {
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      profilePicture: user?.profilePicture || null
    });
    setIsEditPanelOpen(true);
  };

  const handleEditClose = () => {
    setIsEditPanelOpen(false);
    setSelectedProfileImage(null);
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedProfileImage(file);
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditForm(prev => ({ ...prev, profilePicture: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('profile-image-input').click();
  };

  const [alert, setAlert] = useState({ open: false, message: "", color: "blue" });

  // Listen for token invalidation and redirect to login
  React.useEffect(() => {
    const handleTokenInvalid = () => {
      setAlert({ open: true, message: "Session expired. Please login again.", color: "red" });
      setTimeout(() => {
        window.location.href = "/auth/sign-in";
      }, 1500);
    };
    window.addEventListener("tokenInvalid", handleTokenInvalid);
    return () => {
      window.removeEventListener("tokenInvalid", handleTokenInvalid);
    };
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update teacher info in backend
      await editTeacher(user.email, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
      });
      
      // Save profile picture separately to survive logout
      if (editForm.profilePicture) {
        localStorage.setItem("userProfilePicture", editForm.profilePicture);
      }
      
      // Fetch updated info and update context/localStorage
      const updatedUser = await fetchTeacherByEmail(user.email);
      const newUserData = {
        ...user,
        ...updatedUser,
        profilePicture: editForm.profilePicture // Save the profile picture
      };
      login(localStorage.getItem("token"), newUserData);
      setAlert({ open: true, message: "Profile updated successfully!", color: "green" });
      setIsEditPanelOpen(false);
      setSelectedProfileImage(null);
    } catch (err) {
      if (err.message && err.message.includes("Unauthorized")) {
        // Token invalid, handled by global event
        return;
      }
      setAlert({ open: true, message: "Failed to update profile.", color: "red" });
    }
  };

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 flex flex-col gap-10">
      <Card className="bg-white rounded-2xl border border-gray-100 shadow-lg">
        <PageHeader
          title="Profile"
          subtitle="Your account details and personal information"
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          )}
        />
        <CardBody className="px-6 pt-0 pb-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <Avatar
                  src={user?.profilePicture || localStorage.getItem("userProfilePicture") || "/img/bruce-mars.jpeg"}
                  alt={fullName || "Profile"}
                  size="lg"
                  variant="rounded"
                  className="rounded-xl border-2 border-gray-200"
                />
                <div className="mt-2">
                  <Typography variant="h5" color="blue-gray" className="mb-1 font-bold">
                    {fullName}
                  </Typography>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <Typography variant="small" className="font-medium text-gray-600">
                      {user?.email}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      Teacher
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEditOpen}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="font-medium">Edit Profile</span>
              </button>
            </div>

            {/* Removed duplicate Profile Information card */}
          </CardBody>
      </Card>

      <FloatingPanel
        open={isEditPanelOpen}
        onClose={handleEditClose}
        title="Edit Profile"
        actions={
          <Button color="blue" onClick={handleEditClose} type="button">Close</Button>
        }
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          {/* Profile Picture Section */}
          <div className="mb-4">
            <Typography variant="small" className="font-semibold text-gray-700 mb-3">
              Profile Picture
            </Typography>
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedProfileImage ? URL.createObjectURL(selectedProfileImage) : (user?.profilePicture || "/img/bruce-mars.jpeg")}
                alt="profile preview"
                size="lg"
                variant="rounded"
                className="rounded-xl border-2 border-gray-200"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Change Picture
                </button>
                {selectedProfileImage && (
                  <Typography variant="small" className="text-gray-600 text-xs">
                    {selectedProfileImage.name}
                  </Typography>
                )}
              </div>
            </div>
            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
          </div>

          <Input
            label="First Name"
            value={editForm.firstName}
            onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
          />
          <Input
            label="Last Name"
            value={editForm.lastName}
            onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
          />
          <Button color="blue" type="submit">Save Changes</Button>
        </form>
      </FloatingPanel>

      {/* Alert message for profile update */}
      {alert.open && (
        <AlertMessage
          message={alert.message}
          type={alert.color}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      )}
    </div>
  );
}

export default Profile;
