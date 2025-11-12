import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
  QueueListIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, Sections, Module, Quiz, Students } from "@/pages/dashboard";


const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
      },
      { //teacher profile
        icon: <UserCircleIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      { //all sections and section creation
        icon: <TableCellsIcon {...icon} />,
        name: "sections",
        path: "/section",
        element: <Sections />,
      },
      { //all students and student creation
        icon: <QueueListIcon {...icon} />,
        name: "students",
        path: "/students",
        element: <Students />,
      },
      { //consist of all student quiz score
        icon: <QueueListIcon {...icon} />,
        name: "quiz progress",
        path: "/quiz",
        element: <Quiz />,
      },
      { //module progress
        icon: <TableCellsIcon {...icon} />,
        name: "module progress",
        path: "/module",
        element: <Module />,
      },
    ],
  }
];

export default routes;
