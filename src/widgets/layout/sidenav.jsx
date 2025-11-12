import PropTypes from "prop-types";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { PlusCircleIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import {
  Avatar,
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import React, { useState } from "react";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(() => {
    // Initialize from localStorage to persist across navigation
    return localStorage.getItem('studentsDropdownOpen') === 'true';
  });
  const navigate = useNavigate();

  // Save dropdown state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('studentsDropdownOpen', studentsDropdownOpen.toString());
  }, [studentsDropdownOpen]);
  const sidenavTypes = {
    dark: "bg-gradient-to-br from-blue-600 to-blue-800",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-gray-100`}
    >
      <div
        className={`relative`}
      >
        <Link to="/dashboard/home" className="py-6 px-8 text-center">
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
          >
             <Avatar
                src="/img/01.png"
                alt="arsci-logo"
                size="xxl"
                variant="square"
                className="object-fill w-28 h-28"
              />
          </Typography>
        </Link>

        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className="absolute right-0 top-0 grid rounded-br-none rounded-tl-none xl:hidden"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5 text-white" />
        </IconButton>
      </div>
      
      <div className="m-4">
        {routes.map(({ layout, title, pages }, key) => (
          <ul key={key} className="mb-4 flex flex-col gap-1">
            {title && (
              <li className="mx-3.5 mt-4 mb-2">
                <Typography
                  variant="small"
                  color={sidenavType === "dark" ? "white" : "blue-gray"}
                  className="font-black uppercase opacity-75"
                >
                  {title}
                </Typography>
              </li>
            )}
            {pages.map(({ icon, name, path }) => (
              <li key={name}>
                {name === "students" ? (
                  // Special dropdown for Students
                  <div>
                    <NavLink to={`/${layout}${path}`}>
                      {({ isActive }) => (
                        <div className="relative">
                          <Button
                            variant={isActive ? "gradient" : "text"}
                            color={
                              isActive
                                ? (sidenavColor === "dark" ? "blue-gray" : sidenavColor)
                                : sidenavType === "dark"
                                ? "white"
                                : "blue-gray"
                            }
                            className="flex items-center gap-4 px-4 capitalize"
                            fullWidth
                            onClick={(e) => {
                              e.preventDefault();
                              const newState = !studentsDropdownOpen;
                              setStudentsDropdownOpen(newState);
                              localStorage.setItem('studentsDropdownOpen', newState.toString());
                            }}
                          >
                            {icon}
                            <Typography
                              color="inherit"
                              className="font-medium capitalize flex-1 text-left"
                            >
                              {name}
                            </Typography>
                            {studentsDropdownOpen ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </NavLink>
                    
                    {/* Dropdown Menu */}
                    {studentsDropdownOpen && (
                      <div className="ml-4 mt-2 space-y-1">
                        <NavLink to={`/${layout}${path}`}>
                          {({ isActive }) => (
                            <Button
                              variant="text"
                              color={sidenavType === "dark" ? "white" : "blue-gray"}
                              className="flex items-center gap-3 px-4 py-2 text-sm capitalize w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-gray-800"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <UserGroupIcon className="h-4 w-4" />
                              <Typography
                                color="inherit"
                                className="font-medium capitalize text-sm"
                              >
                                All Students
                              </Typography>
                            </Button>
                          )}
                        </NavLink>
                        
                        <Button
                          variant="text"
                          color={sidenavType === "dark" ? "white" : "blue-gray"}
                          className="flex items-center gap-3 px-4 py-2 text-sm capitalize w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-900"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to students page and trigger batch add
                            navigate(`/${layout}${path}?action=add-batch`);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <Typography
                            color="inherit"
                            className="font-medium capitalize text-sm"
                          >
                            Add Student
                          </Typography>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular navigation for other items
                  <NavLink to={`/${layout}${path}`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        color={
                          isActive
                            ? (sidenavColor === "dark" ? "blue-gray" : sidenavColor)
                            : sidenavType === "dark"
                            ? "white"
                            : "blue-gray"
                        }
                        className="flex items-center gap-4 px-4 capitalize"
                        fullWidth
                      >
                        {icon}
                        <Typography
                          color="inherit"
                          className="font-medium capitalize"
                        >
                          {name}
                        </Typography>
                      </Button>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/1000060165.png",
  brandName: "ARSCI",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidnave.jsx";

export default Sidenav;
