import React, { useState,useEffect } from "react";
import { Input, Button, Typography, Card, CardBody } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../../widgets/alerts/alertmessage.jsx";


export function SignUp() {
  const [alert, setAlert] = useState({ open: false, message: "", color: "blue" });
  const [firstName, setFirstName] = useState("");
  const [firstNameTouched, setFirstNameTouched] = useState(false);

  const [lastName, setLastName] = useState("");
  const [lastNameTouched, setLastNameTouched] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard/home"); // change to your dashboard route
    }
  }, [navigate]);

  const validatePassword = (pwd) => {
    setPasswordValidations({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      specialChar: /[^A-Za-z0-9]/.test(pwd),
    });
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

  if (!firstName.trim()) {
  setAlert({ open: true, message: "First name is required", color: "red" });
  return;
}
if (!lastName.trim()) {
  setAlert({ open: true, message: "Last name is required", color: "red" });
  return;
}
if (!validateEmail(email)) {
  setAlert({ open: true, message: "Enter a valid email", color: "red" });
  return;
}
if (!Object.values(passwordValidations).every(Boolean)) {
  setAlert({ open: true, message: "Please meet all password requirements.", color: "red" });
  return;
}
if (confirmPassword.trim().length === 0) {
  setAlert({ open: true, message: "Please confirm your password.", color: "red" });
  return;
}
if (password !== confirmPassword) {
  setAlert({ open: true, message: "Passwords do not match.", color: "red" });
  return;
}

   const res = await fetch(
        "https://7m194xj0ba.execute-api.ap-southeast-1.amazonaws.com/dev/teachers/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: email, // email is username
            password: password,
          }),
        }
      );

    const data = await res.json();


    if (res.ok) {
      setAlert({ open: true, message: "Registered successfully!", color: "green" });
      navigate("/auth/sign-in");
    } else {
      setAlert({ open: true, message: data.message || "Registration failed!", color: "red" });
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-center gap-8">
        {/* Left side - Illustration */}
        <div className="hidden lg:block lg:w-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-800/20 rounded-3xl"></div>
            <img
              src="/img/pattern.png"
              className="h-96 w-full object-cover rounded-3xl shadow-2xl"
              alt="Register illustration"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent rounded-3xl flex items-end p-8">
              <div className="text-white">
                <Typography variant="h4" className="font-bold mb-2">
                  Join ARSCI Today
                </Typography>
                <Typography variant="paragraph" className="opacity-90">
                  Create your account and start managing your students with our powerful education platform
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Register Form */}
        <div className="w-full lg:w-1/2 max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardBody className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <Typography variant="h3" className="font-bold mb-2 text-gray-800">
                  Create Account
                </Typography>
                <Typography variant="paragraph" color="blue-gray" className="text-base font-normal">
                  Join our platform and start managing your students today
                </Typography>
              </div>

              {/* Alert message */}
              {alert.open && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  alert.color === 'red' 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : alert.color === 'green'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <Typography variant="small" className="font-medium">
                      {alert.message}
                    </Typography>
                    <button
                      onClick={() => setAlert({ ...alert, open: false })}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* First Name */}
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                    First Name
                  </Typography>
                  <Input
                    size="lg"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => setFirstNameTouched(true)}
                    className="!border-gray-300 focus:!border-blue-500 !bg-white"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                    icon={
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                  {firstNameTouched && !firstName.trim() && (
                    <Typography variant="small" color="red" className="mt-1 font-medium">
                      First name is required
                    </Typography>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                    Confirm Password
                  </Typography>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      size="lg"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setConfirmTouched(true)}
                      className="!border-gray-300 focus:!border-blue-500 !bg-white pr-12"
                      labelProps={{
                        className: "before:content-none after:content-none",
                      }}
                      icon={
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4-10-7 0-1.087.343-2.104.95-3M3 3l18 18M9.88 9.88A3 3 0 1114.12 14.12M9.88 9.88L3 3m11.12 11.12L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  {confirmTouched && password !== confirmPassword && (
                    <Typography variant="small" color="red" className="mt-1 font-medium">
                      Passwords do not match
                    </Typography>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                    Last Name
                  </Typography>
                  <Input
                    size="lg"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => setLastNameTouched(true)}
                    className="!border-gray-300 focus:!border-blue-500 !bg-white"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                    icon={
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                  {lastNameTouched && !lastName.trim() && (
                    <Typography variant="small" color="red" className="mt-1 font-medium">
                      Last name is required
                    </Typography>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                    Email Address
                  </Typography>
                  <Input
                    size="lg"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className="!border-gray-300 focus:!border-blue-500 !bg-white"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                    icon={
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    }
                  />
                  {emailTouched && !validateEmail(email) && (
                    <Typography variant="small" color="red" className="mt-1 font-medium">
                      Enter a valid email address
                    </Typography>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                    Password
                  </Typography>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      size="lg"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validatePassword(e.target.value);
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      className="!border-gray-300 focus:!border-blue-500 !bg-white pr-12"
                      labelProps={{
                        className: "before:content-none after:content-none",
                      }}
                      icon={
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4-10-7 0-1.087.343-2.104.95-3M3 3l18 18M9.88 9.88A3 3 0 1114.12 14.12M9.88 9.88L3 3m11.12 11.12L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Password checklist */}
                  {passwordTouched && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <Typography variant="small" className="font-semibold text-gray-700 mb-2">
                        Password Requirements:
                      </Typography>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-xs ${passwordValidations.length ? "text-green-600" : "text-red-500"}`}>
                          <span>{passwordValidations.length ? "✅" : "❌"}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordValidations.uppercase ? "text-green-600" : "text-red-500"}`}>
                          <span>{passwordValidations.uppercase ? "✅" : "❌"}</span>
                          <span>At least 1 uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordValidations.lowercase ? "text-green-600" : "text-red-500"}`}>
                          <span>{passwordValidations.lowercase ? "✅" : "❌"}</span>
                          <span>At least 1 lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordValidations.number ? "text-green-600" : "text-red-500"}`}>
                          <span>{passwordValidations.number ? "✅" : "❌"}</span>
                          <span>At least 1 number</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordValidations.specialChar ? "text-green-600" : "text-red-500"}`}>
                          <span>{passwordValidations.specialChar ? "✅" : "❌"}</span>
                          <span>At least 1 special character</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="mt-6 bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200" 
                  fullWidth
                  size="lg"
                >
                  Create Account
                </Button>

                <div className="text-center pt-4">
                  <Typography variant="paragraph" className="text-gray-600 font-medium">
                    Already have an account?{" "}
                    <Link to="/auth/sign-in" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                      Sign in
                    </Link>
                  </Typography>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default SignUp;
